import { z } from 'zod';

const pagoSchema = z.object({
  medio: z.enum(['EFECTIVO', 'TRANSFERENCIA', 'DEBITO', 'CREDITO', 'CONSIGNACION', 'OTRO']),
  monto: z.coerce.number().positive('El monto debe ser mayor a 0'),
  cuotas: z.coerce.number().int().optional().nullable(),
  nota: z.string().trim().optional().nullable(),
});

export const createVentaSchema = z
  .object({
    clienteId: z.coerce.number().int().positive().nullable().optional(),
    sucursalId: z.coerce.number().int().positive(),
    fecha: z.coerce.date().optional(),
    estado: z.enum(['SEPARADO', 'RETIRADO']).optional().default('RETIRADO'),
    items: z
      .array(
        z.object({
          productoId: z.coerce.number().int().positive(),
          cantidad: z.coerce.number().int().positive(),
          precioUnitario: z.coerce.number().positive('El precio debe ser mayor a 0'),
        }),
      )
      .min(1, 'La venta debe tener al menos un producto'),
    pagos: z.array(pagoSchema).min(1, 'La venta debe tener al menos un pago'),
  })
  .superRefine((data, ctx) => {
    const creditos = data.pagos.filter((pago) => pago.medio === 'CREDITO');
    if (creditos.length > 1) {
      ctx.addIssue({
        code: 'custom',
        message: 'Solo un pago con crédito por venta',
        path: ['pagos'],
      });
    }

    for (const [index, pago] of data.pagos.entries()) {
      if (pago.medio === 'CREDITO' && pago.cuotas !== 1 && pago.cuotas !== 3) {
        ctx.addIssue({
          code: 'custom',
          message: 'El crédito requiere 1 o 3 cuotas',
          path: ['pagos', index, 'cuotas'],
        });
      }
      if (pago.medio === 'OTRO' && !pago.nota) {
        ctx.addIssue({
          code: 'custom',
          message: 'Indicá el medio de pago',
          path: ['pagos', index, 'nota'],
        });
      }
    }
  });

export const updateEstadoVentaSchema = z.object({
  estado: z.literal('RETIRADO'),
});
