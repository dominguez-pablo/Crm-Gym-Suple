import prisma from '../db/prisma.js';
import { cuotaVigente, startOfToday } from '../utils/dates.js';
import { HttpError, asyncHandler, parseId, parseOptionalId } from '../utils/http.js';
import {
  assertPlanParaSocio,
  calcularDeudaPeriodo,
  calcularPagadoPeriodo,
  periodoActual,
  resumenIngresosPostVencimiento,
  socioDetalleInclude,
  socioInclude,
} from '../utils/gym.js';
import { serializeSocio } from '../utils/serialize.js';
import { createSocioSchema, updateSocioSchema } from '../validators/socio.validator.js';

function serializeSocioEstado(socio, options = {}) {
  const estadoCuota = cuotaVigente(socio.fechaVencimiento, socio.activo);
  const { pagos, accesos, ...rest } = socio;
  return serializeSocio({
    ...rest,
    estadoCuota,
    deuda: calcularDeudaPeriodo(socio),
    pagadoPeriodo: calcularPagadoPeriodo(socio),
    periodoActual: periodoActual(socio),
    ingresosPostVencimiento: options.ingresos ?? null,
    pagos: options.includePagos ? pagos : undefined,
    accesos: options.includeAccesos ? accesos : undefined,
  });
}

async function ensureClienteFitMarket(tx, personaId) {
  await tx.clienteFitMarket.upsert({
    where: { personaId },
    update: {},
    create: { personaId, tipo: 'SOCIO_GYM' },
  });
}

export const getSocios = asyncHandler(async (req, res) => {
  const estado = String(req.query.estado || 'todos').toLowerCase();
  const q = String(req.query.q || '').trim();
  const sucursalId = parseOptionalId(req.query.sucursalId);
  const hoy = startOfToday();

  const filtros = [];
  if (sucursalId) filtros.push({ sucursalId });
  if (q) {
    filtros.push({
      persona: {
        OR: [
          { dni: { contains: q, mode: 'insensitive' } },
          { nombre: { contains: q, mode: 'insensitive' } },
          { apellido: { contains: q, mode: 'insensitive' } },
        ],
      },
    });
  }
  if (estado === 'activos') {
    filtros.push({ activo: true, fechaVencimiento: { gte: hoy } });
  } else if (estado === 'vencidos') {
    filtros.push({
      activo: true,
      OR: [{ fechaVencimiento: null }, { fechaVencimiento: { lt: hoy } }],
    });
  }

  const where = filtros.length > 0 ? { AND: filtros } : {};

  const socios = await prisma.socioGym.findMany({
    where,
    include: socioInclude,
    orderBy: { id: 'desc' },
  });
  return res.status(200).json(socios.map(serializeSocioEstado));
});

export const getSocio = asyncHandler(async (req, res) => {
  const socio = await prisma.socioGym.findUnique({
    where: { id: parseId(req.params.id) },
    include: socioDetalleInclude,
  });
  if (!socio) {
    throw new HttpError(404, 'Socio no encontrado');
  }
  return res.status(200).json(
    serializeSocioEstado(socio, {
      includePagos: true,
      includeAccesos: true,
      ingresos: resumenIngresosPostVencimiento(socio.accesos, socio.fechaVencimiento),
    }),
  );
});

export const createSocio = asyncHandler(async (req, res) => {
  const data = createSocioSchema.parse(req.body);

  const socio = await prisma.$transaction(async (tx) => {
    if (data.sucursalId) {
      const sucursal = await tx.sucursal.findUnique({ where: { id: data.sucursalId } });
      if (!sucursal) throw new HttpError(404, 'Sucursal no encontrada');
    }
    if (data.planId) {
      const plan = await tx.planMembresia.findUnique({ where: { id: data.planId } });
      assertPlanParaSocio(plan, data.sucursalId ?? null);
    }

    let persona = await tx.persona.findUnique({ where: { dni: data.dni } });
    if (persona) {
      const existente = await tx.socioGym.findUnique({ where: { personaId: persona.id } });
      if (existente) {
        throw new HttpError(409, 'Ya existe un socio con ese DNI');
      }
      persona = await tx.persona.update({
        where: { id: persona.id },
        data: {
          nombre: data.nombre,
          apellido: data.apellido,
          telefono: data.telefono ?? persona.telefono,
        },
      });
    } else {
      persona = await tx.persona.create({
        data: {
          dni: data.dni,
          nombre: data.nombre,
          apellido: data.apellido,
          telefono: data.telefono ?? null,
        },
      });
    }

    await ensureClienteFitMarket(tx, persona.id);

    return tx.socioGym.create({
      data: {
        personaId: persona.id,
        sucursalId: data.sucursalId ?? null,
        planId: data.planId ?? null,
        activo: data.activo,
        estadoCuota: false,
      },
      include: socioInclude,
    });
  });

  return res.status(201).json(serializeSocioEstado(socio));
});

export const updateSocio = asyncHandler(async (req, res) => {
  const id = parseId(req.params.id);
  const data = updateSocioSchema.parse(req.body);

  const socio = await prisma.$transaction(async (tx) => {
    const existente = await tx.socioGym.findUnique({ where: { id } });
    if (!existente) return null;

    if (data.sucursalId) {
      const sucursal = await tx.sucursal.findUnique({ where: { id: data.sucursalId } });
      if (!sucursal) throw new HttpError(404, 'Sucursal no encontrada');
    }
    const sucursalId = data.sucursalId !== undefined ? data.sucursalId : existente.sucursalId;
    const planId = data.planId !== undefined ? data.planId : existente.planId;
    const planCambia = data.planId !== undefined && data.planId !== existente.planId;
    const sedeCambia = data.sucursalId !== undefined && data.sucursalId !== existente.sucursalId;
    if (planId && (planCambia || sedeCambia)) {
      const plan = await tx.planMembresia.findUnique({ where: { id: planId } });
      assertPlanParaSocio(plan, sucursalId);
    }

    const personaData = {};
    if (data.dni !== undefined) personaData.dni = data.dni;
    if (data.nombre !== undefined) personaData.nombre = data.nombre;
    if (data.apellido !== undefined) personaData.apellido = data.apellido;
    if (data.telefono !== undefined) personaData.telefono = data.telefono;

    if (Object.keys(personaData).length > 0) {
      await tx.persona.update({
        where: { id: existente.personaId },
        data: personaData,
      });
    }

    return tx.socioGym.update({
      where: { id },
      data: {
        ...(data.sucursalId !== undefined ? { sucursalId: data.sucursalId } : {}),
        ...(data.planId !== undefined ? { planId: data.planId } : {}),
        ...(data.activo !== undefined ? { activo: data.activo } : {}),
      },
      include: socioInclude,
    });
  });

  if (!socio) {
    throw new HttpError(404, 'Socio no encontrado');
  }
  return res.status(200).json(serializeSocioEstado(socio));
});
