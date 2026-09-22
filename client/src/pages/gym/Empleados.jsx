import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import Swal from 'sweetalert2'
import { Pencil, Plus, UserCog } from 'lucide-react'
import { empleadosApi } from '../../api/gym'
import { sucursalesApi } from '../../api/sucursales'
import { useAuth } from '../../context/AuthContext'

const emptyValues = {
  email: '',
  password: '',
  nombre: '',
  apellido: '',
  dni: '',
  telefono: '',
  role: 'EMPLEADO',
  sucursalId: '',
  activo: true,
}

function Empleados() {
  const { user } = useAuth()
  const [empleados, setEmpleados] = useState([])
  const [sucursales, setSucursales] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editing, setEditing] = useState(null)
  const [open, setOpen] = useState(false)
  const { register, handleSubmit, reset } = useForm({ defaultValues: emptyValues })

  const load = async () => {
    setError('')
    const [lista, sedes] = await Promise.all([empleadosApi.list(), sucursalesApi.list(true)])
    setEmpleados(lista)
    setSucursales(sedes.filter((item) => item.activa))
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

  const openEdit = (empleado) => {
    setEditing(empleado)
    reset({
      email: empleado.email,
      password: '',
      nombre: empleado.persona?.nombre || '',
      apellido: empleado.persona?.apellido || '',
      dni: empleado.persona?.dni || '',
      telefono: empleado.persona?.telefono || '',
      role: empleado.role === 'SUPERADMIN' ? 'SUPERADMIN' : 'EMPLEADO',
      sucursalId: empleado.sucursalId || '',
      activo: empleado.activo,
    })
    setOpen(true)
  }

  const onSubmit = async (values) => {
    const payload = {
      ...values,
      sucursalId: values.sucursalId ? Number(values.sucursalId) : null,
      activo: values.activo === true || values.activo === 'true',
    }
    if (editing && !payload.password) {
      delete payload.password
    }
    try {
      if (editing) {
        await empleadosApi.update(editing.id, payload)
      } else {
        await empleadosApi.create(payload)
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
          <h1 className="text-2xl font-semibold text-slate-900">Empleados</h1>
          <p className="text-sm text-slate-500">Usuarios con acceso al sistema</p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex h-10 items-center gap-2 rounded-xl bg-indigo-700 px-4 text-sm font-semibold text-white hover:bg-indigo-600"
        >
          <Plus className="h-4 w-4" />
          Nuevo empleado
        </button>
      </div>

      {error ? (
        <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      ) : null}

      <div className="min-h-0 flex-1 overflow-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
        {loading ? (
          <p className="p-6 text-sm text-slate-500">Cargando empleados...</p>
        ) : empleados.length === 0 ? (
          <div className="flex h-48 flex-col items-center justify-center text-slate-500">
            <UserCog className="mb-2 h-8 w-8 text-slate-300" />
            Todavía no hay empleados
          </div>
        ) : (
          <table className="min-w-full text-left text-sm">
            <thead className="sticky top-0 bg-slate-50 text-xs font-semibold tracking-wide text-slate-500 uppercase">
              <tr>
                <th className="px-4 py-3">Empleado</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Rol</th>
                <th className="px-4 py-3">Sede</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {empleados.map((empleado) => (
                <tr key={empleado.id} className="border-t border-slate-100">
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-900">
                      {empleado.persona
                        ? `${empleado.persona.nombre} ${empleado.persona.apellido}`
                        : 'Sin persona'}
                    </p>
                    <p className="text-xs text-slate-400">{empleado.persona?.dni || '—'}</p>
                  </td>
                  <td className="px-4 py-3">{empleado.email}</td>
                  <td className="px-4 py-3">{empleado.role}</td>
                  <td className="px-4 py-3">{empleado.sucursal?.nombre || 'Sin asignar'}</td>
                  <td className="px-4 py-3">
                    <span
                      className={
                        empleado.activo
                          ? 'rounded-full bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700'
                          : 'rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-500'
                      }
                    >
                      {empleado.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => openEdit(empleado)}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
                      aria-label="Editar empleado"
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
            className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl"
          >
            <h2 className="text-lg font-semibold text-slate-900">
              {editing ? 'Editar empleado' : 'Nuevo empleado'}
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
              <input
                className="col-span-2 h-11 rounded-xl border border-slate-200 px-3 text-sm"
                placeholder="Email"
                type="email"
                {...register('email', { required: true })}
              />
              <input
                className="col-span-2 h-11 rounded-xl border border-slate-200 px-3 text-sm"
                placeholder={editing ? 'Nueva contraseña (opcional)' : 'Contraseña'}
                type="password"
                {...register('password', { required: !editing })}
              />
              <select className="h-11 rounded-xl border border-slate-200 px-3 text-sm" {...register('role')}>
                <option value="EMPLEADO">Empleado</option>
                <option value="SUPERADMIN">Superadmin</option>
              </select>
              <select className="h-11 rounded-xl border border-slate-200 px-3 text-sm" {...register('sucursalId')}>
                <option value="">Sin sede</option>
                {sucursales.map((sucursal) => (
                  <option key={sucursal.id} value={sucursal.id}>
                    {sucursal.nombre}
                  </option>
                ))}
              </select>
              <label className="col-span-2 flex items-center gap-2 text-sm text-slate-600">
                <input type="checkbox" {...register('activo')} />
                Usuario activo
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

export default Empleados
