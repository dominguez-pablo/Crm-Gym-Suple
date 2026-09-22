import prisma from '../db/prisma.js';
import { addDays, cuotaVigente, startOfDate, startOfToday } from '../utils/dates.js';
import {
  assertSucursalOperativa,
  cajaInclude,
  assertPlanParaSocio,
  calcularDeudaPeriodo,
  calcularRecargoMembresia,
  pagoInclude,
  periodoActual,
  resumenIngresosPostVencimiento,
  socioInclude,
} from '../utils/gym.js';
import { HttpError, asyncHandler, parseOptionalId } from '../utils/http.js';
import { serializePagoMembresia } from '../utils/serialize.js';
import { createPagoMembresiaSchema } from '../validators/pagoMembresia.validator.js';

function baseNuevoPeriodo(socio, fechaPago, modo) {
  const vencimiento = socio.fechaVencimiento ? startOfDate(socio.fechaVencimiento) : null;
  if (!vencimiento) return fechaPago;
  if (vencimiento >= startOfDate(fechaPago)) return vencimiento;
  if (modo === 'mantener') return vencimiento;
  return fechaPago;
}

async function registrarPagoYCaja(tx, {
  socio,
  plan,
  caja,
  sucursalId,
  usuarioId,
  monto,
  recargo,
  cuotas,
  medio,
  fechaPago,
  periodoDesde,
  periodoHasta,
  nota,
}) {
  const creado = await tx.pagoMembresia.create({
    data: {
      socioId: socio.id,
      planId: plan.id,
      sucursalId,
      usuarioId,
      monto,
      recargo,
      cuotas,
      medio,
      fechaPago,
      periodoDesde,
      periodoHasta,
      nota: nota ?? null,
    },
    include: pagoInclude,
  });

  await tx.cajaMovimiento.create({
    data: {
      cajaSesionId: caja.id,
      tipo: 'PAGO_MEMBRESIA',
      monto,
      concepto: recargo > 0
        ? `Membresía ${plan.nombre} — ${socio.persona.apellido}, ${socio.persona.nombre} (incl. recargo)`
        : `Membresía ${plan.nombre} — ${socio.persona.apellido}, ${socio.persona.nombre}`,
      medio,
      usuarioId,
      pagoMembresiaId: creado.id,
    },
  });

  return creado;
}

export const getPagos = asyncHandler(async (req, res) => {
  const socioId = parseOptionalId(req.query.socioId);
  const sucursalId = parseOptionalId(req.query.sucursalId);
  const pagos = await prisma.pagoMembresia.findMany({
    where: {
      ...(socioId ? { socioId } : {}),
      ...(sucursalId ? { sucursalId } : {}),
    },
    include: pagoInclude,
    orderBy: [{ fechaPago: 'desc' }, { createdAt: 'desc' }],
    take: sucursalId && !socioId ? 80 : 200,
  });
  return res.status(200).json(pagos.map(serializePagoMembresia));
});

export const createPago = asyncHandler(async (req, res) => {
  const data = createPagoMembresiaSchema.parse(req.body);

  const pago = await prisma.$transaction(async (tx) => {
    await assertSucursalOperativa(tx, req.user, data.sucursalId);

    const socio = await tx.socioGym.findUnique({
      where: { id: data.socioId },
      include: {
        ...socioInclude,
        accesos: { orderBy: { createdAt: 'desc' }, take: 40 },
      },
    });
    if (!socio) throw new HttpError(404, 'Socio no encontrado');
    if (!socio.activo) throw new HttpError(400, 'El socio está dado de baja');

    const plan = await tx.planMembresia.findUnique({ where: { id: data.planId } });
    if (!plan) throw new HttpError(404, 'Plan no encontrado');
    if (!plan.activa) throw new HttpError(400, 'El plan no está activo');
    assertPlanParaSocio(plan, socio.sucursalId);

    const caja = await tx.cajaSesion.findFirst({
      where: { sucursalId: data.sucursalId, estado: 'ABIERTA' },
      include: cajaInclude,
    });
    if (!caja) {
      throw new HttpError(400, 'Abrí la caja antes de cobrar una membresía');
    }

    const fechaPago = data.fechaPago ? startOfDate(data.fechaPago) : startOfToday();
    const deuda = socio.planId === plan.id ? calcularDeudaPeriodo(socio) : 0;
    const importe = data.monto ?? (deuda > 0 ? deuda : Number(plan.precio));
    const cuotas = data.medio === 'CREDITO' ? (data.cuotas === 3 ? 3 : 1) : null;
    const recargo = calcularRecargoMembresia(data.medio, importe, {
      cuotas,
      recargoTransferencia: data.recargo,
    });
    const periodo = periodoActual(socio);
    const ingresos = resumenIngresosPostVencimiento(socio.accesos, socio.fechaVencimiento);
    const modoSugerido = ingresos.cantidad > 0 ? 'mantener' : 'desde_hoy';
    const modo = data.modoVencimiento || modoSugerido;

    const pagosCreados = [];
    let fechaVencimiento = socio.fechaVencimiento ? new Date(socio.fechaVencimiento) : null;

    if (deuda > 0 && socio.fechaVencimiento) {
      const periodoHasta = periodo.hasta || socio.fechaVencimiento;
      const periodoDesde = periodo.desde || addDays(periodoHasta, -plan.duracionDias);
      const aSaldo = Math.min(importe, deuda);
      pagosCreados.push(
        await registrarPagoYCaja(tx, {
          socio,
          plan,
          caja,
          sucursalId: data.sucursalId,
          usuarioId: req.user.id,
          monto: Math.round((aSaldo + recargo) * 100) / 100,
          recargo,
          cuotas,
          medio: data.medio,
          fechaPago,
          periodoDesde,
          periodoHasta,
          nota: data.nota ?? 'Pago de saldo',
        }),
      );

      const sobrante = Math.round((importe - aSaldo) * 100) / 100;
      if (sobrante > 0) {
        const base = baseNuevoPeriodo(socio, fechaPago, modo);
        const nuevoHasta = addDays(base, plan.duracionDias);
        fechaVencimiento = nuevoHasta;
        pagosCreados.push(
          await registrarPagoYCaja(tx, {
            socio,
            plan,
            caja,
            sucursalId: data.sucursalId,
            usuarioId: req.user.id,
            monto: sobrante,
            recargo: 0,
            cuotas,
            medio: data.medio,
            fechaPago,
            periodoDesde: base,
            periodoHasta: nuevoHasta,
            nota: data.nota ?? 'Renovación',
          }),
        );
      }
    } else {
      const base = baseNuevoPeriodo(socio, fechaPago, modo);
      const periodoHasta = addDays(base, plan.duracionDias);
      fechaVencimiento = periodoHasta;
      pagosCreados.push(
        await registrarPagoYCaja(tx, {
          socio,
          plan,
          caja,
          sucursalId: data.sucursalId,
          usuarioId: req.user.id,
          monto: Math.round((importe + recargo) * 100) / 100,
          recargo,
          cuotas,
          medio: data.medio,
          fechaPago,
          periodoDesde: base,
          periodoHasta,
          nota: data.nota ?? null,
        }),
      );
    }

    await tx.socioGym.update({
      where: { id: socio.id },
      data: {
        planId: plan.id,
        fechaVencimiento,
        estadoCuota: cuotaVigente(fechaVencimiento, true),
      },
    });

    return pagosCreados[pagosCreados.length - 1];
  });

  return res.status(201).json(serializePagoMembresia(pago));
});
