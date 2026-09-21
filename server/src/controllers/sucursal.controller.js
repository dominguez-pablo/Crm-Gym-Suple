import prisma from '../db/prisma.js';
import { asyncHandler } from '../utils/http.js';

export const getSucursales = asyncHandler(async (req, res) => {
  const sucursales = await prisma.sucursal.findMany({
    where: { activa: true },
    orderBy: { id: 'asc' },
  });
  return res.status(200).json(sucursales);
});
