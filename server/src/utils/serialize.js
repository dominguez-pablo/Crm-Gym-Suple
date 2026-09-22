import {
  calcularDeudaPeriodo,
  calcularPagadoPeriodo,
  periodoActual,
  resumenIngresosPostVencimiento,
} from './gym.js';

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
  return {
    ...rest,
    sucursal: usuario.sucursal ?? null,
    persona: usuario.persona ? serializePersona(usuario.persona) : usuario.persona,
  };
}

export function serializePlan(plan) {
  if (!plan) return plan;
  return {
    ...plan,
    precio: toNumber(plan.precio),
  };
}

export function serializeSocio(socio) {
  if (!socio) return socio;
  const { pagos, accesos, ...rest } = socio;
  return {
    ...rest,
    deuda: toNumber(socio.deuda ?? calcularDeudaPeriodo(socio)),
    pagadoPeriodo: toNumber(socio.pagadoPeriodo ?? calcularPagadoPeriodo(socio)),
    plan: socio.plan ? serializePlan(socio.plan) : null,
    persona: socio.persona ? serializePersona(socio.persona) : socio.persona,
    pagos: pagos?.map((pago) => serializePagoMembresia({ ...pago, socio: undefined })),
    accesos: accesos?.map((acceso) => serializeAcceso({ ...acceso, socio: undefined })),
    ingresosPostVencimiento:
      socio.ingresosPostVencimiento ??
      (accesos ? resumenIngresosPostVencimiento(accesos, socio.fechaVencimiento) : null),
    periodoActual: socio.periodoActual ?? periodoActual(socio),
  };
}

export function serializePagoMembresia(pago) {
  if (!pago) return pago;
  return {
    ...pago,
    monto: toNumber(pago.monto),
    recargo: toNumber(pago.recargo ?? 0),
    socio: pago.socio ? serializeSocio(pago.socio) : pago.socio,
    plan: pago.plan ? serializePlan(pago.plan) : pago.plan,
    usuario: pago.usuario ? serializeUsuario(pago.usuario) : pago.usuario,
  };
}

export function serializeCajaMovimiento(movimiento) {
  if (!movimiento) return movimiento;
  return {
    ...movimiento,
    monto: toNumber(movimiento.monto),
    usuario: movimiento.usuario ? serializeUsuario(movimiento.usuario) : movimiento.usuario,
    pagoMembresia: movimiento.pagoMembresia
      ? serializePagoMembresia(movimiento.pagoMembresia)
      : movimiento.pagoMembresia,
  };
}

export function serializeCaja(caja) {
  if (!caja) return caja;
  return {
    ...caja,
    montoApertura: toNumber(caja.montoApertura),
    montoCierreDeclarado: toNumber(caja.montoCierreDeclarado),
    montoCierreSistema: toNumber(caja.montoCierreSistema),
    diferencia: toNumber(caja.diferencia),
    usuarioApertura: caja.usuarioApertura
      ? serializeUsuario(caja.usuarioApertura)
      : caja.usuarioApertura,
    usuarioCierre: caja.usuarioCierre ? serializeUsuario(caja.usuarioCierre) : caja.usuarioCierre,
    movimientos: caja.movimientos?.map(serializeCajaMovimiento),
  };
}

export function serializeAcceso(acceso) {
  if (!acceso) return acceso;
  return {
    ...acceso,
    socio: acceso.socio ? serializeSocio(acceso.socio) : acceso.socio,
    usuario: acceso.usuario ? serializeUsuario(acceso.usuario) : acceso.usuario,
  };
}

export function serializeTraslado(traslado) {
  if (!traslado) return traslado;
  return {
    ...traslado,
    producto: traslado.producto ? serializeProducto(traslado.producto) : traslado.producto,
    usuario: traslado.usuario ? serializeUsuario(traslado.usuario) : traslado.usuario,
  };
}
