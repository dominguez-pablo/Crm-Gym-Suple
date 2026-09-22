import { z } from 'zod';

export const createSucursalSchema = z.object({
  nombre: z.string().trim().min(1, 'El nombre es obligatorio').max(80),
});

export const updateSucursalSchema = z.object({
  nombre: z.string().trim().min(1, 'El nombre es obligatorio').max(80),
});

export const cerrarSucursalSchema = z.object({
  sucursalDestinoId: z.coerce.number().int().positive().optional(),
});
