import { useForm } from 'react-hook-form'
import Swal from 'sweetalert2'
import { clientesApi } from '../../api/clientes'

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
}

function NuevoClienteModal({ onClose, onCreated }) {
  const {
    register,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm({ defaultValues: emptyValues })

  const onSubmit = async (values) => {
    try {
      const creado = await clientesApi.create({ ...values, deuda: 0 })
      onCreated(creado)
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'No se pudo crear el cliente', text: err.message })
    }
  }

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-slate-900/40 p-4">
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl"
      >
        <h2 className="text-lg font-semibold text-slate-900">Nuevo cliente</h2>
        <p className="mt-1 text-sm text-slate-500">Se asocia a esta venta al guardarlo</p>
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
            className="col-span-2 h-11 rounded-xl border border-slate-200 px-3 text-sm"
            {...register('tipo')}
          >
            {tipos.map((tipo) => (
              <option key={tipo.value} value={tipo.value}>
                {tipo.label}
              </option>
            ))}
          </select>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="h-10 rounded-xl px-4 text-sm font-medium text-slate-600 hover:bg-slate-100"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="h-10 rounded-xl bg-slate-900 px-4 text-sm font-semibold text-white disabled:opacity-60"
          >
            {isSubmitting ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </form>
    </div>
  )
}

export default NuevoClienteModal
