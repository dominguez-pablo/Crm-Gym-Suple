import { z } from 'zod';

const modulosSchema = z
  .array(z.enum(['FIT_MARKET', 'GYM']))
  .min(1, 'Elegí al menos un módulo');

export const createSucursalSchema = z.object({
  nombre: z.string().trim().min(1, 'El nombre es obligatorio').max(80),
  modulos: modulosSchema.optional().default(['FIT_MARKET']),
});

export const updateSucursalSchema = z.object({
  nombre: z.string().trim().min(1, 'El nombre es obligatorio').max(80).optional(),
  modulos: modulosSchema.optional(),
});

export const cerrarSucursalSchema = z.object({
  sucursalDestinoId: z.coerce.number().int().positive().optional(),
});
