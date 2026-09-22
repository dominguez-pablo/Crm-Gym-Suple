import prisma from '../db/prisma.js';
import { cuotaVigente } from '../utils/dates.js';
import { assertSucursalOperativa, motivoAccesoSede, socioInclude } from '../utils/gym.js';
import { asyncHandler, parseOptionalId } from '../utils/http.js';
import { serializeAcceso } from '../utils/serialize.js';
import { createAccesoSchema } from '../validators/acceso.validator.js';

const accesoInclude = {
  socio: { include: socioInclude },
  sucursal: true,
  usuario: { include: { persona: true } },
};

export const getAccesos = asyncHandler(async (req, res) => {
  const sucursalId = parseOptionalId(req.query.sucursalId);
  const dni = String(req.query.dni || '').trim();
  const accesos = await prisma.accesoGym.findMany({
    where: {
      ...(sucursalId ? { sucursalId } : {}),
      ...(dni ? { dni: { contains: dni } } : {}),
    },
    include: accesoInclude,
    orderBy: { createdAt: 'desc' },
    take: 120,
  });
  return res.status(200).json(accesos.map(serializeAcceso));
});

export const createAcceso = asyncHandler(async (req, res) => {
  const { dni, sucursalId } = createAccesoSchema.parse(req.body);
  await assertSucursalOperativa(prisma, req.user, sucursalId);

  const persona = await prisma.persona.findUnique({
    where: { dni },
    include: { socioGym: { include: socioInclude } },
  });

  let resultado = 'DENEGADO';
  let motivo = 'DNI no registrado';
  let socio = persona?.socioGym ?? null;

  if (!persona) {
    motivo = 'DNI no registrado';
  } else if (!socio) {
    motivo = 'La persona no es socio del gimnasio';
  } else if (!socio.activo) {
    motivo = 'El socio está dado de baja';
  } else if (!cuotaVigente(socio.fechaVencimiento, socio.activo)) {
    motivo = socio.fechaVencimiento
      ? 'Membresía vencida'
      : 'El socio no tiene una membresía paga';
  } else {
    const motivoSede = motivoAccesoSede(socio, sucursalId);
    if (motivoSede) {
      motivo = motivoSede;
    } else {
      resultado = 'PERMITIDO';
      motivo = null;
    }
  }

  const acceso = await prisma.accesoGym.create({
    data: {
      dni,
      sucursalId,
      usuarioId: req.user.id,
      socioId: socio?.id ?? null,
      resultado,
      motivo,
    },
    include: accesoInclude,
  });

  return res.status(200).json(serializeAcceso(acceso));
});
