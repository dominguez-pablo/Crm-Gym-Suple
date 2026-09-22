import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import Swal from 'sweetalert2'
import { Banknote, Pencil, Plus } from 'lucide-react'
import { gymApi } from '../../api/gym'
import { useAuth } from '../../context/AuthContext'
import { useGymSucursalStore } from '../../store/gymSucursalStore'
import { coberturaPlan } from '../../utils/gym'
import { formatPrecio } from '../../utils/modulos'

const emptyValues = {
  nombre: '',
  duracionDias: 30,
  precio: 0,
  activa: true,
  multisede: false,
  sucursalId: '',
}

function Membresias() {
  const { user } = useAuth()
  const sucursales = useGymSucursalStore((state) => state.sucursales)
  const [planes, setPlanes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editing, setEditing] = useState(null)
  const [open, setOpen] = useState(false)
  const { register, handleSubmit, reset, watch } = useForm({ defaultValues: emptyValues })
  const multisede = watch('multisede')

  const load = async () => {
    setError('')
    setPlanes(await gymApi.planes.list(true))
  }

  useEffect(() => {
    load()
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  if (user?.role !== 'SUPERADMIN') {
    return <Navigate to="/infinity-academia" replace />
  }

  const openCreate = () => {
    setEditing(null)
    reset(emptyValues)
    setOpen(true)
  }

  const openEdit = (plan) => {
    setEditing(plan)
    reset({
      nombre: plan.nombre,
      duracionDias: plan.duracionDias,
      precio: plan.precio,
      activa: plan.activa,
      multisede: Boolean(plan.multisede),
      sucursalId: plan.sucursalId ? String(plan.sucursalId) : '',
    })
    setOpen(true)
  }

  const onSubmit = async (values) => {
    const esMultisede = values.multisede === true || values.multisede === 'true'
    if (!esMultisede && !values.sucursalId) {
      Swal.fire({ icon: 'info', title: 'Elegí la sede', text: 'O marcá el plan como Multisede.' })
      return
    }
    const payload = {
      nombre: values.nombre,
      duracionDias: Number(values.duracionDias),
      precio: Number(values.precio),
      activa: values.activa === true || values.activa === 'true',
      multisede: esMultisede,
      sucursalId: esMultisede ? null : Number(values.sucursalId),
    }
    try {
      if (editing) {
        await gymApi.planes.update(editing.id, payload)
      } else {
        await gymApi.planes.create(payload)
      }
      setOpen(false)
      await load()
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'No se pudo guardar', text: err.message })
    }
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Membresías</h1>
          <p className="text-sm text-slate-500">
            Cada plan tiene el precio de una sede. Multisede habilita el ingreso en todas.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex h-10 items-center gap-2 rounded-xl bg-indigo-700 px-4 text-sm font-semibold text-white hover:bg-indigo-600"
        >
          <Plus className="h-4 w-4" />
          Nuevo plan
        </button>
      </div>

      {error ? (
        <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      ) : null}

      <div className="min-h-0 flex-1 overflow-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
        {loading ? (
          <p className="p-6 text-sm text-slate-500">Cargando planes...</p>
        ) : planes.length === 0 ? (
          <div className="flex h-48 flex-col items-center justify-center text-slate-500">
            <Banknote className="mb-2 h-8 w-8 text-slate-300" />
            Todavía no hay planes
          </div>
        ) : (
          <table className="min-w-full text-left text-sm">
            <thead className="sticky top-0 bg-slate-50 text-xs font-semibold tracking-wide text-slate-500 uppercase">
              <tr>
                <th className="px-4 py-3">Plan</th>
                <th className="px-4 py-3">Cobertura</th>
                <th className="px-4 py-3">Duración</th>
                <th className="px-4 py-3">Precio</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {planes.map((plan) => (
                <tr key={plan.id} className="border-t border-slate-100">
                  <td className="px-4 py-3 font-medium text-slate-900">{plan.nombre}</td>
                  <td className="px-4 py-3">{coberturaPlan(plan)}</td>
                  <td className="px-4 py-3">{plan.duracionDias} días</td>
                  <td className="px-4 py-3">{formatPrecio(plan.precio)}</td>
                  <td className="px-4 py-3">
                    <span
                      className={
                        plan.activa
                          ? 'rounded-full bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700'
                          : 'rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-500'
                      }
                    >
                      {plan.activa ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => openEdit(plan)}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
                      aria-label="Editar plan"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {open ? (
        <div className="fixed inset-0 z-20 flex items-center justify-center bg-slate-900/40 p-4">
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
          >
            <h2 className="text-lg font-semibold text-slate-900">
              {editing ? 'Editar plan' : 'Nuevo plan'}
            </h2>
            <div className="mt-4 grid gap-3">
              <input
                className="h-11 rounded-xl border border-slate-200 px-3 text-sm"
                placeholder="Nombre"
                {...register('nombre', { required: true })}
              />
              <input
                type="number"
                className="h-11 rounded-xl border border-slate-200 px-3 text-sm"
                placeholder="Duración en días"
                {...register('duracionDias', { required: true, valueAsNumber: true })}
              />
              <input
                type="number"
                className="h-11 rounded-xl border border-slate-200 px-3 text-sm"
                placeholder="Precio"
                {...register('precio', { required: true, valueAsNumber: true })}
              />
              <label className="flex items-center gap-2 text-sm text-slate-600">
                <input type="checkbox" {...register('multisede')} />
                Multisede (válida en todas las sedes)
              </label>
              {multisede ? null : (
                <select
                  className="h-11 rounded-xl border border-slate-200 px-3 text-sm"
                  {...register('sucursalId')}
                >
                  <option value="">Elegí la sede</option>
                  {sucursales.map((sucursal) => (
                    <option key={sucursal.id} value={sucursal.id}>
                      {sucursal.nombre}
                    </option>
                  ))}
                </select>
              )}
              <label className="flex items-center gap-2 text-sm text-slate-600">
                <input type="checkbox" {...register('activa')} />
                Plan activo
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
    </div>
  )
}

export default Membresias
