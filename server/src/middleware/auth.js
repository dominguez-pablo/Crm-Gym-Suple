import jwt from 'jsonwebtoken';
import { HttpError } from '../utils/http.js';

const STAFF_ROLES = ['SUPERADMIN', 'EMPLEADO'];

export function signToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '7d' },
  );
}

export function cookieOptions() {
  return {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  };
}

export function requireAuth(req, res, next) {
  try {
    const token = req.cookies?.token;
    if (!token) {
      throw new HttpError(401, 'No autenticado');
    }

    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch (error) {
    if (error instanceof HttpError) {
      next(error);
      return;
    }
    next(new HttpError(401, 'Sesión inválida o expirada'));
  }
}

export function requireRole(...roles) {
  const allowed = roles.length > 0 ? roles : STAFF_ROLES;

  return (req, res, next) => {
    if (!req.user) {
      next(new HttpError(401, 'No autenticado'));
      return;
    }

    if (!allowed.includes(req.user.role)) {
      next(new HttpError(403, 'No tenés permisos para esta acción'));
      return;
    }

    next();
  };
}
