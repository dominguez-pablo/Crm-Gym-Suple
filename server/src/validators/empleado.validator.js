import { z } from 'zod';

export const createEmpleadoSchema = z.object({
  email: z.string().trim().email().transform((value) => value.toLowerCase()),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
  nombre: z.string().trim().min(1, 'El nombre es obligatorio'),
  apellido: z.string().trim().min(1, 'El apellido es obligatorio'),
  dni: z.string().trim().min(7, 'El DNI es obligatorio'),
  telefono: z.string().trim().optional().nullable(),
  role: z.enum(['SUPERADMIN', 'EMPLEADO']).optional().default('EMPLEADO'),
  sucursalId: z.coerce.number().int().positive().optional().nullable(),
  activo: z.boolean().optional().default(true),
});

export const updateEmpleadoSchema = z.object({
  email: z.string().trim().email().transform((value) => value.toLowerCase()).optional(),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres').optional(),
  nombre: z.string().trim().min(1).optional(),
  apellido: z.string().trim().min(1).optional(),
  dni: z.string().trim().min(7).optional(),
  telefono: z.string().trim().optional().nullable(),
  role: z.enum(['SUPERADMIN', 'EMPLEADO']).optional(),
  sucursalId: z.coerce.number().int().positive().optional().nullable(),
  activo: z.boolean().optional(),
});
