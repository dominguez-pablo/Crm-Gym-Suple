import prisma from '../db/prisma.js';
import { startOfToday } from '../utils/dates.js';
import { parseOptionalId, asyncHandler, HttpError } from '../utils/http.js';
import { assertGymSucursal, cajaInclude, resumenCaja } from '../utils/gym.js';
import { serializeAcceso, serializeCaja, serializePagoMembresia } from '../utils/serialize.js';

export const getGymDashboard = asyncHandler(async (req, res) => {
  const sucursalId = parseOptionalId(req.query.sucursalId);
  if (!sucursalId) {
    throw new HttpError(400, 'La sucursal es obligatoria');
  }
  await assertGymSucursal(prisma, sucursalId);

  const hoy = startOfToday();

  const [
    sociosActivos,
    sociosVencidos,
    accesosHoy,
    recaudacionHoy,
    caja,
    pagosRecientes,
    ingresosRecientes,
  ] = await Promise.all([
    prisma.socioGym.count({
      where: { activo: true, fechaVencimiento: { gte: hoy } },
    }),
    prisma.socioGym.count({
      where: {
        activo: true,
        OR: [{ fechaVencimiento: null }, { fechaVencimiento: { lt: hoy } }],
      },
    }),
    prisma.accesoGym.count({
      where: { sucursalId, createdAt: { gte: hoy } },
    }),
    prisma.pagoMembresia.aggregate({
      where: { sucursalId, createdAt: { gte: hoy } },
      _sum: { monto: true },
      _count: { _all: true },
    }),
    prisma.cajaSesion.findFirst({
      where: { sucursalId, estado: 'ABIERTA' },
      include: cajaInclude,
    }),
    prisma.pagoMembresia.findMany({
      where: { sucursalId },
      include: {
        socio: { include: { persona: true } },
        plan: true,
        usuario: { include: { persona: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 8,
    }),
    prisma.accesoGym.findMany({
      where: { sucursalId },
      include: {
        socio: { include: { persona: true, plan: true } },
        usuario: { include: { persona: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 8,
    }),
  ]);

  return res.status(200).json({
    kpis: {
      sociosActivos,
      sociosVencidos,
      accesosHoy,
      pagosHoy: recaudacionHoy._count._all,
      totalHoy: Number(recaudacionHoy._sum.monto ?? 0),
      cajaAbierta: Boolean(caja),
    },
    caja: caja ? { ...serializeCaja(caja), resumen: resumenCaja(caja) } : null,
    pagosRecientes: pagosRecientes.map(serializePagoMembresia),
    accesosRecientes: ingresosRecientes.map(serializeAcceso),
  });
});
