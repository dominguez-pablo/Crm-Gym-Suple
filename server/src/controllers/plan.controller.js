import prisma from '../db/prisma.js';
import { HttpError, asyncHandler, parseId } from '../utils/http.js';
import { hasModulo, planInclude } from '../utils/gym.js';
import { serializePlan } from '../utils/serialize.js';
import { createPlanSchema, updatePlanSchema } from '../validators/plan.validator.js';

async function assertSedePlan(client, sucursalId) {
  const sucursal = await client.sucursal.findUnique({ where: { id: sucursalId } });
  if (!sucursal) throw new HttpError(404, 'Sucursal no encontrada');
  if (!hasModulo(sucursal, 'GYM')) {
    throw new HttpError(400, 'La sucursal no pertenece a Infinity Academia');
  }
  return sucursal;
}

async function datosPlan(client, data, actual = null) {
  const multisede = data.multisede !== undefined ? data.multisede : Boolean(actual?.multisede);
  const sucursalId = multisede
    ? null
    : data.sucursalId !== undefined
      ? data.sucursalId
      : actual?.sucursalId ?? null;

  if (!multisede && !sucursalId) {
    throw new HttpError(400, 'Elegí la sede o marcá el plan como Multisede');
  }
  if (sucursalId) {
    await assertSedePlan(client, sucursalId);
  }

  return {
    ...(data.nombre !== undefined ? { nombre: data.nombre } : {}),
    ...(data.duracionDias !== undefined ? { duracionDias: data.duracionDias } : {}),
    ...(data.precio !== undefined ? { precio: data.precio } : {}),
    ...(data.activa !== undefined ? { activa: data.activa } : {}),
    multisede,
    sucursalId,
  };
}

export const getPlanes = asyncHandler(async (req, res) => {
  const todas = req.query.todas === '1' || req.query.todas === 'true';
  const planes = await prisma.planMembresia.findMany({
    where: todas && req.user.role === 'SUPERADMIN' ? undefined : { activa: true },
    include: planInclude,
    orderBy: [{ multisede: 'asc' }, { nombre: 'asc' }],
  });
  return res.status(200).json(planes.map(serializePlan));
});

export const createPlan = asyncHandler(async (req, res) => {
  const data = createPlanSchema.parse(req.body);
  const payload = await datosPlan(prisma, data);
  const plan = await prisma.planMembresia.create({
    data: payload,
    include: planInclude,
  });
  return res.status(201).json(serializePlan(plan));
});

export const updatePlan = asyncHandler(async (req, res) => {
  const id = parseId(req.params.id);
  const data = updatePlanSchema.parse(req.body);
  const actual = await prisma.planMembresia.findUnique({ where: { id } });
  if (!actual) throw new HttpError(404, 'Plan no encontrado');
  const payload = await datosPlan(prisma, data, actual);
  const plan = await prisma.planMembresia.update({
    where: { id },
    data: payload,
    include: planInclude,
  });
  return res.status(200).json(serializePlan(plan));
});
