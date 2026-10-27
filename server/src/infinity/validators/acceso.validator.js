import { z } from 'zod';

export const createAccesoSchema = z.object({
  dni: z.string().trim().min(7, 'El DNI es obligatorio'),
  sucursalId: z.coerce.number().int().positive(),
});
