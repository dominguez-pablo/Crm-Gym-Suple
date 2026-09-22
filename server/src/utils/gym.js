import { endOfDate, sameCalendarDay } from './dates.js';
import { HttpError } from './http.js';

export const RECARGO_TRANSFERENCIA_DEFAULT = 1000;

export function calcularRecargoMembresia(medio, importe, options = {}) {
  const base = Math.round((Number(importe) || 0) * 100) / 100;
  if (medio === 'CREDITO') {
    const pct = Number(options.cuotas) === 3 ? 0.15 : 0.1;
    return Math.round(base * pct * 100) / 100;
  }
  if (medio === 'TRANSFERENCIA') {
    const valor = options.recargoTransferencia;
    const recargo =
      valor == null || valor === '' ? RECARGO_TRANSFERENCIA_DEFAULT : Number(valor);
    if (Number.isNaN(recargo)) return RECARGO_TRANSFERENCIA_DEFAULT;
    return Math.max(0, Math.round(recargo * 100) / 100);
  }
  return 0;
}

export function pagosDelPeriodo(socio) {
  if (!socio?.fechaVencimiento) return [];
  return (socio.pagos || []).filter((pago) =>
    sameCalendarDay(pago.periodoHasta, socio.fechaVencimiento),
  );
}

export function calcularPagadoPeriodo(socio) {
  return pagosDelPeriodo(socio).reduce((sum, pago) => sum + Number(pago.monto), 0);
}

export function calcularDeudaPeriodo(socio) {
  if (!socio?.activo) return 0;
  const precio = Number(socio.plan?.precio || 0);
  if (!precio) return 0;
  if (!socio.fechaVencimiento) return precio;
  return Math.max(0, Math.round((precio - calcularPagadoPeriodo(socio)) * 100) / 100);
}

export function periodoActual(socio) {
  const delPeriodo = pagosDelPeriodo(socio);
  const desde = delPeriodo.reduce((min, pago) => {
    if (!pago.periodoDesde) return min;
    const fecha = new Date(pago.periodoDesde);
    return !min || fecha < min ? fecha : min;
  }, null);
  return {
    desde,
    hasta: socio?.fechaVencimiento ?? null,
  };
}

export function motivoAccesoSede(socio, sucursalIngresoId) {
  if (socio?.plan?.multisede) return null;
  if (socio?.sucursalId && socio.sucursalId === sucursalIngresoId) return null;
  const sede = socio?.sucursal?.nombre;
  if (!sede) {
    return 'El socio no tiene sede asignada. Para ingresar necesita la membresía Multisede.';
  }
  return `El socio pertenece a ${sede}. Para ingresar a otra sede necesita la membresía Multisede.`;
}

export function assertPlanParaSocio(plan, sucursalSocioId) {
  if (!plan) {
    throw new HttpError(404, 'Plan no encontrado');
  }
  if (plan.multisede) return;
  if (!plan.sucursalId) {
    throw new HttpError(
      400,
      'El plan no tiene sede asignada. Editá la membresía y elegí la sede o marcala como Multisede.',
    );
  }
  if (!sucursalSocioId || plan.sucursalId !== sucursalSocioId) {
    throw new HttpError(
      400,
      'Ese plan corresponde a otra sede. Elegí un plan de la sede del socio o uno Multisede.',
    );
  }
}

export function resumenIngresosPostVencimiento(accesos = [], fechaVencimiento) {
  if (!fechaVencimiento) {
    return { cantidad: 0, ultimo: null };
  }
  const limite = endOfDate(fechaVencimiento);
  const posteriores = accesos.filter((acceso) => new Date(acceso.createdAt) > limite);
  return {
    cantidad: posteriores.length,
    ultimo: posteriores[0]?.createdAt ?? null,
  };
}

export function hasModulo(sucursal, modulo) {
  return Array.isArray(sucursal?.modulos) && sucursal.modulos.includes(modulo);
}

export async function assertGymSucursal(client, sucursalId) {
  const sucursal = await client.sucursal.findUnique({ where: { id: sucursalId } });
  if (!sucursal) {
    throw new HttpError(404, 'Sucursal no encontrada');
  }
  if (!sucursal.activa) {
    throw new HttpError(400, 'La sucursal está cerrada');
  }
  if (!hasModulo(sucursal, 'GYM')) {
    throw new HttpError(400, 'La sucursal no pertenece a Infinity Academia');
  }
  return sucursal;
}

export async function assertSucursalOperativa(client, user, sucursalId) {
  const sucursal = await assertGymSucursal(client, sucursalId);
  if (user.role === 'SUPERADMIN') {
    return sucursal;
  }

  const usuario = await client.usuario.findUnique({
    where: { id: user.id },
    select: { sucursalId: true, role: true },
  });
  if (usuario?.sucursalId && usuario.sucursalId !== sucursalId) {
    throw new HttpError(403, 'No podés operar en otra sucursal');
  }
  return sucursal;
}

export function resumenCaja(sesion) {
  const movimientos = sesion.movimientos || [];
  const porMedio = {};
  let efectivoEsperado = Number(sesion.montoApertura);

  for (const movimiento of movimientos) {
    if (movimiento.tipo === 'APERTURA' || movimiento.tipo === 'CIERRE') continue;
    const monto = Number(movimiento.monto);
    if (movimiento.tipo === 'EGRESO') {
      efectivoEsperado -= monto;
      continue;
    }
    const medio = movimiento.medio || 'EFECTIVO';
    porMedio[medio] = (porMedio[medio] || 0) + monto;
    if (medio === 'EFECTIVO') {
      efectivoEsperado += monto;
    }
  }

  return {
    efectivoEsperado,
    porMedio,
    totalIngresos: Object.values(porMedio).reduce((acc, value) => acc + value, 0),
  };
}

export const planInclude = {
  sucursal: { select: { id: true, nombre: true } },
};

export const socioPagosPeriodoInclude = {
  pagos: {
    select: {
      monto: true,
      periodoDesde: true,
      periodoHasta: true,
    },
  },
};

export const socioInclude = {
  persona: true,
  plan: { include: planInclude },
  sucursal: true,
  ...socioPagosPeriodoInclude,
};

export const socioDetalleInclude = {
  persona: true,
  plan: { include: planInclude },
  sucursal: true,
  pagos: {
    include: {
      plan: { include: planInclude },
      sucursal: true,
      usuario: { include: { persona: true } },
    },
    orderBy: [{ fechaPago: 'desc' }, { createdAt: 'desc' }],
  },
  accesos: {
    orderBy: { createdAt: 'desc' },
    take: 40,
    include: { sucursal: { select: { id: true, nombre: true } } },
  },
};

export const cajaInclude = {
  sucursal: true,
  usuarioApertura: { include: { persona: true } },
  usuarioCierre: { include: { persona: true } },
  movimientos: {
    orderBy: { createdAt: 'asc' },
    include: {
      usuario: { include: { persona: true } },
      pagoMembresia: true,
    },
  },
};

export const pagoInclude = {
  socio: { include: { persona: true } },
  plan: { include: planInclude },
  sucursal: true,
  usuario: { include: { persona: true } },
};
