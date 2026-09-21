import prisma from '../db/prisma.js';
import { asyncHandler, parseId } from '../utils/http.js';
import { serializeCliente } from '../utils/serialize.js';
import {
  createClienteSchema,
  updateClienteSchema,
} from '../validators/cliente.validator.js';

export const getClientes = asyncHandler(async (req, res) => {
  const clientes = await prisma.clienteFitMarket.findMany({
    include: { persona: true },
    orderBy: { id: 'desc' },
  });
  return res.status(200).json(clientes.map(serializeCliente));
});

export const getCliente = asyncHandler(async (req, res) => {
  const id = parseId(req.params.id);
  const cliente = await prisma.clienteFitMarket.findUnique({
    where: { id },
    include: { persona: true },
  });

  if (!cliente) {
    return res.status(404).json({ message: 'Cliente no encontrado' });
  }

  return res.status(200).json(serializeCliente(cliente));
});

export const createCliente = asyncHandler(async (req, res) => {
  const data = createClienteSchema.parse(req.body);

  const cliente = await prisma.$transaction(async (tx) => {
    const persona = await tx.persona.create({
      data: {
        dni: data.dni,
        nombre: data.nombre,
        apellido: data.apellido,
        telefono: data.telefono ?? null,
      },
    });

    const creado = await tx.clienteFitMarket.create({
      data: {
        personaId: persona.id,
        tipo: data.tipo,
        deuda: data.deuda,
      },
      include: { persona: true },
    });

    if (data.tipo === 'SOCIO_GYM') {
      await tx.socioGym.create({
        data: { personaId: persona.id, estadoCuota: false },
      });
    }

    return creado;
  });

  return res.status(201).json(serializeCliente(cliente));
});

export const updateCliente = asyncHandler(async (req, res) => {
  const id = parseId(req.params.id);
  const data = updateClienteSchema.parse(req.body);

  const cliente = await prisma.$transaction(async (tx) => {
    const existente = await tx.clienteFitMarket.findUnique({
      where: { id },
      include: { persona: true },
    });

    if (!existente) {
      return null;
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

    const clienteData = {};
    if (data.tipo !== undefined) clienteData.tipo = data.tipo;
    if (data.deuda !== undefined) clienteData.deuda = data.deuda;

    const actualizado = await tx.clienteFitMarket.update({
      where: { id },
      data: clienteData,
      include: { persona: true },
    });

    if (data.tipo === 'SOCIO_GYM') {
      await tx.socioGym.upsert({
        where: { personaId: existente.personaId },
        update: {},
        create: { personaId: existente.personaId, estadoCuota: false },
      });
    }

    return actualizado;
  });

  if (!cliente) {
    return res.status(404).json({ message: 'Cliente no encontrado' });
  }

  return res.status(200).json(serializeCliente(cliente));
});
