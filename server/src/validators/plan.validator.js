import { z } from 'zod';

const planFields = {
  nombre: z.string().trim().min(1, 'El nombre es obligatorio').max(80),
  duracionDias: z.coerce.number().int().positive('La duración tiene que ser mayor a 0'),
  precio: z.coerce.number().min(0, 'El precio no puede ser negativo'),
  activa: z.boolean().optional().default(true),
  multisede: z.boolean().optional().default(false),
  sucursalId: z.coerce.number().int().positive().nullable().optional(),
};

export const createPlanSchema = z.object(planFields).superRefine((data, ctx) => {
  if (!data.multisede && !data.sucursalId) {
    ctx.addIssue({
      code: 'custom',
      path: ['sucursalId'],
      message: 'Elegí la sede o marcá el plan como Multisede',
    });
  }
});

export const updatePlanSchema = z.object({
  nombre: z.string().trim().min(1, 'El nombre es obligatorio').max(80).optional(),
  duracionDias: z.coerce.number().int().positive('La duración tiene que ser mayor a 0').optional(),
  precio: z.coerce.number().min(0, 'El precio no puede ser negativo').optional(),
  activa: z.boolean().optional(),
  multisede: z.boolean().optional(),
  sucursalId: z.coerce.number().int().positive().nullable().optional(),
});
