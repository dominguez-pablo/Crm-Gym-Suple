import { NavLink } from 'react-router-dom'
import {
  ArrowLeft,
  LayoutDashboard,
  MapPin,
  Package,
  ShoppingCart,
  Users,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import logoFit from '../../assets/LogoFItMarket.jpg'

const navItems = [
  { to: '/fit-market', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/fit-market/pos', label: 'Punto de Venta', icon: ShoppingCart },
  { to: '/fit-market/inventario', label: 'Inventario', icon: Package },
  { to: '/fit-market/clientes', label: 'Clientes', icon: Users },
]

function Sidebar() {
  const { user } = useAuth()
  const items =
    user?.role === 'SUPERADMIN'
      ? [...navItems, { to: '/fit-market/locales', label: 'Locales', icon: MapPin }]
      : navItems

  return (
    <aside className="flex h-full w-64 shrink-0 flex-col border-r border-gray-100 bg-white shadow-sm">
      <div className="flex h-16 items-center gap-2 border-b border-gray-100 px-6">
        <img src={logoFit} alt="" className="h-8 w-8 rounded-lg object-cover" />
        <div>
          <p className="text-sm font-semibold text-slate-900">Fit Market</p>
          <p className="text-xs text-slate-400">CRM Administrativo</p>
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
                  ? 'bg-slate-900 text-white'
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

export default Sidebar
