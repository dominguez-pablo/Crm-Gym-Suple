const LABELS = {
  FIT_MARKET: 'Fit Market',
  GYM: 'Academia',
}

export function etiquetaModulos(modulos = []) {
  if (!modulos.length) return '—'
  return modulos.map((modulo) => LABELS[modulo] || modulo).join(' · ')
}

export const formatPrecio = (valor) =>
  new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  }).format(Number(valor) || 0)
