import prisma from '../db/prisma.js';
import { HttpError, asyncHandler } from '../utils/http.js';
import { serializeTraslado } from '../utils/serialize.js';
import { descontarStock, emitProductoStock, productoInclude } from '../utils/stock.js';
import { createTrasladoSchema } from '../validators/traslado.validator.js';

const trasladoInclude = {
  producto: { include: productoInclude },
  sucursalOrigen: true,
  sucursalDestino: true,
  usuario: { include: { persona: true } },
};

export const getTraslados = asyncHandler(async (req, res) => {
  const traslados = await prisma.trasladoStock.findMany({
    include: trasladoInclude,
    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    take: 50,
  });
  return res.status(200).json(traslados.map(serializeTraslado));
});

export const createTraslado = asyncHandler(async (req, res) => {
  const data = createTrasladoSchema.parse(req.body);

  const traslado = await prisma.$transaction(async (tx) => {
    const [producto, origen, destino] = await Promise.all([
      tx.producto.findUnique({ where: { id: data.productoId } }),
      tx.sucursal.findUnique({ where: { id: data.sucursalOrigenId } }),
      tx.sucursal.findUnique({ where: { id: data.sucursalDestinoId } }),
    ]);

    if (!producto) throw new HttpError(404, 'Producto no encontrado');
    if (!origen || !destino) throw new HttpError(404, 'Sucursal no encontrada');
    if (!origen.activa) throw new HttpError(400, 'El local de origen está cerrado');
    if (!destino.activa) throw new HttpError(400, 'El local de destino está cerrado');

    await descontarStock(tx, {
      sucursalId: data.sucursalOrigenId,
      productoId: data.productoId,
      cantidad: data.cantidad,
      nombre: producto.nombre,
    });

    await tx.stockSucursal.upsert({
      where: {
        sucursalId_productoId: {
          sucursalId: data.sucursalDestinoId,
          productoId: data.productoId,
        },
      },
      create: {
        sucursalId: data.sucursalDestinoId,
        productoId: data.productoId,
        cantidad: data.cantidad,
      },
      update: { cantidad: { increment: data.cantidad } },
    });

    return tx.trasladoStock.create({
      data: {
        productoId: data.productoId,
        sucursalOrigenId: data.sucursalOrigenId,
        sucursalDestinoId: data.sucursalDestinoId,
        cantidad: data.cantidad,
        nota: data.nota || null,
        usuarioId: req.user.id,
      },
      include: trasladoInclude,
    });
  });

  await emitProductoStock(data.productoId);
  return res.status(201).json(serializeTraslado(traslado));
});
