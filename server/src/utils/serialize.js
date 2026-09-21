const toNumber = (value) => (value == null ? value : Number(value));

function serializeStocks(stocks = []) {
  return stocks.map((stock) => ({
    sucursalId: stock.sucursalId,
    nombre: stock.sucursal?.nombre ?? stock.nombre ?? '',
    cantidad: stock.cantidad,
    stockMinimo: stock.stockMinimo,
  }));
}

export function serializeProducto(producto, sucursalId) {
  if (!producto) return producto;
  const { stocks, ...rest } = producto;
  const mapped = serializeStocks(stocks);
  const local = sucursalId
    ? mapped.find((stock) => stock.sucursalId === sucursalId)
    : null;

  return {
    ...rest,
    precioCosto: toNumber(producto.precioCosto),
    precioMayorista: toNumber(producto.precioMayorista),
    precioRecomendado: toNumber(producto.precioRecomendado),
    precioPublico: toNumber(producto.precioPublico),
    stocks: mapped,
    ...(sucursalId
      ? {
          stockLocal: local?.cantidad ?? 0,
          stockMinimoLocal: local?.stockMinimo ?? 5,
        }
      : {}),
  };
}

export function serializePersona(persona) {
  return persona;
}

export function serializeCliente(cliente) {
  if (!cliente) return cliente;
  return {
    ...cliente,
    deuda: toNumber(cliente.deuda),
    persona: cliente.persona ? serializePersona(cliente.persona) : cliente.persona,
  };
}

export function serializePagoVenta(pago) {
  if (!pago) return pago;
  return {
    ...pago,
    monto: toNumber(pago.monto),
  };
}

export function serializeVenta(venta) {
  if (!venta) return venta;
  return {
    ...venta,
    total: toNumber(venta.total),
    cliente: venta.cliente ? serializeCliente(venta.cliente) : null,
    sucursal: venta.sucursal ?? null,
    pagos: venta.pagos?.map(serializePagoVenta),
    detalles: venta.detalles?.map((detalle) => ({
      ...detalle,
      precioUnitario: toNumber(detalle.precioUnitario),
      producto: detalle.producto ? serializeProducto(detalle.producto) : detalle.producto,
    })),
  };
}

export function serializeUsuario(usuario) {
  if (!usuario) return usuario;
  const { password, ...rest } = usuario;
  return rest;
}

export function serializeTraslado(traslado) {
  if (!traslado) return traslado;
  return {
    ...traslado,
    producto: traslado.producto ? serializeProducto(traslado.producto) : traslado.producto,
    usuario: traslado.usuario ? serializeUsuario(traslado.usuario) : traslado.usuario,
  };
}
