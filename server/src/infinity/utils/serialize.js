import {
  calcularDeudaPeriodo,
  calcularPagadoPeriodo,
  periodoActual,
  resumenIngresosPostVencimiento,
} from './infinity.js';
import { serializePersona, serializeUsuario, toNumber } from '../../compartido/utils/serialize.js';

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
