import prisma from '../db/prisma.js';
import { HttpError, asyncHandler, parseId } from '../utils/http.js';
import { emitProductoStock, productoInclude } from '../utils/stock.js';
import { serializeProducto } from '../utils/serialize.js';
import {
  createProductoSchema,
  updateProductoSchema,
  updateStockSchema,
} from '../validators/producto.validator.js';

function sucursalFromQuery(req) {
  const raw = req.query.sucursalId;
  if (raw == null || raw === '') return undefined;
  return parseId(raw);
}

async function findProducto(id) {
  const producto = await prisma.producto.findUnique({
    where: { id },
    include: productoInclude,
  });
  if (!producto) {
    throw new HttpError(404, 'Producto no encontrado');
  }
  return producto;
}

export const getProducts = asyncHandler(async (req, res) => {
  const sucursalId = sucursalFromQuery(req);
  const productos = await prisma.producto.findMany({
    include: productoInclude,
    orderBy: { nombre: 'asc' },
  });
  return res.status(200).json(productos.map((producto) => serializeProducto(producto, sucursalId)));
});

export const getProduct = asyncHandler(async (req, res) => {
  const sucursalId = sucursalFromQuery(req);
  const producto = await findProducto(parseId(req.params.id));
  return res.status(200).json(serializeProducto(producto, sucursalId));
});

export const createProduct = asyncHandler(async (req, res) => {
  const { stocks = [], ...catalog } = createProductoSchema.parse(req.body);
  const sucursales = await prisma.sucursal.findMany({
    where: { activa: true, modulos: { has: 'FIT_MARKET' } },
  });
  if (sucursales.length === 0) {
    throw new HttpError(400, 'No hay sucursales de Fit Market activas');
  }

  const porSucursal = new Map(stocks.map((stock) => [stock.sucursalId, stock]));
  const producto = await prisma.producto.create({
    data: {
      ...catalog,
      stocks: {
        create: sucursales.map((sucursal) => ({
          sucursalId: sucursal.id,
          cantidad: porSucursal.get(sucursal.id)?.cantidad ?? 0,
          stockMinimo: porSucursal.get(sucursal.id)?.stockMinimo ?? 5,
        })),
      },
    },
    include: productoInclude,
  });

  await emitProductoStock(producto.id);
  return res.status(201).json(serializeProducto(producto));
});

export const updateProduct = asyncHandler(async (req, res) => {
  const id = parseId(req.params.id);
  await findProducto(id);
  const { stocks, ...catalog } = updateProductoSchema.parse(req.body);

  const producto = await prisma.$transaction(async (tx) => {
    if (Object.keys(catalog).length > 0) {
      await tx.producto.update({ where: { id }, data: catalog });
    }

    if (stocks) {
      for (const stock of stocks) {
        await tx.stockSucursal.upsert({
          where: {
            sucursalId_productoId: { sucursalId: stock.sucursalId, productoId: id },
          },
          create: {
            sucursalId: stock.sucursalId,
            productoId: id,
            cantidad: stock.cantidad ?? 0,
            stockMinimo: stock.stockMinimo ?? 5,
          },
          update: {
            ...(stock.cantidad != null ? { cantidad: stock.cantidad } : {}),
            ...(stock.stockMinimo != null ? { stockMinimo: stock.stockMinimo } : {}),
          },
        });
      }
    }

    return tx.producto.findUnique({
      where: { id },
      include: productoInclude,
    });
  });

  await emitProductoStock(id);
  return res.status(200).json(serializeProducto(producto));
});

export const updateStock = asyncHandler(async (req, res) => {
  const id = parseId(req.params.id);
  await findProducto(id);
  const { sucursalId, cantidad, stockMinimo } = updateStockSchema.parse(req.body);

  const sucursal = await prisma.sucursal.findUnique({ where: { id: sucursalId } });
  if (!sucursal) {
    throw new HttpError(404, 'Sucursal no encontrada');
  }

  await prisma.stockSucursal.upsert({
    where: { sucursalId_productoId: { sucursalId, productoId: id } },
    create: {
      sucursalId,
      productoId: id,
      cantidad,
      stockMinimo: stockMinimo ?? 5,
    },
    update: {
      cantidad,
      ...(stockMinimo != null ? { stockMinimo } : {}),
    },
  });

  const producto = await findProducto(id);
  await emitProductoStock(id);
  return res.status(200).json(serializeProducto(producto, sucursalId));
});

export const deleteProduct = asyncHandler(async (req, res) => {
  const id = parseId(req.params.id);
  await prisma.producto.delete({ where: { id } });
  return res.status(204).send();
});
