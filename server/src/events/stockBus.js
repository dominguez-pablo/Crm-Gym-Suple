import { EventEmitter } from 'node:events';

export const stockBus = new EventEmitter();
stockBus.setMaxListeners(50);

export function emitStockChanged(productoId, stocks) {
  stockBus.emit('STOCK_CHANGED', { productoId, stocks });
}

export function emitSucursalChanged(payload = {}) {
  stockBus.emit('SUCURSAL_CHANGED', payload);
}
