import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import Swal from 'sweetalert2'
import { Banknote, Eye, Pencil, Plus, Users, X } from 'lucide-react'
import dayjs from 'dayjs'
import { gymApi } from '../../api/gym'
import { useGymSucursalStore } from '../../store/gymSucursalStore'
import { formatPrecio } from '../../utils/modulos'
import {
  calcularRecargoMembresia,
  deudaMembresia,
  estadoSocio,
  etiquetaPagoMembresia,
  fechaInput,
  formatFecha,
  MEDIOS_MEMBRESIA,
  planAplicaASede,
  coberturaPlan,
  RECARGO_TRANSFERENCIA_DEFAULT,
  sugerirModoVencimiento,
} from '../../utils/gym'

const emptyValues = {
  dni: '',
  nombre: '',
  apellido: '',
  telefono: '',
  sucursalId: '',
  planId: '',
  activo: true,
}

function montoSugerido(socio, plan) {
  const mismoPlan = plan && socio.planId && String(socio.planId) === String(plan.id)
  const deuda = deudaMembresia(socio)
  if (mismoPlan && deuda > 0) return String(deuda)
  if (plan?.precio != null) return String(plan.precio)
  return ''
}

function previewPeriodo(socio, plan, fechaPago, modo, monto) {
  if (!plan) return null
  const fecha = dayjs(fechaPago)
  const venc = socio.fechaVencimiento ? dayjs(socio.fechaVencimiento) : null
  const mismoPlan = socio.planId && String(socio.planId) === String(plan.id)
  const deuda = mismoPlan ? deudaMembresia(socio) : 0
  const importe = Number(monto) || 0
  const vigente = venc && !venc.isBefore(fecha, 'day')

  if (deuda > 0 && importe <= deuda) {
    return {
      tipo: 'saldo',
      texto: `Cancela ${formatPrecio(importe)} de saldo. El vencimiento se mantiene en ${formatFecha(socio.fechaVencimiento)}.`,
    }
  }

  const base = vigente || (modo === 'mantener' && venc) ? venc : fecha
  const hasta = base.add(plan.duracionDias, 'day')
  const sobrante = deuda > 0 ? Math.max(0, Math.round((importe - deuda) * 100) / 100) : importe
  const saldoTxt =
    deuda > 0
      ? `Primero cancela ${formatPrecio(Math.min(importe, deuda))} de saldo. El resto (${formatPrecio(sobrante)}) abre un período nuevo: `
      : ''

  return {
    tipo: 'renovacion',
    texto: `${saldoTxt}El período cubierto será ${base.format('DD/MM/YYYY')} → ${hasta.format('DD/MM/YYYY')}.`,
  }
}

function planesParaSelector(planes, sucursalId, planActualId) {
  return planes.filter((plan) => {
    const esActual =
      planActualId != null && planActualId !== '' && String(plan.id) === String(planActualId)
    if (!plan.activa && !esActual) return false
    if (planAplicaASede(plan, sucursalId)) return true
    return esActual
  })
}

function etiquetaPlan(plan) {
  return `${plan.nombre} · ${coberturaPlan(plan)} · ${formatPrecio(plan.precio)}`
}

function textoIngresosPostVencimiento(socio) {
  const ingresos = socio?.ingresosPostVencimiento
  if (!socio?.fechaVencimiento || !ingresos) return null
  if (ingresos.cantidad > 0) {
    const veces = ingresos.cantidad === 1 ? '1 vez' : `${ingresos.cantidad} veces`
    const ultimo = ingresos.ultimo ? ` Último ingreso: ${formatFecha(ingresos.ultimo, true)}.` : ''
    return `Vino ${veces} después del ${formatFecha(socio.fechaVencimiento)}.${ultimo}`
  }
  return `No registró ingresos después del vencimiento (${formatFecha(socio.fechaVencimiento)}).`
}

function Socios() {
  const sucursales = useGymSucursalStore((state) => state.sucursales)
  const sucursalActual = useGymSucursalStore((state) => state.sucursalId)
  const [searchParams, setSearchParams] = useSearchParams()
  const [socios, setSocios] = useState([])
  const [planes, setPlanes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [q, setQ] = useState('')
  const [editing, setEditing] = useState(null)
  const [open, setOpen] = useState(false)
  const [detalle, setDetalle] = useState(null)
  const [detalleLoading, setDetalleLoading] = useState(false)
  const [detalleTab, setDetalleTab] = useState('pagos')
  const [pagoSocio, setPagoSocio] = useState(null)
  const [pagoPlanId, setPagoPlanId] = useState('')
  const [pagoMedio, setPagoMedio] = useState('EFECTIVO')
  const [pagoMonto, setPagoMonto] = useState('')
  const [pagoCuotas, setPagoCuotas] = useState(1)
  const [pagoRecargoTransf, setPagoRecargoTransf] = useState(String(RECARGO_TRANSFERENCIA_DEFAULT))
  const [pagoFecha, setPagoFecha] = useState(fechaInput())
  const [pagoNota, setPagoNota] = useState('')
  const [pagoModo, setPagoModo] = useState('desde_hoy')
  const [pagoSaving, setPagoSaving] = useState(false)
  const { register, handleSubmit, reset, watch, setValue, getValues } = useForm({ defaultValues: emptyValues })
  const sedeForm = watch('sucursalId')
  const planForm = watch('planId')
  const sucursalField = register('sucursalId')

  const pagoPlan = useMemo(
    () => planes.find((plan) => String(plan.id) === String(pagoPlanId)),
    [planes, pagoPlanId],
  )
  const periodoPreview = pagoSocio
    ? previewPeriodo(pagoSocio, pagoPlan, pagoFecha, pagoModo, pagoMonto)
    : null
  const pagoDeuda = pagoSocio ? deudaMembresia(pagoSocio) : 0
  const pagoMismoPlan = pagoSocio && pagoPlan && String(pagoSocio.planId) === String(pagoPlan.id)
  const pagoCubreSaldo = Boolean(pagoMismoPlan && pagoDeuda > 0)
  const pagoRenueva =
    pagoPlan && (!pagoCubreSaldo || Number(pagoMonto) > pagoDeuda)
  const pagoCuotaVencida = Boolean(pagoSocio && !pagoSocio.estadoCuota && pagoSocio.fechaVencimiento)
  const mostrarModo = Boolean(pagoRenueva && pagoCuotaVencida)
  const textoIngresosPago = pagoSocio ? textoIngresosPostVencimiento(pagoSocio) : null
  const pagoImporte = Number(pagoMonto) || 0
  const pagoRecargo = calcularRecargoMembresia(pagoMedio, pagoImporte, {
    cuotas: pagoCuotas,
    recargoTransferencia: pagoRecargoTransf,
  })
  const pagoTotal = Math.round((pagoImporte + pagoRecargo) * 100) / 100

  const load = async (busqueda = q) => {
    setError('')
    const [lista, catalogo] = await Promise.all([
      gymApi.socios.list({ q: busqueda || undefined }),
      gymApi.planes.list(true),
    ])
    setSocios(lista)
    setPlanes(catalogo)
    return lista
  }

  useEffect(() => {
    load()
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    const cobrarId = searchParams.get('cobrar')
    if (!cobrarId || loading) return
    let cancelled = false
    ;(async () => {
      try {
        const deLista = socios.find((item) => String(item.id) === String(cobrarId))
        const socio = deLista || (await gymApi.socios.get(cobrarId))
        if (!cancelled) openPago(socio)
      } catch (err) {
        if (!cancelled) {
          Swal.fire({ icon: 'error', title: 'No se encontró el socio', text: err.message })
        }
      } finally {
        if (!cancelled) setSearchParams({}, { replace: true })
      }
    })()
    return () => {
      cancelled = true
    }
  }, [loading, searchParams])

  const openCreate = () => {
    setEditing(null)
    reset({ ...emptyValues, sucursalId: sucursalActual || '' })
    setOpen(true)
  }

  const openEdit = (socio) => {
    setEditing(socio)
    reset({
      dni: socio.persona.dni,
      nombre: socio.persona.nombre,
      apellido: socio.persona.apellido,
      telefono: socio.persona.telefono || '',
      sucursalId: socio.sucursalId || '',
      planId: socio.planId || '',
      activo: socio.activo,
    })
    setOpen(true)
  }

  const openDetalle = async (socio) => {
    setDetalle(socio)
    setDetalleTab('pagos')
    setDetalleLoading(true)
    try {
      setDetalle(await gymApi.socios.get(socio.id))
    } catch (err) {
      setDetalle(null)
      Swal.fire({ icon: 'error', title: 'No se pudo cargar el socio', text: err.message })
    } finally {
      setDetalleLoading(false)
    }
  }

  const openPago = async (socio) => {
    if (!socio?.activo) {
      Swal.fire({ icon: 'info', title: 'Socio dado de baja', text: 'Reactivá al socio para cobrar una membresía.' })
      return
    }
    if (!sucursalActual) {
      Swal.fire({ icon: 'info', title: 'Elegí la sede', text: 'Los cobros se registran en la sucursal activa y requieren caja abierta.' })
      return
    }
    let completo = socio
    try {
      completo = await gymApi.socios.get(socio.id)
    } catch {
      completo = socio
    }
    const planId = completo.planId ? String(completo.planId) : ''
    const plan = planes.find((item) => String(item.id) === planId) || completo.plan
    const cobrable = Boolean(plan && planAplicaASede(plan, completo.sucursalId) && (plan.activa || plan.id === completo.planId))
    setPagoSocio(completo)
    setPagoPlanId(cobrable ? planId : '')
    setPagoMedio('EFECTIVO')
    setPagoMonto(cobrable ? montoSugerido(completo, plan) : '')
    setPagoCuotas(1)
    setPagoRecargoTransf(String(RECARGO_TRANSFERENCIA_DEFAULT))
    setPagoFecha(fechaInput())
    setPagoNota('')
    setPagoModo(sugerirModoVencimiento(completo))
  }

  const cobrar = async (event) => {
    event.preventDefault()
    if (!pagoSocio || !sucursalActual || !pagoPlanId) return
    setPagoSaving(true)
    try {
      await gymApi.pagos.create({
        socioId: pagoSocio.id,
        planId: Number(pagoPlanId),
        sucursalId: sucursalActual,
        medio: pagoMedio,
        monto: pagoImporte,
        recargo: pagoRecargo,
        cuotas: pagoMedio === 'CREDITO' ? pagoCuotas : undefined,
        fechaPago: pagoFecha,
        nota: pagoNota.trim() || undefined,
        ...(mostrarModo ? { modoVencimiento: pagoModo } : {}),
      })
      Swal.fire({ icon: 'success', title: 'Pago registrado', timer: 1400, showConfirmButton: false })
      const socioId = pagoSocio.id
      setPagoSocio(null)
      await load()
      if (detalle?.id === socioId) {
        setDetalle(await gymApi.socios.get(socioId))
      }
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'No se pudo cobrar', text: err.message })
    } finally {
      setPagoSaving(false)
    }
  }

  const onSubmit = async (values) => {
    const payload = {
      ...values,
      sucursalId: values.sucursalId ? Number(values.sucursalId) : null,
      planId: values.planId ? Number(values.planId) : null,
      activo: values.activo === true || values.activo === 'true',
    }
    try {
      if (editing) {
        await gymApi.socios.update(editing.id, payload)
      } else {
        await gymApi.socios.create(payload)
      }
      setOpen(false)
      await load()
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'No se pudo guardar', text: err.message })
    }
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Socios</h1>
          <p className="text-sm text-slate-500">Alta, cobro de membresías y seguimiento de miembros</p>
        </div>
        <div className="flex gap-2">
          <input
            className="h-10 rounded-xl border border-slate-200 px-3 text-sm"
            placeholder="Buscar DNI o nombre"
            value={q}
            onChange={(event) => setQ(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') load(event.currentTarget.value)
            }}
          />
          <button
            type="button"
            onClick={() => load()}
            className="h-10 rounded-xl border border-slate-200 px-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Buscar
          </button>
          <button
            type="button"
            onClick={openCreate}
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-indigo-700 px-4 text-sm font-semibold text-white hover:bg-indigo-600"
          >
            <Plus className="h-4 w-4" />
            Nuevo socio
          </button>
        </div>
      </div>

      {error ? (
        <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      ) : null}

      <div className="min-h-0 flex-1 overflow-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
        {loading ? (
          <p className="p-6 text-sm text-slate-500">Cargando socios...</p>
        ) : socios.length === 0 ? (
          <div className="flex h-48 flex-col items-center justify-center text-slate-500">
            <Users className="mb-2 h-8 w-8 text-slate-300" />
            Todavía no hay socios
          </div>
        ) : (
          <table className="min-w-full text-left text-sm">
            <thead className="sticky top-0 bg-slate-50 text-xs font-semibold tracking-wide text-slate-500 uppercase">
              <tr>
                <th className="px-4 py-3">Socio</th>
                <th className="px-4 py-3">DNI</th>
                <th className="px-4 py-3">Plan</th>
                <th className="px-4 py-3">Vencimiento</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {socios.map((socio) => {
                const estado = estadoSocio(socio)
                const deuda = deudaMembresia(socio)
                return (
                  <tr key={socio.id} className="border-t border-slate-100">
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-900">
                        {socio.persona.nombre} {socio.persona.apellido}
                      </p>
                      <p className="text-xs text-slate-400">
                        {socio.sucursal?.nombre || 'Sin sede'}
                      </p>
                    </td>
                    <td className="px-4 py-3">{socio.persona.dni}</td>
                    <td className="px-4 py-3">
                      {socio.plan ? (
                        <>
                          <p>{socio.plan.nombre}</p>
                          <p className="text-xs text-slate-400">{coberturaPlan(socio.plan)}</p>
                        </>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="px-4 py-3">{formatFecha(socio.fechaVencimiento)}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-1 text-xs font-medium ${estado.className}`}>
                        {estado.label}
                      </span>
                      {deuda > 0 ? (
                        <p className="mt-1 text-xs font-medium text-red-600">Deuda {formatPrecio(deuda)}</p>
                      ) : null}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => openDetalle(socio)}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
                          aria-label="Ver ficha del socio"
                          title="Ver ficha"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => openPago(socio)}
                          disabled={!socio.activo}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-indigo-200 text-indigo-700 hover:bg-indigo-50 disabled:cursor-not-allowed disabled:opacity-40"
                          aria-label="Cobrar membresía"
                          title="Cobrar membresía"
                        >
                          <Banknote className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => openEdit(socio)}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
                          aria-label="Editar socio"
                          title="Editar"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {open ? (
        <div className="fixed inset-0 z-20 flex items-center justify-center bg-slate-900/40 p-4">
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl"
          >
            <h2 className="text-lg font-semibold text-slate-900">
              {editing ? 'Editar socio' : 'Nuevo socio'}
            </h2>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <input
                className="h-11 rounded-xl border border-slate-200 px-3 text-sm"
                placeholder="Nombre"
                {...register('nombre', { required: true })}
              />
              <input
                className="h-11 rounded-xl border border-slate-200 px-3 text-sm"
                placeholder="Apellido"
                {...register('apellido', { required: true })}
              />
              <input
                className="h-11 rounded-xl border border-slate-200 px-3 text-sm"
                placeholder="DNI"
                {...register('dni', { required: true })}
              />
              <input
                className="h-11 rounded-xl border border-slate-200 px-3 text-sm"
                placeholder="Teléfono"
                {...register('telefono')}
              />
              <select
                className="h-11 rounded-xl border border-slate-200 px-3 text-sm"
                {...sucursalField}
                onChange={(event) => {
                  sucursalField.onChange(event)
                  const planId = getValues('planId')
                  const plan = planes.find((item) => String(item.id) === String(planId))
                  if (plan && !planAplicaASede(plan, event.target.value)) {
                    setValue('planId', '')
                  }
                }}
              >
                <option value="">Sin sede</option>
                {sucursales.map((sucursal) => (
                  <option key={sucursal.id} value={sucursal.id}>
                    {sucursal.nombre}
                  </option>
                ))}
              </select>
              <select className="h-11 rounded-xl border border-slate-200 px-3 text-sm" {...register('planId')}>
                <option value="">Sin plan</option>
                {planesParaSelector(planes, sedeForm, planForm).map((plan) => (
                  <option key={plan.id} value={plan.id}>
                    {etiquetaPlan(plan)}
                  </option>
                ))}
              </select>
              <label className="col-span-2 flex items-center gap-2 text-sm text-slate-600">
                <input type="checkbox" {...register('activo')} />
                Socio activo
              </label>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="h-10 rounded-xl px-4 text-sm font-medium text-slate-600 hover:bg-slate-100"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="h-10 rounded-xl bg-slate-900 px-4 text-sm font-semibold text-white"
              >
                Guardar
              </button>
            </div>
          </form>
        </div>
      ) : null}

      {detalle ? (
        <div className="fixed inset-0 z-20 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-xl">
            <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-6 py-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  {detalle.persona.nombre} {detalle.persona.apellido}
                </h2>
                <p className="text-sm text-slate-500">Ficha del socio e historial de membresías</p>
              </div>
              <button
                type="button"
                onClick={() => setDetalle(null)}
                className="rounded-lg p-1 text-slate-500 hover:bg-slate-100"
                aria-label="Cerrar ficha"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
              {detalleLoading ? (
                <p className="text-sm text-slate-500">Cargando ficha...</p>
              ) : (
                <>
                  <dl className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <dt className="text-xs text-slate-400">DNI</dt>
                      <dd className="font-medium text-slate-900">{detalle.persona.dni}</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-slate-400">Teléfono</dt>
                      <dd className="font-medium text-slate-900">{detalle.persona.telefono || '—'}</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-slate-400">Sede</dt>
                      <dd className="font-medium text-slate-900">{detalle.sucursal?.nombre || 'Sin sede'}</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-slate-400">Plan actual</dt>
                      <dd className="font-medium text-slate-900">
                        {detalle.plan
                          ? `${detalle.plan.nombre} · ${coberturaPlan(detalle.plan)} · ${formatPrecio(detalle.plan.precio)}`
                          : 'Sin plan'}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs text-slate-400">Vencimiento</dt>
                      <dd className="font-medium text-slate-900">{formatFecha(detalle.fechaVencimiento)}</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-slate-400">Estado</dt>
                      <dd>
                        <span className={`rounded-full px-2 py-1 text-xs font-medium ${estadoSocio(detalle).className}`}>
                          {estadoSocio(detalle).label}
                        </span>
                      </dd>
                    </div>
                  </dl>

                  {(() => {
                    const estado = estadoSocio(detalle)
                    const deuda = deudaMembresia(detalle)
                    const pagado = Number(detalle.pagadoPeriodo) || 0
                    const precio = Number(detalle.plan?.precio) || 0
                    const ingresosTxt = textoIngresosPostVencimiento(detalle)

                    if (estado.label === 'Vencida') {
                      return (
                        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                          <p className="font-semibold">
                            {deuda > 0
                              ? `Deuda de membresía: ${formatPrecio(deuda)}`
                              : 'Membresía vencida'}
                          </p>
                          <p className="mt-1 text-xs text-red-700">
                            {`La cuota está vencida${
                              detalle.fechaVencimiento ? ` desde el ${formatFecha(detalle.fechaVencimiento)}` : ''
                            }.${
                              precio > 0
                                ? ` Pagó ${formatPrecio(pagado)} de ${formatPrecio(precio)} del período.`
                                : ' Asigná un plan para cobrar.'
                            }`}
                          </p>
                          {ingresosTxt ? <p className="mt-1 text-xs text-red-700">{ingresosTxt}</p> : null}
                        </div>
                      )
                    }

                    if (deuda > 0) {
                      return (
                        <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                          <p className="font-semibold">Deuda de membresía: {formatPrecio(deuda)}</p>
                          <p className="mt-1 text-xs text-amber-800">
                            {`Pagó ${formatPrecio(pagado)} de ${formatPrecio(precio)} del período actual${
                              detalle.fechaVencimiento ? ` (vence ${formatFecha(detalle.fechaVencimiento)})` : ''
                            }.`}
                          </p>
                        </div>
                      )
                    }

                    return (
                      <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                        Sin deuda de membresía
                      </div>
                    )
                  })()}

                  <div className="mt-5 flex items-center gap-1 border-b border-slate-200">
                    {[
                      { id: 'pagos', label: 'Pagos' },
                      { id: 'ingresos', label: 'Ingresos' },
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setDetalleTab(tab.id)}
                        className={`-mb-px border-b-2 px-3 py-2 text-sm font-medium ${
                          detalleTab === tab.id
                            ? 'border-indigo-700 text-indigo-700'
                            : 'border-transparent text-slate-500 hover:text-slate-700'
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>

                  {detalleTab === 'pagos' ? (
                    <>
                      <div className="mt-4 flex items-center justify-between">
                        <h3 className="text-sm font-semibold text-slate-900">Historial de pagos</h3>
                        {detalle.activo ? (
                          <button
                            type="button"
                            onClick={() => openPago(detalle)}
                            className="inline-flex h-9 items-center gap-1 rounded-lg bg-indigo-700 px-3 text-xs font-semibold text-white hover:bg-indigo-600"
                          >
                            <Banknote className="h-3.5 w-3.5" />
                            Cobrar
                          </button>
                        ) : null}
                      </div>

                      {!detalle.pagos?.length ? (
                        <p className="mt-3 text-sm text-slate-500">Todavía no hay pagos registrados.</p>
                      ) : (
                        <table className="mt-3 min-w-full text-left text-sm">
                          <thead className="text-xs font-semibold tracking-wide text-slate-500 uppercase">
                            <tr>
                              <th className="py-2 pr-3">Fecha</th>
                              <th className="py-2 pr-3">Plan</th>
                              <th className="py-2 pr-3">Período</th>
                              <th className="py-2 pr-3">Medio</th>
                              <th className="py-2 text-right">Monto</th>
                            </tr>
                          </thead>
                          <tbody>
                            {detalle.pagos.map((pago) => (
                              <tr key={pago.id} className="border-t border-slate-100">
                                <td className="py-2 pr-3">{formatFecha(pago.fechaPago || pago.createdAt)}</td>
                                <td className="py-2 pr-3">{pago.plan?.nombre || '—'}</td>
                                <td className="py-2 pr-3 text-xs text-slate-500">
                                  {formatFecha(pago.periodoDesde)} → {formatFecha(pago.periodoHasta)}
                                </td>
                                <td className="py-2 pr-3">
                                  {etiquetaPagoMembresia(pago)}
                                  {pago.recargo > 0 ? (
                                    <p className="text-xs text-slate-400">
                                      Incluye recargo {formatPrecio(pago.recargo)}
                                    </p>
                                  ) : null}
                                </td>
                                <td className="py-2 text-right font-medium">{formatPrecio(pago.monto)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </>
                  ) : (
                    <>
                      <h3 className="mt-4 text-sm font-semibold text-slate-900">Historial de ingresos</h3>
                      {!detalle.accesos?.length ? (
                        <p className="mt-3 text-sm text-slate-500">Todavía no hay ingresos registrados.</p>
                      ) : (
                        <ul className="mt-3 space-y-1 text-sm text-slate-600">
                          {detalle.accesos.map((acceso) => (
                            <li key={acceso.id} className="flex justify-between gap-3">
                              <span>
                                {formatFecha(acceso.createdAt, true)}
                                {acceso.sucursal?.nombre ? ` · ${acceso.sucursal.nombre}` : ''}
                              </span>
                              <span
                                className={
                                  acceso.resultado === 'PERMITIDO' ? 'text-emerald-700' : 'text-red-600'
                                }
                              >
                                {acceso.resultado === 'PERMITIDO' ? 'Permitido' : acceso.motivo || 'Denegado'}
                              </span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      ) : null}

      {pagoSocio ? (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-slate-900/40 p-4">
          <form
            onSubmit={cobrar}
            className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Cobrar membresía</h2>
                <p className="text-sm text-slate-500">
                  {pagoSocio.persona.apellido}, {pagoSocio.persona.nombre} · DNI {pagoSocio.persona.dni}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPagoSocio(null)}
                className="rounded-lg p-1 text-slate-500 hover:bg-slate-100"
                aria-label="Cerrar cobro"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <p className="mt-3 text-sm text-slate-600">
              Vence actualmente: {formatFecha(pagoSocio.fechaVencimiento)}
              {pagoDeuda > 0 ? ` · Deuda ${formatPrecio(pagoDeuda)}` : ''}
            </p>
            {textoIngresosPago && pagoCuotaVencida ? (
              <p className="mt-1 text-xs text-slate-500">{textoIngresosPago}</p>
            ) : null}

            <div className="mt-4 grid grid-cols-2 gap-3">
              <label className="col-span-2 text-xs text-slate-500">
                Plan
                <select
                  className="mt-1 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm text-slate-900"
                  value={pagoPlanId}
                  onChange={(event) => {
                    const id = event.target.value
                    setPagoPlanId(id)
                    const plan = planes.find((item) => String(item.id) === id)
                    setPagoMonto(montoSugerido(pagoSocio, plan))
                  }}
                  required
                >
                  <option value="">Elegí un plan</option>
                  {planesParaSelector(planes, pagoSocio.sucursalId, pagoPlanId)
                    .filter((plan) => planAplicaASede(plan, pagoSocio.sucursalId))
                    .map((plan) => (
                      <option key={plan.id} value={plan.id}>
                        {etiquetaPlan(plan)} · {plan.duracionDias} días
                      </option>
                    ))}
                </select>
                {planes.filter((plan) => plan.activa && planAplicaASede(plan, pagoSocio.sucursalId)).length === 0 ? (
                  <p className="mt-1 text-xs text-amber-700">
                    {pagoSocio.sucursalId
                      ? `No hay planes de ${pagoSocio.sucursal?.nombre || 'esta sede'}. En Membresías asigná la sede o marcalo como Multisede.`
                      : 'Este socio no tiene sede. Asignale una, o cobrá un plan Multisede.'}
                  </p>
                ) : null}
              </label>
              <label className="text-xs text-slate-500">
                Medio de pago
                <select
                  className="mt-1 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm text-slate-900"
                  value={pagoMedio}
                  onChange={(event) => {
                    const medio = event.target.value
                    setPagoMedio(medio)
                    if (medio === 'TRANSFERENCIA') {
                      setPagoRecargoTransf(String(RECARGO_TRANSFERENCIA_DEFAULT))
                    }
                    if (medio === 'CREDITO') setPagoCuotas(1)
                  }}
                >
                  {MEDIOS_MEMBRESIA.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-xs text-slate-500">
                Importe
                <input
                  type="number"
                  min="1"
                  step="1"
                  className="mt-1 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm text-slate-900"
                  value={pagoMonto}
                  onChange={(event) => setPagoMonto(event.target.value)}
                  required
                />
              </label>
              {pagoMedio === 'CREDITO' ? (
                <label className="col-span-2 text-xs text-slate-500">
                  Cuotas
                  <select
                    className="mt-1 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm text-slate-900"
                    value={pagoCuotas}
                    onChange={(event) => setPagoCuotas(Number(event.target.value))}
                  >
                    <option value={1}>1 cuota (+10%)</option>
                    <option value={3}>3 cuotas (+15%)</option>
                  </select>
                </label>
              ) : null}
              {pagoMedio === 'TRANSFERENCIA' ? (
                <label className="col-span-2 text-xs text-slate-500">
                  Recargo transferencia
                  <input
                    type="number"
                    min="0"
                    step="1"
                    className="mt-1 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm text-slate-900"
                    value={pagoRecargoTransf}
                    onChange={(event) => setPagoRecargoTransf(event.target.value)}
                  />
                </label>
              ) : null}
              {pagoRecargo > 0 || pagoMedio === 'TRANSFERENCIA' || pagoMedio === 'CREDITO' ? (
                <div className="col-span-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
                  <p>Recargo: {formatPrecio(pagoRecargo)}</p>
                  <p className="font-semibold text-slate-900">Total a cobrar: {formatPrecio(pagoTotal)}</p>
                </div>
              ) : null}
              <label className="col-span-2 text-xs text-slate-500">
                Fecha del pago
                <input
                  type="date"
                  className="mt-1 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm text-slate-900"
                  value={pagoFecha}
                  onChange={(event) => setPagoFecha(event.target.value)}
                  required
                />
              </label>
              <label className="col-span-2 text-xs text-slate-500">
                Nota
                <input
                  className="mt-1 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm text-slate-900"
                  placeholder="Opcional"
                  value={pagoNota}
                  onChange={(event) => setPagoNota(event.target.value)}
                />
              </label>
            </div>

            {mostrarModo ? (
              <fieldset className="mt-4 space-y-2 rounded-xl border border-slate-200 px-3 py-3">
                <legend className="px-1 text-xs font-medium text-slate-500">Vencimiento de la renovación</legend>
                <label className="flex items-start gap-2 text-sm text-slate-700">
                  <input
                    type="radio"
                    className="mt-1"
                    name="modoVencimiento"
                    checked={pagoModo === 'mantener'}
                    onChange={() => setPagoModo('mantener')}
                  />
                  <span>
                    {`Mantener el vencimiento actual (${formatFecha(pagoSocio.fechaVencimiento)}) y sumar los días del plan${
                      sugerirModoVencimiento(pagoSocio) === 'mantener' ? ' · sugerido' : ''
                    }`}
                  </span>
                </label>
                <label className="flex items-start gap-2 text-sm text-slate-700">
                  <input
                    type="radio"
                    className="mt-1"
                    name="modoVencimiento"
                    checked={pagoModo === 'desde_hoy'}
                    onChange={() => setPagoModo('desde_hoy')}
                  />
                  <span>
                    Empezar desde la fecha de pago
                    {sugerirModoVencimiento(pagoSocio) === 'desde_hoy' ? ' · sugerido' : ''}
                  </span>
                </label>
              </fieldset>
            ) : null}

            <p className="mt-3 text-xs text-slate-500">
              {periodoPreview
                ? periodoPreview.texto
                : 'Elegí un plan para ver el nuevo vencimiento.'}
            </p>

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setPagoSocio(null)}
                className="h-10 rounded-xl px-4 text-sm font-medium text-slate-600 hover:bg-slate-100"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={pagoSaving}
                className="h-10 rounded-xl bg-indigo-700 px-4 text-sm font-semibold text-white hover:bg-indigo-600 disabled:opacity-60"
              >
                {pagoSaving ? 'Registrando...' : 'Registrar pago'}
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </div>
  )
}

export default Socios
