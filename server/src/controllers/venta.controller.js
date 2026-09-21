import prisma from '../db/prisma.js';
import { HttpError, asyncHandler, parseId, parseOptionalId } from '../utils/http.js';
import { serializeVenta } from '../utils/serialize.js';
import { descontarStock, emitProductoStock } from '../utils/stock.js';
import {
  createVentaSchema,
  updateEstadoVentaSchema,
} from '../validators/venta.validator.js';

const ventaInclude = {
  cliente: { include: { persona: true } },
  sucursal: true,
  detalles: { include: { producto: true } },
  pagos: { orderBy: { id: 'asc' } },
};

const roundMoney = (valor) => Math.round((Number(valor) || 0) * 100) / 100;

export function totalConInteres(subtotal, pagos) {
  const credito = pagos.find((pago) => pago.medio === 'CREDITO');
  if (!credito) return roundMoney(subtotal);
  const tasa = credito.cuotas === 3 ? 0.15 : 0.1;
  return roundMoney(subtotal * (1 + tasa));
}

function resumenMedios(pagos) {
  const unicos = [...new Set(pagos.map((pago) => pago.medio))];
  return unicos.join(' + ');
}

export const getVentas = asyncHandler(async (req, res) => {
  const sucursalId = parseOptionalId(req.query.sucursalId);
  const ventas = await prisma.venta.findMany({
    where: sucursalId ? { sucursalId } : undefined,
    include: ventaInclude,
    orderBy: [{ fecha: 'desc' }, { id: 'desc' }],
    take: 100,
  });
  return res.status(200).json(ventas.map(serializeVenta));
});

export const getVenta = asyncHandler(async (req, res) => {
  const id = parseId(req.params.id);
  const venta = await prisma.venta.findUnique({
    where: { id },
    include: ventaInclude,
  });

  if (!venta) {
    return res.status(404).json({ message: 'Venta no encontrada' });
  }

  return res.status(200).json(serializeVenta(venta));
});

export const createVenta = asyncHandler(async (req, res) => {
  const { clienteId, sucursalId, fecha, estado, items, pagos } = createVentaSchema.parse(req.body);

  const deudaNueva = roundMoney(
    pagos
      .filter((pago) => pago.medio === 'CONSIGNACION')
      .reduce((acc, pago) => acc + Number(pago.monto), 0),
  );

  if (deudaNueva > 0 && !clienteId) {
    throw new HttpError(400, 'La consignación requiere un cliente');
  }

  const venta = await prisma.$transaction(async (tx) => {
    const sucursal = await tx.sucursal.findUnique({ where: { id: sucursalId } });
    if (!sucursal) {
      throw new HttpError(404, 'Sucursal no encontrada');
    }

    if (clienteId) {
      const cliente = await tx.clienteFitMarket.findUnique({
        where: { id: clienteId },
      });
      if (!cliente) {
        throw new HttpError(404, 'Cliente no encontrado');
      }
    }

    const ids = [...new Set(items.map((item) => item.productoId))];
    const productos = await tx.producto.findMany({
      where: { id: { in: ids } },
    });

    if (productos.length !== ids.length) {
      throw new HttpError(404, 'Uno o más productos no existen');
    }

    const productosPorId = new Map(productos.map((producto) => [producto.id, producto]));
    const cantidades = new Map();

    for (const item of items) {
      cantidades.set(item.productoId, (cantidades.get(item.productoId) ?? 0) + item.cantidad);
    }

    const detalles = items.map((item) => ({
      productoId: item.productoId,
      cantidad: item.cantidad,
      precioUnitario: roundMoney(item.precioUnitario),
    }));

    const subtotal = roundMoney(
      detalles.reduce((acc, item) => acc + item.precioUnitario * item.cantidad, 0),
    );
    const total = totalConInteres(subtotal, pagos);
    const sumaPagos = roundMoney(pagos.reduce((acc, pago) => acc + Number(pago.monto), 0));

    if (Math.abs(sumaPagos - total) > 0.5) {
      throw new HttpError(
        400,
        `La suma de los pagos (${sumaPagos}) debe coincidir con el total (${total})`,
      );
    }

    for (const [productoId, cantidad] of cantidades) {
      const producto = productosPorId.get(productoId);
      await descontarStock(tx, {
        sucursalId,
        productoId,
        cantidad,
        nombre: producto.nombre,
      });
    }

    const creada = await tx.venta.create({
      data: {
        clienteId: clienteId ?? null,
        sucursalId,
        fecha: fecha ?? undefined,
        medioPago: resumenMedios(pagos),
        estado,
        total,
        detalles: { create: detalles },
        pagos: {
          create: pagos.map((pago) => ({
            medio: pago.medio,
            monto: roundMoney(pago.monto),
            cuotas: pago.medio === 'CREDITO' ? pago.cuotas : null,
            nota: pago.medio === 'OTRO' ? pago.nota || null : pago.nota || null,
          })),
        },
      },
      include: ventaInclude,
    });

    if (deudaNueva > 0 && clienteId) {
      await tx.clienteFitMarket.update({
        where: { id: clienteId },
        data: { deuda: { increment: deudaNueva } },
      });
    }

    return tx.venta.findUnique({
      where: { id: creada.id },
      include: ventaInclude,
    });
  });

  const productoIds = [...new Set(venta.detalles.map((detalle) => detalle.productoId))];
  await Promise.all(productoIds.map((productoId) => emitProductoStock(productoId)));

  return res.status(201).json(serializeVenta(venta));
});

export const updateEstadoVenta = asyncHandler(async (req, res) => {
  const id = parseId(req.params.id);
  const { estado } = updateEstadoVentaSchema.parse(req.body);

  const venta = await prisma.venta.findUnique({ where: { id } });
  if (!venta) {
    return res.status(404).json({ message: 'Venta no encontrada' });
  }
  if (venta.estado !== 'SEPARADO') {
    throw new HttpError(400, 'Solo se puede marcar como retirado una venta separada');
  }

  const actualizada = await prisma.venta.update({
    where: { id },
    data: { estado },
    include: ventaInclude,
  });

  return res.status(200).json(serializeVenta(actualizada));
});
