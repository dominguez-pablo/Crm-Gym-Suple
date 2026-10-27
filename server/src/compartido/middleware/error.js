import { ZodError } from 'zod';
import { HttpError } from '../utils/http.js';

export function notFound(req, res) {
  res.status(404).json({ message: 'Ruta no encontrada' });
}

export function errorHandler(err, req, res, next) {
  if (res.headersSent) {
    next(err);
    return;
  }

  if (err instanceof ZodError) {
    return res.status(400).json({
      message: 'Datos inválidos',
      errors: err.issues.map((issue) => ({
        path: issue.path.join('.'),
        message: issue.message,
      })),
    });
  }

  if (err instanceof HttpError) {
    return res.status(err.status).json({ message: err.message });
  }

  if (err.code === 'P2025') {
    return res.status(404).json({ message: 'Registro no encontrado' });
  }

  if (err.code === 'P2002') {
    const fields = err.meta?.target;
    return res.status(409).json({
      message: 'Ya existe un registro con esos datos únicos',
      fields,
    });
  }

  if (err.code === 'P2003') {
    return res.status(409).json({
      message: 'No se puede eliminar porque tiene registros asociados',
    });
  }

  console.error(err);
  return res.status(500).json({ message: 'Error interno del servidor' });
}
