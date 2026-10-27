import { z } from 'zod';

const personaFields = {
  dni: z.string().trim().min(7, 'El DNI es obligatorio'),
  nombre: z.string().trim().min(1, 'El nombre es obligatorio'),
  apellido: z.string().trim().min(1, 'El apellido es obligatorio'),
  telefono: z.string().trim().optional().nullable(),
};

export const createSocioSchema = z.object({
  ...personaFields,
  sucursalId: z.coerce.number().int().positive().optional().nullable(),
  planId: z.coerce.number().int().positive().optional().nullable(),
  activo: z.boolean().optional().default(true),
});

export const updateSocioSchema = z.object({
  dni: personaFields.dni.optional(),
  nombre: personaFields.nombre.optional(),
  apellido: personaFields.apellido.optional(),
  telefono: personaFields.telefono,
  sucursalId: z.coerce.number().int().positive().optional().nullable(),
  planId: z.coerce.number().int().positive().optional().nullable(),
  activo: z.boolean().optional(),
});
