export const formatPrecio = (valor) =>
  new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  }).format(Number(valor) || 0)

export const roundMoney = (valor) => Math.round((Number(valor) || 0) * 100) / 100

export const precioCatalogo = (producto, tipoCliente) =>
  tipoCliente === 'MAYORISTA' ? producto.precioMayorista : producto.precioPublico

export const nombreCliente = (item) =>
  item?.persona ? `${item.persona.nombre} ${item.persona.apellido}`.trim() : 'Consumidor final'

export const etiquetaTipo = (tipo) => (tipo || '').replaceAll('_', ' ')

export const MEDIOS_PAGO = [
  { value: 'EFECTIVO', label: 'Efectivo' },
  { value: 'TRANSFERENCIA', label: 'Transferencia' },
  { value: 'DEBITO', label: 'Débito' },
  { value: 'CREDITO', label: 'Crédito' },
  { value: 'CONSIGNACION', label: 'Consignación' },
  { value: 'OTRO', label: 'Otro' },
]

export const etiquetaMedio = (medio) =>
  MEDIOS_PAGO.find((item) => item.value === medio)?.label || medio

export const etiquetaEstado = (estado) => (estado === 'SEPARADO' ? 'Reservado' : 'Retirado')

export const fechaInputHoy = () => {
  const now = new Date()
  const offset = now.getTimezoneOffset() * 60000
  return new Date(now.getTime() - offset).toISOString().slice(0, 10)
}

export function totalConInteres(subtotal, pagos) {
  const credito = pagos.find((pago) => pago.medio === 'CREDITO')
  if (!credito) return roundMoney(subtotal)
  const tasa = Number(credito.cuotas) === 3 ? 0.15 : 0.1
  return roundMoney(subtotal * (1 + tasa))
}

export function interesDe(subtotal, pagos) {
  return roundMoney(totalConInteres(subtotal, pagos) - roundMoney(subtotal))
}

export function nuevoPago(parcial = {}) {
  return {
    key: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    medio: 'EFECTIVO',
    monto: 0,
    cuotas: 1,
    nota: '',
    ...parcial,
  }
}
