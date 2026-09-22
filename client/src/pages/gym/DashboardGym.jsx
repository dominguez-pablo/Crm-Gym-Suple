import { useCallback, useEffect, useState } from 'react'
import { AlertTriangle, DoorOpen, Users, Wallet } from 'lucide-react'
import { gymApi } from '../../api/gym'
import { useGymSucursalStore } from '../../store/gymSucursalStore'
import { formatPrecio } from '../../utils/modulos'
import { formatFecha } from '../../utils/gym'

function DashboardGym() {
  const sucursalId = useGymSucursalStore((state) => state.sucursalId)
  const sucursales = useGymSucursalStore((state) => state.sucursales)
  const sucursal = sucursales.find((item) => item.id === sucursalId)
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    if (!sucursalId) return
    setData(await gymApi.dashboard(sucursalId))
  }, [sucursalId])

  useEffect(() => {
    if (!sucursalId) {
      setLoading(false)
      return
    }
    setLoading(true)
    load()
      .then(() => setError(''))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [load, sucursalId])

  if (!sucursalId) {
    return <p className="text-sm text-slate-500">Elegí la sede para ver el resumen.</p>
  }

  if (loading) {
    return <p className="text-sm text-slate-500">Cargando dashboard...</p>
  }

  if (error) {
    return <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
  }

  if (!data) {
    return <p className="text-sm text-slate-500">Cargando dashboard...</p>
  }

  const kpis = [
    { label: 'Socios al día', value: data.kpis.sociosActivos, icon: Users },
    { label: 'Cuotas vencidas', value: data.kpis.sociosVencidos, icon: AlertTriangle },
    { label: 'Ingresos de hoy', value: data.kpis.accesosHoy, icon: DoorOpen },
    { label: 'Cobrado hoy', value: formatPrecio(data.kpis.totalHoy), icon: Wallet },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Dashboard</h1>
        <p className="text-sm text-slate-500">
          Resumen de {sucursal?.nombre || 'Infinity Academia'}
          {data.kpis.cajaAbierta ? ' · Caja abierta' : ' · Caja cerrada'}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map(({ label, value, icon: Icon }) => (
          <article
            key={label}
            className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-500">{label}</p>
              <Icon className="h-4 w-4 text-slate-400" />
            </div>
            <p className="mt-2 text-2xl font-semibold text-slate-900">{value}</p>
          </article>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-900">Últimos pagos</h2>
          {data.pagosRecientes.length === 0 ? (
            <p className="mt-4 text-sm text-slate-500">Todavía no hay cobros en esta sede.</p>
          ) : (
            <ul className="mt-4 divide-y divide-slate-100">
              {data.pagosRecientes.map((pago) => (
                <li key={pago.id} className="flex items-center justify-between py-2 text-sm">
                  <div>
                    <p className="font-medium text-slate-800">
                      {pago.socio?.persona
                        ? `${pago.socio.persona.nombre} ${pago.socio.persona.apellido}`
                        : 'Socio'}
                    </p>
                    <p className="text-xs text-slate-400">
                      {formatFecha(pago.fechaPago || pago.createdAt)} · {pago.plan?.nombre} · {pago.medio}
                    </p>
                  </div>
                  <span className="font-semibold text-slate-900">{formatPrecio(pago.monto)}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-900">Últimos ingresos</h2>
          {data.accesosRecientes.length === 0 ? (
            <p className="mt-4 text-sm text-slate-500">Todavía no hay ingresos registrados.</p>
          ) : (
            <ul className="mt-4 divide-y divide-slate-100">
              {data.accesosRecientes.map((acceso) => (
                <li key={acceso.id} className="flex items-center justify-between py-2 text-sm">
                  <div>
                    <p className="font-medium text-slate-800">
                      {acceso.socio?.persona
                        ? `${acceso.socio.persona.nombre} ${acceso.socio.persona.apellido}`
                        : `DNI ${acceso.dni}`}
                    </p>
                    <p className="text-xs text-slate-400">
                      {formatFecha(acceso.createdAt, true)}
                      {acceso.motivo ? ` · ${acceso.motivo}` : ''}
                    </p>
                  </div>
                  <span
                    className={
                      acceso.resultado === 'PERMITIDO'
                        ? 'text-xs font-semibold text-emerald-700'
                        : 'text-xs font-semibold text-red-600'
                    }
                  >
                    {acceso.resultado === 'PERMITIDO' ? 'Permitido' : 'Denegado'}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  )
}

export default DashboardGym
