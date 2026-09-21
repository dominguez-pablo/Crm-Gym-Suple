import { CircleUser, GraduationCap, LogOut, Store } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

function displayName(user) {
  if (user?.persona) {
    return `${user.persona.nombre} ${user.persona.apellido}`
  }
  return user?.email || 'Administrador'
}

function SelectorModulos() {
  const { user, logout } = useAuth()

  const openFitMarket = () => {
    window.open('/fit-market', 'fit-market')
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-100">
      <header className="flex items-center justify-end px-6 py-4">
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
            className="inline-flex h-9 items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium text-slate-600 hover:bg-slate-50"
          >
            <LogOut className="h-3.5 w-3.5" />
            Salir
          </button>
        </div>
      </header>

      <main className="flex flex-1 flex-col items-center justify-center px-4 pb-16">
        <p className="text-xs font-semibold tracking-wide text-emerald-700 uppercase">
          Gym Suple
        </p>
        <h1 className="mt-1 text-2xl font-semibold text-slate-900">Elegí un módulo</h1>
        <p className="mt-1 text-sm text-slate-500">
          Abrí Fit Market o Infinity Academia en una pestaña aparte
        </p>

        <div className="mt-8 grid w-full max-w-3xl gap-4 sm:grid-cols-2">
          <button
            type="button"
            onClick={openFitMarket}
            className="rounded-2xl border border-slate-200 bg-white p-8 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-500 hover:shadow-md"
          >
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-900 text-white">
              <Store className="h-6 w-6" strokeWidth={1.75} />
            </span>
            <h2 className="mt-5 text-xl font-semibold text-slate-900">Fit Market</h2>
            <p className="mt-1 text-sm text-slate-500">
              CRM de ventas, inventario y clientes
            </p>
          </button>

          <div
            aria-disabled="true"
            className="cursor-not-allowed rounded-2xl border border-slate-200 bg-white p-8 opacity-60 shadow-sm"
          >
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-200 text-slate-500">
              <GraduationCap className="h-6 w-6" strokeWidth={1.75} />
            </span>
            <h2 className="mt-5 text-xl font-semibold text-slate-900">Infinity Academia</h2>
            <p className="mt-1 text-sm text-slate-500">Próximamente</p>
          </div>
        </div>
      </main>
    </div>
  )
}

export default SelectorModulos
