import prisma from '../db/prisma.js';
import { emitStockChanged } from '../events/stockBus.js';
import { HttpError } from './http.js';

export const productoInclude = {
  stocks: {
    include: { sucursal: { select: { id: true, nombre: true } } },
    orderBy: { sucursalId: 'asc' },
  },
};

export function mapStocks(stocks = []) {
  return stocks.map((stock) => ({
    sucursalId: stock.sucursalId,
    nombre: stock.sucursal?.nombre ?? '',
    cantidad: stock.cantidad,
    stockMinimo: stock.stockMinimo,
  }));
}

export async function loadStocks(productoId, client = prisma) {
  const stocks = await client.stockSucursal.findMany({
    where: { productoId },
    include: { sucursal: { select: { id: true, nombre: true } } },
    orderBy: { sucursalId: 'asc' },
  });
  return mapStocks(stocks);
}

export async function emitProductoStock(productoId, client = prisma) {
  const stocks = await loadStocks(productoId, client);
  emitStockChanged(productoId, stocks);
  return stocks;
}

export async function descontarStock(tx, { sucursalId, productoId, cantidad, nombre }) {
  const actualizado = await tx.stockSucursal.updateMany({
    where: {
      sucursalId,
      productoId,
      cantidad: { gte: cantidad },
    },
    data: { cantidad: { decrement: cantidad } },
  });

  if (actualizado.count === 0) {
    const actual = await tx.stockSucursal.findUnique({
      where: { sucursalId_productoId: { sucursalId, productoId } },
    });
    throw new HttpError(
      409,
      `Stock insuficiente para "${nombre}" en este local. Disponible: ${actual?.cantidad ?? 0}`,
    );
  }
}
