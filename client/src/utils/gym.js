import dayjs from 'dayjs'

export const MEDIOS_MEMBRESIA = [
  { value: 'EFECTIVO', label: 'Efectivo' },
  { value: 'TRANSFERENCIA', label: 'Transferencia' },
  { value: 'DEBITO', label: 'Débito' },
  { value: 'CREDITO', label: 'Crédito' },
]

export function formatFecha(valor, conHora = false) {
  if (!valor) return '—'
  return dayjs(valor).format(conHora ? 'DD/MM/YYYY HH:mm' : 'DD/MM/YYYY')
}

export function fechaInput(valor) {
  return dayjs(valor || undefined).format('YYYY-MM-DD')
}

export function etiquetaMedioMembresia(medio) {
  return MEDIOS_MEMBRESIA.find((item) => item.value === medio)?.label || medio
}

export function deudaMembresia(socio) {
  if (socio?.deuda != null) return Number(socio.deuda) || 0
  if (!socio?.activo) return 0
  if (socio.pagadoPeriodo != null) {
    const precio = Number(socio.plan?.precio) || 0
    return Math.max(0, Math.round((precio - Number(socio.pagadoPeriodo)) * 100) / 100)
  }
  if (socio.estadoCuota) return 0
  return Number(socio.plan?.precio) || 0
}

export function estadoSocio(socio) {
  if (!socio?.activo) return { label: 'Baja', className: 'bg-slate-100 text-slate-500' }
  if (!socio.estadoCuota) return { label: 'Vencida', className: 'bg-red-50 text-red-700' }
  if (deudaMembresia(socio) > 0) return { label: 'Con deuda', className: 'bg-amber-50 text-amber-800' }
  return { label: 'Al día', className: 'bg-emerald-50 text-emerald-700' }
}

export function sugerirModoVencimiento(socio) {
  return (socio?.ingresosPostVencimiento?.cantidad || 0) > 0 ? 'mantener' : 'desde_hoy'
}

export const RECARGO_TRANSFERENCIA_DEFAULT = 1000

export function calcularRecargoMembresia(medio, importe, options = {}) {
  const base = Math.round((Number(importe) || 0) * 100) / 100
  if (medio === 'CREDITO') {
    const pct = Number(options.cuotas) === 3 ? 0.15 : 0.1
    return Math.round(base * pct * 100) / 100
  }
  if (medio === 'TRANSFERENCIA') {
    const valor = options.recargoTransferencia
    const recargo = valor == null || valor === '' ? RECARGO_TRANSFERENCIA_DEFAULT : Number(valor)
    if (Number.isNaN(recargo)) return RECARGO_TRANSFERENCIA_DEFAULT
    return Math.max(0, Math.round(recargo * 100) / 100)
  }
  return 0
}

export function coberturaPlan(plan) {
  if (plan?.multisede) return 'Multisede'
  return plan?.sucursal?.nombre || 'Sin sede'
}

export function planAplicaASede(plan, sucursalId) {
  if (!plan) return false
  if (plan.multisede) return true
  if (!plan.sucursalId || sucursalId == null || sucursalId === '') return false
  return String(plan.sucursalId) === String(sucursalId)
}

export function etiquetaPagoMembresia(pago) {
  const medio = etiquetaMedioMembresia(pago.medio)
  if (pago.medio === 'CREDITO' && pago.cuotas) {
    return `${medio} · ${pago.cuotas} cuota${pago.cuotas === 1 ? '' : 's'}`
  }
  return medio
}
