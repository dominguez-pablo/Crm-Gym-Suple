import { useCallback, useEffect, useState } from 'react'
import dayjs from 'dayjs'
import { AlertTriangle, Package, ShoppingCart, Users, Wallet } from 'lucide-react'
import { dashboardApi } from '../api/dashboard'
import { useStockEvents } from '../hooks/useStockEvents'
import { useSucursalStore } from '../store/sucursalStore'
import { nombreCortoSucursal } from '../utils/stock'

const formatPrecio = (valor) =>
  new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  }).format(Number(valor) || 0)

function Dashboard() {
  const sucursalId = useSucursalStore((state) => state.sucursalId)
  const sucursales = useSucursalStore((state) => state.sucursales)
  const sucursal = sucursales.find((item) => item.id === sucursalId)
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    if (!sucursalId) return
    const next = await dashboardApi.get(sucursalId)
    setData(next)
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

  const onStockEvent = useCallback(() => {
    load().catch(() => {})
  }, [load])

  useStockEvents(onStockEvent)

  if (!sucursalId) {
    return <p className="text-sm text-slate-500">Elegí el local para ver el resumen.</p>
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
    {
      label: 'Ventas de hoy',
      value: data.kpis.ventasHoy,
      icon: ShoppingCart,
    },
    {
      label: 'Total cobrado hoy',
      value: formatPrecio(data.kpis.totalHoy),
      icon: Wallet,
    },
    {
      label: 'Clientes',
      value: data.kpis.clientes,
      icon: Users,
    },
    {
      label: 'Stock bajo',
      value: data.kpis.stockBajo,
      icon: AlertTriangle,
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Dashboard</h1>
        <p className="text-sm text-slate-500">
          Resumen operativo de {sucursal?.nombre || 'Fit Market'}
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
          <h2 className="text-sm font-semibold text-slate-900">Stock bajo</h2>
          {data.stockBajo.length === 0 ? (
            <p className="mt-4 text-sm text-slate-500">No hay productos bajo el mínimo.</p>
          ) : (
            <ul className="mt-4 divide-y divide-slate-100">
              {data.stockBajo.map((item) => (
                <li key={item.id} className="flex items-center justify-between py-2 text-sm">
                  <span className="flex min-w-0 items-center gap-2 text-slate-700">
                    <Package className="h-4 w-4 shrink-0 text-amber-600" />
                    <span className="truncate">
                      {item.nombre}
                      <span className="ml-1 text-xs text-slate-400">
                        · {nombreCortoSucursal(item.sucursalNombre)}
                      </span>
                    </span>
                  </span>
                  <span className="font-medium text-amber-700">
                    {item.cantidad}/{item.stockMinimo}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-900">Últimas ventas</h2>
          {data.ventasRecientes.length === 0 ? (
            <p className="mt-4 text-sm text-slate-500">Todavía no hay ventas registradas.</p>
          ) : (
            <ul className="mt-4 divide-y divide-slate-100">
              {data.ventasRecientes.map((venta) => (
                <li key={venta.id} className="flex items-center justify-between py-2 text-sm">
                  <div>
                    <p className="font-medium text-slate-800">
                      {venta.cliente
                        ? `${venta.cliente.persona.nombre} ${venta.cliente.persona.apellido}`
                        : 'Consumidor final'}
                    </p>
                    <p className="text-xs text-slate-400">
                      {dayjs(venta.fecha).format('DD/MM HH:mm')} · {venta.medioPago}
                    </p>
                  </div>
                  <span className="font-semibold text-slate-900">
                    {formatPrecio(venta.total)}
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

export default Dashboard
