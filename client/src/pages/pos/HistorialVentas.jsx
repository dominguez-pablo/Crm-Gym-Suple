import { useEffect, useState } from 'react'
import dayjs from 'dayjs'
import Swal from 'sweetalert2'
import { Eye, Receipt } from 'lucide-react'
import { ventasApi } from '../../api/ventas'
import { useSucursalStore } from '../../store/sucursalStore'
import { nombreCortoSucursal } from '../../utils/stock'
import {
  etiquetaEstado,
  etiquetaMedio,
  formatPrecio,
  nombreCliente,
} from '../../utils/venta'

function HistorialVentas() {
  const sucursalId = useSucursalStore((state) => state.sucursalId)
  const [ventas, setVentas] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [detalle, setDetalle] = useState(null)
  const [cargandoDetalle, setCargandoDetalle] = useState(false)

  const load = async () => {
    setError('')
    setVentas(await ventasApi.list(sucursalId))
  }

  useEffect(() => {
    if (!sucursalId) {
      setLoading(false)
      return
    }
    setLoading(true)
    load()
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [sucursalId])

  const abrirDetalle = async (id) => {
    setCargandoDetalle(true)
    try {
      setDetalle(await ventasApi.get(id))
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'No se pudo cargar el detalle', text: err.message })
    } finally {
      setCargandoDetalle(false)
    }
  }

  const marcarRetirado = async (venta) => {
    const confirm = await Swal.fire({
      title: '¿Marcar como retirado?',
      text: `Venta #${venta.id}`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Marcar retirado',
      cancelButtonText: 'Volver',
    })
    if (!confirm.isConfirmed) return

    try {
      const actualizada = await ventasApi.updateEstado(venta.id, 'RETIRADO')
      setVentas((lista) => lista.map((item) => (item.id === venta.id ? actualizada : item)))
      setDetalle(actualizada)
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'No se pudo actualizar', text: err.message })
    }
  }

  if (loading) {
    return <p className="text-sm text-slate-500">Cargando ventas...</p>
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="mb-4">
        <h1 className="text-xl font-semibold text-slate-900">Ventas realizadas</h1>
        <p className="text-sm text-slate-500">Últimas 100 operaciones de este local</p>
      </div>

      {error ? (
        <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      ) : null}

      <div className="min-h-0 flex-1 overflow-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
        {ventas.length === 0 ? (
          <div className="flex h-48 flex-col items-center justify-center text-slate-500">
            <Receipt className="mb-2 h-8 w-8 text-slate-300" />
            Todavía no hay ventas
          </div>
        ) : (
          <table className="min-w-full text-left text-sm">
            <thead className="sticky top-0 bg-slate-50 text-xs font-semibold tracking-wide text-slate-500 uppercase">
              <tr>
                <th className="px-4 py-3">#</th>
                <th className="px-4 py-3">Cliente</th>
                <th className="px-4 py-3">Local</th>
                <th className="px-4 py-3">Fecha</th>
                <th className="px-4 py-3">Total</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {ventas.map((venta) => (
                <tr key={venta.id} className="border-t border-slate-100">
                  <td className="px-4 py-3 font-medium text-slate-900">{venta.id}</td>
                  <td className="px-4 py-3">
                    {venta.cliente ? nombreCliente(venta.cliente) : 'Consumidor final'}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {nombreCortoSucursal(venta.sucursal?.nombre)}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {dayjs(venta.fecha).format('DD/MM/YYYY HH:mm')}
                  </td>
                  <td className="px-4 py-3 font-medium">{formatPrecio(venta.total)}</td>
                  <td className="px-4 py-3">
                    <span
                      className={[
                        'rounded-full px-2 py-1 text-xs font-medium',
                        venta.estado === 'SEPARADO'
                          ? 'bg-amber-50 text-amber-700'
                          : 'bg-emerald-50 text-emerald-700',
                      ].join(' ')}
                    >
                      {etiquetaEstado(venta.estado)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => abrirDetalle(venta.id)}
                      disabled={cargandoDetalle}
                      className="inline-flex h-8 items-center gap-1 rounded-lg border border-slate-200 px-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      Ver detalle
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {detalle ? (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Venta #{detalle.id}</h2>
                <p className="text-sm text-slate-500">
                  {dayjs(detalle.fecha).format('DD/MM/YYYY HH:mm')} · {etiquetaEstado(detalle.estado)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setDetalle(null)}
                className="rounded-lg px-2 py-1 text-sm text-slate-500 hover:bg-slate-100"
              >
                Cerrar
              </button>
            </div>

            <p className="mt-4 text-sm text-slate-700">
              <span className="font-medium">Local:</span>{' '}
              {detalle.sucursal?.nombre || '—'}
            </p>
            <p className="mt-1 text-sm text-slate-700">
              <span className="font-medium">Cliente:</span>{' '}
              {detalle.cliente ? nombreCliente(detalle.cliente) : 'Consumidor final'}
            </p>

            <h3 className="mt-4 text-sm font-semibold text-slate-900">Productos</h3>
            <ul className="mt-2 divide-y divide-slate-100 rounded-xl border border-slate-100">
              {(detalle.detalles || []).map((linea) => (
                <li key={linea.id} className="flex items-center justify-between px-3 py-2 text-sm">
                  <span>
                    {linea.producto?.nombre || `Producto #${linea.productoId}`} × {linea.cantidad}
                  </span>
                  <span className="font-medium">
                    {formatPrecio(linea.precioUnitario * linea.cantidad)}
                  </span>
                </li>
              ))}
            </ul>

            <h3 className="mt-4 text-sm font-semibold text-slate-900">Pagos</h3>
            <ul className="mt-2 divide-y divide-slate-100 rounded-xl border border-slate-100">
              {(detalle.pagos || []).map((pago) => (
                <li key={pago.id} className="flex items-center justify-between px-3 py-2 text-sm">
                  <span>
                    {etiquetaMedio(pago.medio)}
                    {pago.medio === 'CREDITO' ? ` · ${pago.cuotas} cuota${pago.cuotas === 1 ? '' : 's'}` : ''}
                    {pago.nota ? ` · ${pago.nota}` : ''}
                  </span>
                  <span className="font-medium">{formatPrecio(pago.monto)}</span>
                </li>
              ))}
            </ul>

            <div className="mt-4 flex items-center justify-between rounded-xl bg-slate-900 px-4 py-3 text-white">
              <span className="text-sm">Total</span>
              <span className="text-lg font-bold">{formatPrecio(detalle.total)}</span>
            </div>

            {detalle.estado === 'SEPARADO' ? (
              <button
                type="button"
                onClick={() => marcarRetirado(detalle)}
                className="mt-4 inline-flex h-11 w-full items-center justify-center rounded-xl bg-emerald-600 text-sm font-semibold text-white hover:bg-emerald-500"
              >
                Marcar retirado
              </button>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  )
}

export default HistorialVentas
