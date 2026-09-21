import prisma from '../db/prisma.js';
import { asyncHandler, parseOptionalId } from '../utils/http.js';
import { serializeVenta } from '../utils/serialize.js';

export const getDashboard = asyncHandler(async (req, res) => {
  const sucursalId = parseOptionalId(req.query.sucursalId);
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const ventaWhere = {
    fecha: { gte: startOfDay },
    ...(sucursalId ? { sucursalId } : {}),
  };

  const [stocks, ventasHoyAgg, ventasRecientes, clientesCount, productosCount] = await Promise.all([
    prisma.stockSucursal.findMany({
      where: sucursalId ? { sucursalId } : undefined,
      include: {
        producto: true,
        sucursal: true,
      },
      orderBy: [{ sucursalId: 'asc' }, { productoId: 'asc' }],
    }),
    prisma.venta.aggregate({
      where: ventaWhere,
      _count: { _all: true },
      _sum: { total: true },
    }),
    prisma.venta.findMany({
      take: 8,
      where: sucursalId ? { sucursalId } : undefined,
      orderBy: { fecha: 'desc' },
      include: {
        cliente: { include: { persona: true } },
        sucursal: true,
        detalles: true,
      },
    }),
    prisma.clienteFitMarket.count(),
    prisma.producto.count(),
  ]);

  const stockBajo = stocks
    .filter((stock) => stock.cantidad <= stock.stockMinimo)
    .map((stock) => ({
      id: stock.id,
      productoId: stock.productoId,
      nombre: stock.producto.nombre,
      sucursalId: stock.sucursalId,
      sucursalNombre: stock.sucursal.nombre,
      cantidad: stock.cantidad,
      stockMinimo: stock.stockMinimo,
    }));

  return res.status(200).json({
    kpis: {
      ventasHoy: ventasHoyAgg._count._all,
      totalHoy: Number(ventasHoyAgg._sum.total ?? 0),
      clientes: clientesCount,
      productos: productosCount,
      stockBajo: stockBajo.length,
    },
    stockBajo,
    ventasRecientes: ventasRecientes.map(serializeVenta),
  });
});
