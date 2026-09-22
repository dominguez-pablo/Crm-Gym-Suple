import { CircleUser, LogOut } from 'lucide-react'
import Swal from 'sweetalert2'
import { useAuth } from '../../context/AuthContext'
import { useGymSucursalStore } from '../../store/gymSucursalStore'
import { nombreCortoSucursal } from '../../utils/stock'

function displayName(user) {
  if (user?.persona) {
    return `${user.persona.nombre} ${user.persona.apellido}`
  }
  return user?.email || 'Administrador'
}

function TopbarGym() {
  const { user, logout } = useAuth()
  const sucursales = useGymSucursalStore((state) => state.sucursales)
  const sucursalId = useGymSucursalStore((state) => state.sucursalId)
  const setSucursalId = useGymSucursalStore((state) => state.setSucursalId)
  const locked = user?.role !== 'SUPERADMIN' && Boolean(user?.sucursalId)

  const cambiarSucursal = async (event) => {
    const nextId = Number(event.target.value)
    if (!nextId || nextId === sucursalId) return

    const actual = sucursales.find((item) => item.id === sucursalId)
    const siguiente = sucursales.find((item) => item.id === nextId)
    const confirm = await Swal.fire({
      title: '¿Cambiar de sede?',
      text: `Pasás de ${actual?.nombre || 'esta sede'} a ${siguiente?.nombre || 'otra'}.`,
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
          Sede
        </span>
        <select
          value={sucursalId || ''}
          onChange={cambiarSucursal}
          disabled={locked}
          className="h-9 max-w-56 rounded-lg border border-slate-200 bg-white px-2 text-sm font-medium text-slate-800 disabled:bg-slate-100"
        >
          <option value="" disabled>
            Elegí la sede
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

export default TopbarGym
