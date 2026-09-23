import { useState } from 'react'
import { CircleUser, LogOut } from 'lucide-react'
import logoFit from '../assets/LogoFItMarket.jpg'
import logoInfinity from '../assets/LogoInfinityAcademia.jpg'
import BrandBackdrop from '../components/BrandBackdrop'
import { useAuth } from '../context/AuthContext'

function displayName(user) {
  if (user?.persona) {
    return `${user.persona.nombre} ${user.persona.apellido}`
  }
  return user?.email || 'Administrador'
}

function SelectorModulos() {
  const { user, logout } = useAuth()
  const [focus, setFocus] = useState(null)

  const focusHandlers = (brand) => ({
    onMouseEnter: () => setFocus(brand),
    onMouseLeave: () => setFocus((current) => (current === brand ? null : current)),
    onFocus: () => setFocus(brand),
    onBlur: () => setFocus((current) => (current === brand ? null : current)),
  })

  const openFitMarket = () => {
    window.open('/fit-market', 'fit-market')
  }

  const openAcademia = () => {
    window.open('/infinity-academia', 'infinity-academia')
  }

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden">
      <BrandBackdrop focus={focus} variant="color" />
      <header className="relative z-10 flex items-center justify-end px-6 py-4">
        <div className="flex items-center gap-3 text-sm text-white [text-shadow:0_1px_2px_rgba(0,0,0,0.95),0_0_12px_rgba(0,0,0,0.85)]">
          <div className="flex items-center gap-2">
            <CircleUser className="h-5 w-5 text-white/80" strokeWidth={1.75} />
            <div className="text-right">
              <p className="font-medium">{displayName(user)}</p>
              <p className="text-[11px] text-white/80">{user?.role}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={logout}
            className="inline-flex h-9 items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium text-slate-600 hover:bg-slate-50"
          >
            <LogOut className="h-3.5 w-3.5" />
            Salir
          </button>
        </div>
      </header>

      <main className="relative z-10 flex flex-1 flex-col items-center justify-center px-4 pb-16">
        <div className="rounded-2xl bg-black/45 px-6 py-3 text-center backdrop-blur-[2px]">
          <p className="text-xs font-semibold tracking-wide text-white uppercase">
            Gym Suple
          </p>
          <h1 className="mt-1 text-2xl font-semibold text-white">Elegí un módulo</h1>
          <p className="mt-1 text-sm text-white/90">
            Abrí Fit Market o Infinity Academia en una pestaña aparte
          </p>
        </div>

        <div className="mt-8 grid w-full max-w-3xl gap-4 sm:grid-cols-2">
          <button
            type="button"
            onClick={openFitMarket}
            {...focusHandlers('fit')}
            className="rounded-2xl border border-slate-200 bg-white p-8 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-500 hover:shadow-md"
          >
            <img
              src={logoFit}
              alt=""
              className="h-40 w-full rounded-xl object-contain"
            />
            <h2 className="mt-5 text-xl font-semibold text-slate-900">Fit Market</h2>
            <p className="mt-1 text-sm text-slate-500">
              CRM de ventas, inventario y clientes
            </p>
          </button>

          <button
            type="button"
            onClick={openAcademia}
            {...focusHandlers('infinity')}
            className="rounded-2xl border border-slate-200 bg-white p-8 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-600 hover:shadow-md"
          >
            <img
              src={logoInfinity}
              alt=""
              className="h-40 w-full rounded-xl object-contain"
            />
            <h2 className="mt-5 text-xl font-semibold text-slate-900">Infinity Academia</h2>
            <p className="mt-1 text-sm text-slate-500">
              Socios, membresías, caja e ingreso por DNI
            </p>
          </button>
        </div>
      </main>
    </div>
  )
}

export default SelectorModulos
