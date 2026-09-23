import { NavLink } from 'react-router-dom'
import {
  ArrowLeft,
  Banknote,
  DoorOpen,
  IdCard,
  LayoutDashboard,
  MapPin,
  Users,
  UserCog,
  Wallet,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import logoInfinity from '../../assets/LogoInfinityAcademia.jpg'

const navItems = [
  { to: '/infinity-academia', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/infinity-academia/ingreso', label: 'Ingreso', icon: DoorOpen },
  { to: '/infinity-academia/socios', label: 'Socios', icon: Users },
  { to: '/infinity-academia/vencidas', label: 'Vencidas', icon: IdCard },
  { to: '/infinity-academia/caja', label: 'Caja', icon: Wallet },
]

function SidebarGym() {
  const { user } = useAuth()
  const items =
    user?.role === 'SUPERADMIN'
      ? [
          ...navItems,
          { to: '/infinity-academia/membresias', label: 'Membresías', icon: Banknote },
          { to: '/infinity-academia/sucursales', label: 'Sucursales', icon: MapPin },
          { to: '/infinity-academia/empleados', label: 'Empleados', icon: UserCog },
        ]
      : navItems

  return (
    <aside className="flex h-full w-64 shrink-0 flex-col border-r border-gray-100 bg-white shadow-sm">
      <div className="flex h-16 items-center gap-2 border-b border-gray-100 px-6">
        <img src={logoInfinity} alt="" className="h-8 w-8 rounded-lg object-cover" />
        <div>
          <p className="text-sm font-semibold text-slate-900">Infinity Academia</p>
          <p className="text-xs text-slate-400">Gestión del gimnasio</p>
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-1 p-4">
        {items.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              [
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-indigo-700 text-white'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
              ].join(' ')
            }
          >
            <Icon className="h-4 w-4 shrink-0" strokeWidth={2} />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-gray-100 p-4">
        <NavLink
          to="/"
          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900"
        >
          <ArrowLeft className="h-4 w-4 shrink-0" strokeWidth={2} />
          Volver a módulos
        </NavLink>
      </div>
    </aside>
  )
}

export default SidebarGym
