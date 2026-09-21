export function applyStockEvent(producto, event, sucursalId) {
  if (!producto || producto.id !== event.productoId) return producto
  const stocks = event.stocks || []
  const local = sucursalId ? stocks.find((stock) => stock.sucursalId === sucursalId) : null
  return {
    ...producto,
    stocks,
    ...(sucursalId
      ? {
          stockLocal: local?.cantidad ?? 0,
          stockMinimoLocal: local?.stockMinimo ?? 5,
        }
      : {}),
  }
}

export function stockDe(producto, sucursalId) {
  if (!producto) return 0
  if (sucursalId && producto.stocks) {
    return producto.stocks.find((stock) => stock.sucursalId === sucursalId)?.cantidad ?? 0
  }
  return producto.stockLocal ?? 0
}

export function otrasSucursalesConStock(producto, sucursalId) {
  return (producto?.stocks || []).filter(
    (stock) => stock.sucursalId !== sucursalId && stock.cantidad > 0,
  )
}

export function nombreCortoSucursal(nombre = '') {
  return nombre.replace(/^Fit Market\s+/i, '') || nombre
}
