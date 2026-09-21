import bcrypt from 'bcryptjs';
import prisma from '../db/prisma.js';
import { cookieOptions, signToken } from '../middleware/auth.js';
import { HttpError, asyncHandler } from '../utils/http.js';
import { serializeUsuario } from '../utils/serialize.js';
import { loginSchema, registerSchema } from '../validators/auth.validator.js';

const usuarioInclude = { persona: true };

export const register = asyncHandler(async (req, res) => {
  const data = registerSchema.parse(req.body);
  const count = await prisma.usuario.count();
  const role = count === 0 ? 'SUPERADMIN' : 'EMPLEADO';
  const password = await bcrypt.hash(data.password, 10);

  const usuario = await prisma.usuario.create({
    data: {
      email: data.email,
      password,
      role,
      persona: {
        create: {
          dni: data.dni,
          nombre: data.nombre,
          apellido: data.apellido,
          telefono: data.telefono ?? null,
        },
      },
    },
    include: usuarioInclude,
  });

  const token = signToken(usuario);
  res.cookie('token', token, cookieOptions());
  return res.status(201).json(serializeUsuario(usuario));
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = loginSchema.parse(req.body);

  const usuario = await prisma.usuario.findUnique({
    where: { email },
    include: usuarioInclude,
  });

  if (!usuario) {
    throw new HttpError(401, 'Email o contraseña incorrectos');
  }

  const ok = await bcrypt.compare(password, usuario.password);
  if (!ok) {
    throw new HttpError(401, 'Email o contraseña incorrectos');
  }

  const token = signToken(usuario);
  res.cookie('token', token, cookieOptions());
  return res.status(200).json(serializeUsuario(usuario));
});

export const me = asyncHandler(async (req, res) => {
  const usuario = await prisma.usuario.findUnique({
    where: { id: req.user.id },
    include: usuarioInclude,
  });

  if (!usuario) {
    throw new HttpError(401, 'Sesión inválida');
  }

  return res.status(200).json(serializeUsuario(usuario));
});

export const logout = asyncHandler(async (req, res) => {
  res.clearCookie('token', { ...cookieOptions(), maxAge: 0 });
  return res.status(200).json({ message: 'Sesión cerrada' });
});
