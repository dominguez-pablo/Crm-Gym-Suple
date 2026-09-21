import { useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import Topbar from './Topbar'
import { useSucursalStore } from '../../store/sucursalStore'

function Layout() {
  const load = useSucursalStore((state) => state.load)
  const loading = useSucursalStore((state) => state.loading)
  const sucursales = useSucursalStore((state) => state.sucursales)
  const sucursalId = useSucursalStore((state) => state.sucursalId)
  const setSucursalId = useSucursalStore((state) => state.setSucursalId)

  useEffect(() => {
    load().catch(() => {})
  }, [load])

  return (
    <div className="flex h-screen overflow-hidden bg-gray-100">
      <Sidebar />

      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar />

        <main className="flex min-h-0 flex-1 flex-col overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>

      {!loading && !sucursalId && sucursales.length > 0 ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="text-lg font-semibold text-slate-900">¿En qué local estás?</h2>
            <p className="mt-1 text-sm text-slate-500">
              El stock y las ventas se registran en el punto de venta que elijas.
            </p>
            <div className="mt-4 grid gap-2">
              {sucursales.map((sucursal) => (
                <button
                  key={sucursal.id}
                  type="button"
                  onClick={() => setSucursalId(sucursal.id)}
                  className="h-12 rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-800 hover:border-slate-900 hover:bg-slate-50"
                >
                  {sucursal.nombre}
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}

export default Layout
