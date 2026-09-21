import { CircleUser, LogOut } from 'lucide-react'
import Swal from 'sweetalert2'
import { useAuth } from '../../context/AuthContext'
import { useSucursalStore } from '../../store/sucursalStore'
import { nombreCortoSucursal } from '../../utils/stock'

function displayName(user) {
  if (user?.persona) {
    return `${user.persona.nombre} ${user.persona.apellido}`
  }
  return user?.email || 'Administrador'
}

function Topbar() {
  const { user, logout } = useAuth()
  const sucursales = useSucursalStore((state) => state.sucursales)
  const sucursalId = useSucursalStore((state) => state.sucursalId)
  const setSucursalId = useSucursalStore((state) => state.setSucursalId)

  const cambiarSucursal = async (event) => {
    const nextId = Number(event.target.value)
    if (!nextId || nextId === sucursalId) return

    const actual = sucursales.find((item) => item.id === sucursalId)
    const siguiente = sucursales.find((item) => item.id === nextId)
    const confirm = await Swal.fire({
      title: '¿Cambiar de local?',
      text: `Pasás de ${actual?.nombre || 'este local'} a ${siguiente?.nombre || 'otro'}. Si hay una venta en curso, se vacía el carrito.`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Cambiar',
      cancelButtonText: 'Quedarme',
    })

    if (!confirm.isConfirmed) {
      event.target.value = String(sucursalId || '')
      return
    }

    setSucursalId(nextId)
  }

  return (
    <header className="flex h-16 shrink-0 items-center justify-between gap-4 border-b border-gray-200 bg-gray-50 px-6">
      <label className="flex min-w-0 items-center gap-2 text-sm text-slate-600">
        <span className="hidden text-xs font-medium tracking-wide text-slate-400 uppercase sm:inline">
          Local
        </span>
        <select
          value={sucursalId || ''}
          onChange={cambiarSucursal}
          className="h-9 max-w-56 rounded-lg border border-slate-200 bg-white px-2 text-sm font-medium text-slate-800"
        >
          <option value="" disabled>
            Elegí el local
          </option>
          {sucursales.map((sucursal) => (
            <option key={sucursal.id} value={sucursal.id}>
              {nombreCortoSucursal(sucursal.nombre)}
            </option>
          ))}
        </select>
      </label>

      <div className="flex items-center gap-3 text-sm text-slate-700">
        <div className="flex items-center gap-2">
          <CircleUser className="h-5 w-5 text-slate-400" strokeWidth={1.75} />
          <div className="text-right">
            <p className="font-medium">{displayName(user)}</p>
            <p className="text-[11px] text-slate-400">{user?.role}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={logout}
          className="inline-flex h-9 items-center gap-1 rounded-lg border border-slate-200 px-3 text-xs font-medium text-slate-600 hover:bg-white"
        >
          <LogOut className="h-3.5 w-3.5" />
          Salir
        </button>
      </div>
    </header>
  )
}

export default Topbar
