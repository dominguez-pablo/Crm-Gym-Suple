import prisma from '../db/prisma.js';
import { HttpError, asyncHandler, parseId, parseOptionalId } from '../utils/http.js';
import { assertSucursalOperativa, cajaInclude, resumenCaja } from '../utils/gym.js';
import { serializeCaja } from '../utils/serialize.js';
import {
  abrirCajaSchema,
  cerrarCajaSchema,
  movimientoCajaSchema,
} from '../validators/caja.validator.js';

function withResumen(caja) {
  const serialized = serializeCaja(caja);
  const resumen = resumenCaja(caja);
  return { ...serialized, resumen };
}

async function cajaAbierta(client, sucursalId) {
  return client.cajaSesion.findFirst({
    where: { sucursalId, estado: 'ABIERTA' },
    include: cajaInclude,
  });
}

export const getCajaAbierta = asyncHandler(async (req, res) => {
  const sucursalId = parseOptionalId(req.query.sucursalId);
  if (!sucursalId) {
    throw new HttpError(400, 'La sucursal es obligatoria');
  }
  await assertSucursalOperativa(prisma, req.user, sucursalId);
  const caja = await cajaAbierta(prisma, sucursalId);
  return res.status(200).json(caja ? withResumen(caja) : null);
});

export const getCajas = asyncHandler(async (req, res) => {
  const sucursalId = parseOptionalId(req.query.sucursalId);
  if (!sucursalId) {
    throw new HttpError(400, 'La sucursal es obligatoria');
  }
  await assertSucursalOperativa(prisma, req.user, sucursalId);
  const cajas = await prisma.cajaSesion.findMany({
    where: { sucursalId },
    include: cajaInclude,
    orderBy: { abiertaEn: 'desc' },
    take: 20,
  });
  return res.status(200).json(cajas.map(withResumen));
});

export const abrirCaja = asyncHandler(async (req, res) => {
  const { sucursalId, montoApertura } = abrirCajaSchema.parse(req.body);
  await assertSucursalOperativa(prisma, req.user, sucursalId);

  const caja = await prisma.$transaction(async (tx) => {
    const abierta = await tx.cajaSesion.findFirst({
      where: { sucursalId, estado: 'ABIERTA' },
    });
    if (abierta) {
      throw new HttpError(409, 'Ya hay una caja abierta en esta sucursal');
    }

    const creada = await tx.cajaSesion.create({
      data: {
        sucursalId,
        montoApertura,
        usuarioAperturaId: req.user.id,
      },
    });

    await tx.cajaMovimiento.create({
      data: {
        cajaSesionId: creada.id,
        tipo: 'APERTURA',
        monto: montoApertura,
        concepto: 'Apertura de caja',
        medio: 'EFECTIVO',
        usuarioId: req.user.id,
      },
    });

    return tx.cajaSesion.findUnique({
      where: { id: creada.id },
      include: cajaInclude,
    });
  });

  return res.status(201).json(withResumen(caja));
});

export const crearMovimientoCaja = asyncHandler(async (req, res) => {
  const id = parseId(req.params.id);
  const data = movimientoCajaSchema.parse(req.body);

  const caja = await prisma.$transaction(async (tx) => {
    const sesion = await tx.cajaSesion.findUnique({ where: { id } });
    if (!sesion) throw new HttpError(404, 'Caja no encontrada');
    if (sesion.estado !== 'ABIERTA') {
      throw new HttpError(400, 'La caja ya está cerrada');
    }
    await assertSucursalOperativa(tx, req.user, sesion.sucursalId);

    await tx.cajaMovimiento.create({
      data: {
        cajaSesionId: id,
        tipo: data.tipo,
        monto: data.monto,
        concepto: data.concepto,
        medio: data.medio ?? 'EFECTIVO',
        usuarioId: req.user.id,
      },
    });

    return tx.cajaSesion.findUnique({
      where: { id },
      include: cajaInclude,
    });
  });

  return res.status(201).json(withResumen(caja));
});

export const cerrarCaja = asyncHandler(async (req, res) => {
  const id = parseId(req.params.id);
  const { montoCierreDeclarado, observaciones } = cerrarCajaSchema.parse(req.body);

  const caja = await prisma.$transaction(async (tx) => {
    const sesion = await tx.cajaSesion.findUnique({
      where: { id },
      include: { movimientos: true },
    });
    if (!sesion) throw new HttpError(404, 'Caja no encontrada');
    if (sesion.estado !== 'ABIERTA') {
      throw new HttpError(400, 'La caja ya está cerrada');
    }
    await assertSucursalOperativa(tx, req.user, sesion.sucursalId);

    const { efectivoEsperado } = resumenCaja(sesion);
    const diferencia = Number(montoCierreDeclarado) - efectivoEsperado;

    await tx.cajaMovimiento.create({
      data: {
        cajaSesionId: id,
        tipo: 'CIERRE',
        monto: montoCierreDeclarado,
        concepto: observaciones || 'Cierre de caja',
        medio: 'EFECTIVO',
        usuarioId: req.user.id,
      },
    });

    return tx.cajaSesion.update({
      where: { id },
      data: {
        estado: 'CERRADA',
        cerradaEn: new Date(),
        usuarioCierreId: req.user.id,
        montoCierreDeclarado,
        montoCierreSistema: efectivoEsperado,
        diferencia,
        observaciones: observaciones ?? null,
      },
      include: cajaInclude,
    });
  });

  return res.status(200).json(withResumen(caja));
});
