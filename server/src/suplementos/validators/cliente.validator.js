import { z } from 'zod';

export const createClienteSchema = z.object({
  dni: z.string().trim().min(7, 'El DNI es obligatorio'),
  nombre: z.string().trim().min(1, 'El nombre es obligatorio'),
  apellido: z.string().trim().min(1, 'El apellido es obligatorio'),
  telefono: z.string().trim().optional().nullable(),
  tipo: z.enum(['MINORISTA', 'MAYORISTA', 'SOCIO_GYM']).optional().default('MINORISTA'),
  deuda: z.coerce.number().min(0).optional().default(0),
});

export const updateClienteSchema = createClienteSchema.partial();
