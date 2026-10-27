export function nombreCortoSucursal(nombre = '') {
  return nombre.replace(/^Fit Market\s+/i, '') || nombre
}
