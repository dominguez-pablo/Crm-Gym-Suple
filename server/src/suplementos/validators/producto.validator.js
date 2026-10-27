import { z } from 'zod';

const stockItemSchema = z.object({
  sucursalId: z.coerce.number().int().positive(),
  cantidad: z.coerce.number().int().min(0).optional(),
  stockMinimo: z.coerce.number().int().min(0).optional(),
});

export const createProductoSchema = z.object({
  nombre: z.string().trim().min(1, 'El nombre es obligatorio'),
  descripcion: z.string().trim().optional().nullable(),
  marca: z.string().trim().optional().nullable(),
  precioCosto: z.coerce.number().nonnegative(),
  precioMayorista: z.coerce.number().nonnegative(),
  precioRecomendado: z.coerce.number().nonnegative(),
  precioPublico: z.coerce.number().nonnegative(),
  stocks: z.array(stockItemSchema).optional().default([]),
});

export const updateProductoSchema = createProductoSchema.partial();

export const updateStockSchema = z.object({
  sucursalId: z.coerce.number().int().positive(),
  cantidad: z.coerce.number().int().min(0),
  stockMinimo: z.coerce.number().int().min(0).optional(),
});
