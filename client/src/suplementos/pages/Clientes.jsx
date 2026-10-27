import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import Swal from 'sweetalert2'
import { Pencil, Plus, Users } from 'lucide-react'
import { clientesApi } from '../api/clientes'

const formatPrecio = (valor) =>
  new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  }).format(Number(valor) || 0)

const tipos = [
  { value: 'MINORISTA', label: 'Minorista' },
  { value: 'MAYORISTA', label: 'Mayorista' },
  { value: 'SOCIO_GYM', label: 'Socio gym' },
]

const emptyValues = {
  dni: '',
  nombre: '',
  apellido: '',
  telefono: '',
  tipo: 'MINORISTA',
  deuda: 0,
}

function Clientes() {
  const [clientes, setClientes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editing, setEditing] = useState(null)
  const [open, setOpen] = useState(false)
  const { register, handleSubmit, reset } = useForm({ defaultValues: emptyValues })

  const load = async () => {
    setError('')
    setClientes(await clientesApi.list())
  }

  useEffect(() => {
    load()
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  const openCreate = () => {
    setEditing(null)
    reset(emptyValues)
    setOpen(true)
  }

  const openEdit = (cliente) => {
    setEditing(cliente)
    reset({
      dni: cliente.persona.dni,
      nombre: cliente.persona.nombre,
      apellido: cliente.persona.apellido,
      telefono: cliente.persona.telefono || '',
      tipo: cliente.tipo,
      deuda: cliente.deuda,
    })
    setOpen(true)
  }

  const onSubmit = async (values) => {
    const payload = { ...values, deuda: Number(values.deuda) || 0 }
    try {
      if (editing) {
        await clientesApi.update(editing.id, payload)
      } else {
        await clientesApi.create(payload)
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
          <h1 className="text-2xl font-semibold text-slate-900">Clientes</h1>
          <p className="text-sm text-slate-500">FitMarket: minorista, mayorista y socio gym</p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex h-10 items-center gap-2 rounded-xl bg-emerald-600 px-4 text-sm font-semibold text-white hover:bg-emerald-500"
        >
          <Plus className="h-4 w-4" />
          Nuevo cliente
        </button>
      </div>

      {error ? (
        <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      ) : null}

      <div className="min-h-0 flex-1 overflow-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
        {loading ? (
          <p className="p-6 text-sm text-slate-500">Cargando clientes...</p>
        ) : clientes.length === 0 ? (
          <div className="flex h-48 flex-col items-center justify-center text-slate-500">
            <Users className="mb-2 h-8 w-8 text-slate-300" />
            Todavía no hay clientes
          </div>
        ) : (
          <table className="min-w-full text-left text-sm">
            <thead className="sticky top-0 bg-slate-50 text-xs font-semibold tracking-wide text-slate-500 uppercase">
              <tr>
                <th className="px-4 py-3">Cliente</th>
                <th className="px-4 py-3">DNI</th>
                <th className="px-4 py-3">Tipo</th>
                <th className="px-4 py-3">Deuda</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {clientes.map((cliente) => (
                <tr key={cliente.id} className="border-t border-slate-100">
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-900">
                      {cliente.persona.nombre} {cliente.persona.apellido}
                    </p>
                    <p className="text-xs text-slate-400">
                      {cliente.persona.telefono || 'Sin teléfono'}
                    </p>
                  </td>
                  <td className="px-4 py-3">{cliente.persona.dni}</td>
                  <td className="px-4 py-3">{cliente.tipo.replace('_', ' ')}</td>
                  <td className="px-4 py-3">{formatPrecio(cliente.deuda)}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => openEdit(cliente)}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
                      aria-label="Editar cliente"
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
              {editing ? 'Editar cliente' : 'Nuevo cliente'}
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
                {...register('tipo')}
              >
                {tipos.map((tipo) => (
                  <option key={tipo.value} value={tipo.value}>
                    {tipo.label}
                  </option>
                ))}
              </select>
              <input
                type="number"
                className="h-11 rounded-xl border border-slate-200 px-3 text-sm"
                placeholder="Deuda"
                {...register('deuda', { valueAsNumber: true })}
              />
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

export default Clientes
