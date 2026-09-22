import bcrypt from 'bcryptjs';
import prisma from '../db/prisma.js';
import { HttpError, asyncHandler, parseId } from '../utils/http.js';
import { serializeUsuario } from '../utils/serialize.js';
import {
  createEmpleadoSchema,
  updateEmpleadoSchema,
} from '../validators/empleado.validator.js';

const empleadoInclude = { persona: true, sucursal: true };

async function assertPuedeCambiarRol(tx, empleadoId, nextRole) {
  if (nextRole !== 'EMPLEADO') return;
  const actual = await tx.usuario.findUnique({ where: { id: empleadoId } });
  if (actual?.role !== 'SUPERADMIN') return;
  const superadmins = await tx.usuario.count({
    where: { role: 'SUPERADMIN', activo: true },
  });
  if (superadmins <= 1) {
    throw new HttpError(400, 'Tiene que quedar al menos un superadmin activo');
  }
}

export const getEmpleados = asyncHandler(async (_req, res) => {
  const empleados = await prisma.usuario.findMany({
    include: empleadoInclude,
    orderBy: { id: 'asc' },
  });
  return res.status(200).json(empleados.map(serializeUsuario));
});

export const createEmpleado = asyncHandler(async (req, res) => {
  const data = createEmpleadoSchema.parse(req.body);

  const empleado = await prisma.$transaction(async (tx) => {
    if (data.sucursalId) {
      const sucursal = await tx.sucursal.findUnique({ where: { id: data.sucursalId } });
      if (!sucursal) throw new HttpError(404, 'Sucursal no encontrada');
    }

    const password = await bcrypt.hash(data.password, 10);
    let persona = await tx.persona.findUnique({ where: { dni: data.dni } });
    if (persona?.usuarioId) {
      throw new HttpError(409, 'Ese DNI ya tiene un usuario');
    }

    const usuario = await tx.usuario.create({
      data: {
        email: data.email,
        password,
        role: data.role,
        activo: data.activo,
        sucursalId: data.sucursalId ?? null,
      },
    });

    if (persona) {
      await tx.persona.update({
        where: { id: persona.id },
        data: {
          usuarioId: usuario.id,
          nombre: data.nombre,
          apellido: data.apellido,
          telefono: data.telefono ?? persona.telefono,
        },
      });
    } else {
      await tx.persona.create({
        data: {
          dni: data.dni,
          nombre: data.nombre,
          apellido: data.apellido,
          telefono: data.telefono ?? null,
          usuarioId: usuario.id,
        },
      });
    }

    return tx.usuario.findUnique({
      where: { id: usuario.id },
      include: empleadoInclude,
    });
  });

  return res.status(201).json(serializeUsuario(empleado));
});

export const updateEmpleado = asyncHandler(async (req, res) => {
  const id = parseId(req.params.id);
  const data = updateEmpleadoSchema.parse(req.body);

  const empleado = await prisma.$transaction(async (tx) => {
    const existente = await tx.usuario.findUnique({
      where: { id },
      include: { persona: true },
    });
    if (!existente) return null;

    if (data.role) {
      await assertPuedeCambiarRol(tx, id, data.role);
    }
    if (data.activo === false && existente.role === 'SUPERADMIN') {
      await assertPuedeCambiarRol(tx, id, 'EMPLEADO');
    }
    if (data.sucursalId) {
      const sucursal = await tx.sucursal.findUnique({ where: { id: data.sucursalId } });
      if (!sucursal) throw new HttpError(404, 'Sucursal no encontrada');
    }

    const usuarioData = {};
    if (data.email !== undefined) usuarioData.email = data.email;
    if (data.role !== undefined) usuarioData.role = data.role;
    if (data.activo !== undefined) usuarioData.activo = data.activo;
    if (data.sucursalId !== undefined) usuarioData.sucursalId = data.sucursalId;
    if (data.password) {
      usuarioData.password = await bcrypt.hash(data.password, 10);
    }

    if (Object.keys(usuarioData).length > 0) {
      await tx.usuario.update({ where: { id }, data: usuarioData });
    }

    const personaData = {};
    if (data.dni !== undefined) personaData.dni = data.dni;
    if (data.nombre !== undefined) personaData.nombre = data.nombre;
    if (data.apellido !== undefined) personaData.apellido = data.apellido;
    if (data.telefono !== undefined) personaData.telefono = data.telefono;

    if (Object.keys(personaData).length > 0) {
      if (existente.persona) {
        await tx.persona.update({
          where: { id: existente.persona.id },
          data: personaData,
        });
      } else if (data.dni && data.nombre && data.apellido) {
        await tx.persona.create({
          data: {
            ...personaData,
            usuarioId: id,
          },
        });
      }
    }

    return tx.usuario.findUnique({
      where: { id },
      include: empleadoInclude,
    });
  });

  if (!empleado) {
    throw new HttpError(404, 'Empleado no encontrado');
  }
  return res.status(200).json(serializeUsuario(empleado));
});
