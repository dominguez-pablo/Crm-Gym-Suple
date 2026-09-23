import { useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import SidebarGym from './SidebarGym'
import TopbarGym from './TopbarGym'
import { useDocumentBrand } from '../../hooks/useDocumentBrand'
import { useGymSucursalStore } from '../../store/gymSucursalStore'
import { useAuth } from '../../context/AuthContext'
import logoInfinity from '../../assets/LogoInfinityAcademia.jpg'

function LayoutGym() {
  const { user } = useAuth()
  const load = useGymSucursalStore((state) => state.load)
  const loading = useGymSucursalStore((state) => state.loading)
  const sucursales = useGymSucursalStore((state) => state.sucursales)
  const sucursalId = useGymSucursalStore((state) => state.sucursalId)
  const setSucursalId = useGymSucursalStore((state) => state.setSucursalId)
  const esAdmin = user?.role === 'SUPERADMIN'

  useDocumentBrand({ title: 'Infinity Academia', icon: logoInfinity })
  const sedeAsignada = sucursales.find((item) => item.id === user?.sucursalId)

  useEffect(() => {
    load().catch(() => {})
  }, [load])

  useEffect(() => {
    if (loading || sucursalId || !sedeAsignada) return
    setSucursalId(sedeAsignada.id)
  }, [loading, sucursalId, sedeAsignada, setSucursalId])

  return (
    <div className="flex h-screen overflow-hidden bg-gray-100">
      <SidebarGym />

      <div className="flex min-w-0 flex-1 flex-col">
        <TopbarGym />

        <main className="flex min-h-0 flex-1 flex-col overflow-y-auto p-6">
          {!loading && sucursales.length === 0 && esAdmin ? (
            <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              No hay sedes de Infinity Academia. Creá una sucursal con el módulo gimnasio.
            </div>
          ) : null}
          <Outlet />
        </main>
      </div>

      {!loading && !sucursalId && sucursales.length > 0 && !sedeAsignada && (esAdmin || !user?.sucursalId) ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="text-lg font-semibold text-slate-900">¿En qué sede estás?</h2>
            <p className="mt-1 text-sm text-slate-500">
              Los ingresos, cobros y la caja se registran en la sucursal que elijas.
            </p>
            <div className="mt-4 grid gap-2">
              {sucursales.map((sucursal) => (
                <button
                  key={sucursal.id}
                  type="button"
                  onClick={() => setSucursalId(sucursal.id)}
                  className="h-12 rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-800 hover:border-indigo-700 hover:bg-indigo-50"
                >
                  {sucursal.nombre}
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      {!loading && sucursales.length === 0 && !esAdmin ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="text-lg font-semibold text-slate-900">No hay sedes activas</h2>
            <p className="mt-1 text-sm text-slate-500">
              Avisá a un administrador para crear o habilitar una sucursal de Infinity Academia.
            </p>
          </div>
        </div>
      ) : null}

      {!loading && !esAdmin && user?.sucursalId && !sedeAsignada && sucursales.length > 0 ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="text-lg font-semibold text-slate-900">Sede no habilitada</h2>
            <p className="mt-1 text-sm text-slate-500">
              Tu usuario está asignado a un local que no opera Infinity Academia. Pedile a un
              administrador que te asigne una sede del gimnasio.
            </p>
          </div>
        </div>
      ) : null}
    </div>
  )
}

export default LayoutGym
