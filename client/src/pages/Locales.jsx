import { useEffect, useMemo, useState } from 'react'
import { Navigate } from 'react-router-dom'
import Swal from 'sweetalert2'
import { MapPin, Pencil, Plus, RotateCcw, Store } from 'lucide-react'
import { sucursalesApi } from '../api/sucursales'
import { useAuth } from '../context/AuthContext'
import { useSucursalStore } from '../store/sucursalStore'

function Locales() {
  const { user } = useAuth()
  const reloadActivas = useSucursalStore((state) => state.load)
  const [locales, setLocales] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [nombre, setNombre] = useState('')
  const [cierre, setCierre] = useState(null)
  const [destinoId, setDestinoId] = useState('')

  const activas = useMemo(() => locales.filter((item) => item.activa), [locales])

  const load = async () => {
    setError('')
    setLocales(await sucursalesApi.list(true))
  }

  useEffect(() => {
    load()
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  if (user?.role !== 'SUPERADMIN') {
    return <Navigate to="/fit-market" replace />
  }

  const openCreate = () => {
    setEditing(null)
    setNombre('')
    setOpen(true)
  }

  const openEdit = (local) => {
    setEditing(local)
    setNombre(local.nombre)
    setOpen(true)
  }

  const guardar = async (event) => {
    event.preventDefault()
    try {
      if (editing) {
        await sucursalesApi.update(editing.id, { nombre })
      } else {
        await sucursalesApi.create({ nombre })
      }
      setOpen(false)
      await Promise.all([load(), reloadActivas({ silent: true })])
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'No se pudo guardar', text: err.message })
    }
  }

  const pedirCierre = (local) => {
    const destinos = activas.filter((item) => item.id !== local.id)
    setCierre(local)
    setDestinoId(destinos[0] ? String(destinos[0].id) : '')
  }

  const confirmarCierre = async (event) => {
    event.preventDefault()
    if (!cierre) return
    try {
      await sucursalesApi.cerrar(
        cierre.id,
        cierre.stockTotal > 0 ? { sucursalDestinoId: Number(destinoId) } : {},
      )
      setCierre(null)
      await Promise.all([load(), reloadActivas({ silent: true })])
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'No se pudo cerrar', text: err.message })
    }
  }

  const reabrir = async (local) => {
    try {
      await sucursalesApi.reabrir(local.id)
      await Promise.all([load(), reloadActivas({ silent: true })])
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'No se pudo reabrir', text: err.message })
    }
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Locales</h1>
          <p className="text-sm text-slate-500">Altas, cierres y puntos de venta activos</p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex h-10 items-center gap-2 rounded-xl bg-emerald-600 px-4 text-sm font-semibold text-white hover:bg-emerald-500"
        >
          <Plus className="h-4 w-4" />
          Nuevo local
        </button>
      </div>

      {error ? (
        <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      ) : null}

      <div className="min-h-0 flex-1 overflow-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
        {loading ? (
          <p className="p-6 text-sm text-slate-500">Cargando locales...</p>
        ) : locales.length === 0 ? (
          <div className="flex h-48 flex-col items-center justify-center text-slate-500">
            <Store className="mb-2 h-8 w-8 text-slate-300" />
            Todavía no hay puntos de venta
          </div>
        ) : (
          <table className="min-w-full text-left text-sm">
            <thead className="sticky top-0 bg-slate-50 text-xs font-semibold tracking-wide text-slate-500 uppercase">
              <tr>
                <th className="px-4 py-3">Local</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3">Stock total</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {locales.map((local) => (
                <tr key={local.id} className="border-t border-slate-100">
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-900">{local.nombre}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={
                        local.activa
                          ? 'rounded-full bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700'
                          : 'rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-500'
                      }
                    >
                      {local.activa ? 'Activo' : 'Cerrado'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-700">{local.stockTotal}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => openEdit(local)}
                      className="mr-2 inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
                      aria-label={`Renombrar ${local.nombre}`}
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    {local.activa ? (
                      <button
                        type="button"
                        onClick={() => pedirCierre(local)}
                        disabled={activas.length <= 1}
                        className="inline-flex h-8 items-center rounded-lg border border-slate-200 px-2 text-xs font-medium text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        Cerrar
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => reabrir(local)}
                        className="inline-flex h-8 items-center gap-1 rounded-lg border border-slate-200 px-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
                      >
                        <RotateCcw className="h-3.5 w-3.5" />
                        Reabrir
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {open ? (
        <div className="fixed inset-0 z-20 flex items-center justify-center bg-slate-900/40 p-4">
          <form onSubmit={guardar} className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="text-lg font-semibold text-slate-900">
              {editing ? 'Renombrar local' : 'Nuevo local'}
            </h2>
            <label className="mt-4 block text-xs text-slate-500">
              Nombre
              <input
                className="mt-1 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm"
                value={nombre}
                onChange={(event) => setNombre(event.target.value)}
                placeholder="Fit Market Norte"
                required
              />
            </label>
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

      {cierre ? (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-slate-900/40 p-4">
          <form
            onSubmit={confirmarCierre}
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
          >
            <div className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-slate-400" />
              <h2 className="text-lg font-semibold text-slate-900">Cerrar {cierre.nombre}</h2>
            </div>
            {cierre.stockTotal > 0 ? (
              <>
                <p className="mt-2 text-sm text-slate-500">
                  Hay {cierre.stockTotal} unidades. Elegí a qué local activo se mueve todo el
                  stock.
                </p>
                <label className="mt-4 block text-xs text-slate-500">
                  Destino
                  <select
                    className="mt-1 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm"
                    value={destinoId}
                    onChange={(event) => setDestinoId(event.target.value)}
                    required
                  >
                    {activas
                      .filter((item) => item.id !== cierre.id)
                      .map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.nombre}
                        </option>
                      ))}
                  </select>
                </label>
              </>
            ) : (
              <p className="mt-2 text-sm text-slate-500">
                No tiene stock. El local se cierra y deja de aparecer en el punto de venta.
              </p>
            )}
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setCierre(null)}
                className="h-10 rounded-xl px-4 text-sm font-medium text-slate-600 hover:bg-slate-100"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="h-10 rounded-xl bg-red-600 px-4 text-sm font-semibold text-white hover:bg-red-500"
              >
                Cerrar local
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </div>
  )
}

export default Locales
