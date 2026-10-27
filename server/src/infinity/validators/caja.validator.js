import { z } from 'zod';

export const abrirCajaSchema = z.object({
  sucursalId: z.coerce.number().int().positive(),
  montoApertura: z.coerce.number().min(0, 'El monto de apertura no puede ser negativo'),
});

export const movimientoCajaSchema = z.object({
  tipo: z.enum(['INGRESO', 'EGRESO']),
  monto: z.coerce.number().positive('El monto tiene que ser mayor a 0'),
  concepto: z.string().trim().min(1, 'El concepto es obligatorio').max(160),
  medio: z.enum(['EFECTIVO', 'TRANSFERENCIA', 'DEBITO', 'CREDITO', 'OTRO']).optional(),
});

export const cerrarCajaSchema = z.object({
  montoCierreDeclarado: z.coerce.number().min(0, 'El monto de cierre no puede ser negativo'),
  observaciones: z.string().trim().optional().nullable(),
});
