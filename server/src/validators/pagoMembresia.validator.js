import { z } from 'zod';

export const createPagoMembresiaSchema = z
  .object({
    socioId: z.coerce.number().int().positive(),
    planId: z.coerce.number().int().positive(),
    sucursalId: z.coerce.number().int().positive(),
    medio: z.enum(['EFECTIVO', 'TRANSFERENCIA', 'DEBITO', 'CREDITO']),
    monto: z.coerce.number().positive().optional(),
    recargo: z.coerce.number().min(0).optional(),
    cuotas: z.coerce.number().int().optional(),
    fechaPago: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'La fecha de pago no es válida')
      .optional(),
    nota: z.string().trim().optional().nullable(),
    modoVencimiento: z.enum(['mantener', 'desde_hoy']).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.medio === 'CREDITO' && data.cuotas != null && data.cuotas !== 1 && data.cuotas !== 3) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['cuotas'],
        message: 'El crédito admite 1 o 3 cuotas',
      });
    }
  });
