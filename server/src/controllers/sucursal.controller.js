import prisma from '../db/prisma.js';
import { emitSucursalChanged } from '../events/stockBus.js';
import { hasModulo } from '../utils/gym.js';
import { HttpError, asyncHandler, parseId } from '../utils/http.js';
import { descontarStock, emitProductoStock } from '../utils/stock.js';
import {
  cerrarSucursalSchema,
  createSucursalSchema,
  updateSucursalSchema,
} from '../validators/sucursal.validator.js';

function serializeAdmin(sucursal) {
  const stocks = sucursal.stocks || [];
  return {
    id: sucursal.id,
    nombre: sucursal.nombre,
    activa: sucursal.activa,
    modulos: sucursal.modulos || [],
    createdAt: sucursal.createdAt,
    updatedAt: sucursal.updatedAt,
    stockTotal: stocks.reduce((acc, stock) => acc + stock.cantidad, 0),
  };
}

function serializePublic(sucursal) {
  return {
    id: sucursal.id,
    nombre: sucursal.nombre,
    activa: sucursal.activa,
    modulos: sucursal.modulos || [],
    createdAt: sucursal.createdAt,
    updatedAt: sucursal.updatedAt,
  };
}

async function ensureStockRows(tx, sucursalId) {
  const productos = await tx.producto.findMany({ select: { id: true } });
  if (productos.length === 0) return;

  await tx.stockSucursal.createMany({
    data: productos.map((producto) => ({
      sucursalId,
      productoId: producto.id,
      cantidad: 0,
      stockMinimo: 5,
    })),
    skipDuplicates: true,
  });
}

export const getSucursales = asyncHandler(async (req, res) => {
  const pideTodas = req.query.todas === '1' || req.query.todas === 'true';
  if (pideTodas && req.user.role !== 'SUPERADMIN') {
    throw new HttpError(403, 'No tenés permisos para esta acción');
  }
  const modulo = req.query.modulo ? String(req.query.modulo).toUpperCase() : null;
  if (modulo && modulo !== 'GYM' && modulo !== 'FIT_MARKET') {
    throw new HttpError(400, 'El módulo de sucursal no es válido');
  }

  const where = {
    ...(pideTodas ? {} : { activa: true }),
    ...(modulo ? { modulos: { has: modulo } } : {}),
  };

  const sucursales = await prisma.sucursal.findMany({
    where,
    include: pideTodas ? { stocks: { select: { cantidad: true } } } : undefined,
    orderBy: pideTodas ? [{ activa: 'desc' }, { id: 'asc' }] : { id: 'asc' },
  });

  if (pideTodas) {
    return res.status(200).json(sucursales.map(serializeAdmin));
  }
  return res.status(200).json(sucursales.map(serializePublic));
});

export const createSucursal = asyncHandler(async (req, res) => {
  const { nombre, modulos } = createSucursalSchema.parse(req.body);

  const sucursal = await prisma.$transaction(async (tx) => {
    const creada = await tx.sucursal.create({ data: { nombre, modulos } });
    if (hasModulo(creada, 'FIT_MARKET')) {
      await ensureStockRows(tx, creada.id);
    }
    return creada;
  });

  emitSucursalChanged({ sucursalId: sucursal.id, accion: 'crear' });
  return res.status(201).json(serializePublic(sucursal));
});

export const updateSucursal = asyncHandler(async (req, res) => {
  const id = parseId(req.params.id);
  const data = updateSucursalSchema.parse(req.body);

  const sucursal = await prisma.$transaction(async (tx) => {
    const actual = await tx.sucursal.findUnique({ where: { id } });
    if (!actual) throw new HttpError(404, 'Sucursal no encontrada');

    const actualizada = await tx.sucursal.update({
      where: { id },
      data,
    });

    if (hasModulo(actualizada, 'FIT_MARKET')) {
      await ensureStockRows(tx, id);
    }
    return actualizada;
  });

  emitSucursalChanged({ sucursalId: id, accion: 'renombrar' });
  return res.status(200).json(serializePublic(sucursal));
});

export const cerrarSucursal = asyncHandler(async (req, res) => {
  const id = parseId(req.params.id);
  const { sucursalDestinoId } = cerrarSucursalSchema.parse(req.body ?? {});

  const { sucursal, productosAfectados } = await prisma.$transaction(async (tx) => {
    const sucursal = await tx.sucursal.findUnique({
      where: { id },
      include: { stocks: true },
    });
    if (!sucursal) throw new HttpError(404, 'Sucursal no encontrada');
    if (!sucursal.activa) throw new HttpError(400, 'El local ya está cerrado');

    const activas = await tx.sucursal.count({ where: { activa: true } });
    if (activas <= 1) {
      throw new HttpError(400, 'No se puede cerrar el último local activo');
    }

    const stockTotal = sucursal.stocks.reduce((acc, stock) => acc + stock.cantidad, 0);
    const conStock = sucursal.stocks.filter((stock) => stock.cantidad > 0);

    if (stockTotal > 0) {
      if (!sucursalDestinoId) {
        throw new HttpError(400, 'Elegí un local destino para mover el stock');
      }
      if (sucursalDestinoId === id) {
        throw new HttpError(400, 'El destino tiene que ser otro local');
      }

      const destino = await tx.sucursal.findUnique({ where: { id: sucursalDestinoId } });
      if (!destino) throw new HttpError(404, 'Sucursal destino no encontrada');
      if (!destino.activa) throw new HttpError(400, 'El local destino tiene que estar activo');

      await ensureStockRows(tx, sucursalDestinoId);

      for (const stock of conStock) {
        const producto = await tx.producto.findUnique({ where: { id: stock.productoId } });
        await descontarStock(tx, {
          sucursalId: id,
          productoId: stock.productoId,
          cantidad: stock.cantidad,
          nombre: producto?.nombre || `Producto #${stock.productoId}`,
        });
        await tx.stockSucursal.upsert({
          where: {
            sucursalId_productoId: {
              sucursalId: sucursalDestinoId,
              productoId: stock.productoId,
            },
          },
          create: {
            sucursalId: sucursalDestinoId,
            productoId: stock.productoId,
            cantidad: stock.cantidad,
            stockMinimo: stock.stockMinimo,
          },
          update: { cantidad: { increment: stock.cantidad } },
        });
        await tx.trasladoStock.create({
          data: {
            productoId: stock.productoId,
            sucursalOrigenId: id,
            sucursalDestinoId,
            cantidad: stock.cantidad,
            nota: `Cierre de ${sucursal.nombre}`,
            usuarioId: req.user.id,
          },
        });
      }
    }

    const cerrada = await tx.sucursal.update({
      where: { id },
      data: { activa: false },
      include: { stocks: { select: { cantidad: true } } },
    });

    return {
      sucursal: cerrada,
      productosAfectados: conStock.map((stock) => stock.productoId),
    };
  });

  await Promise.all(productosAfectados.map((productoId) => emitProductoStock(productoId)));
  emitSucursalChanged({ sucursalId: id, accion: 'cerrar' });
  return res.status(200).json(serializeAdmin(sucursal));
});

export const reabrirSucursal = asyncHandler(async (req, res) => {
  const id = parseId(req.params.id);

  const sucursal = await prisma.$transaction(async (tx) => {
    const actual = await tx.sucursal.findUnique({ where: { id } });
    if (!actual) throw new HttpError(404, 'Sucursal no encontrada');
    if (actual.activa) throw new HttpError(400, 'El local ya está activo');

    if (hasModulo(actual, 'FIT_MARKET')) {
      await ensureStockRows(tx, id);
    }
    return tx.sucursal.update({
      where: { id },
      data: { activa: true },
      include: { stocks: { select: { cantidad: true } } },
    });
  });

  emitSucursalChanged({ sucursalId: id, accion: 'reabrir' });
  return res.status(200).json(serializeAdmin(sucursal));
});
