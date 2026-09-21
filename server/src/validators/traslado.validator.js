import { z } from 'zod';

export const createTrasladoSchema = z
  .object({
    productoId: z.coerce.number().int().positive(),
    sucursalOrigenId: z.coerce.number().int().positive(),
    sucursalDestinoId: z.coerce.number().int().positive(),
    cantidad: z.coerce.number().int().positive('La cantidad debe ser mayor a 0'),
    nota: z.string().trim().optional().nullable(),
  })
  .superRefine((data, ctx) => {
    if (data.sucursalOrigenId === data.sucursalDestinoId) {
      ctx.addIssue({
        code: 'custom',
        message: 'El origen y el destino tienen que ser sucursales distintas',
        path: ['sucursalDestinoId'],
      });
    }
  });
