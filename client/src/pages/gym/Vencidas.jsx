import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { AlertTriangle } from 'lucide-react'
import { gymApi } from '../../api/gym'
import { formatFecha } from '../../utils/gym'

function Vencidas() {
  const [socios, setSocios] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    gymApi.socios
      .list({ estado: 'vencidos' })
      .then(setSocios)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="mb-4">
        <h1 className="text-2xl font-semibold text-slate-900">Membresías vencidas</h1>
        <p className="text-sm text-slate-500">Socios activos sin cuota al día</p>
      </div>

      {error ? (
        <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      ) : null}

      <div className="min-h-0 flex-1 overflow-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
        {loading ? (
          <p className="p-6 text-sm text-slate-500">Cargando vencidos...</p>
        ) : socios.length === 0 ? (
          <div className="flex h-48 flex-col items-center justify-center text-slate-500">
            <AlertTriangle className="mb-2 h-8 w-8 text-slate-300" />
            No hay membresías vencidas
          </div>
        ) : (
          <table className="min-w-full text-left text-sm">
            <thead className="sticky top-0 bg-slate-50 text-xs font-semibold tracking-wide text-slate-500 uppercase">
              <tr>
                <th className="px-4 py-3">Socio</th>
                <th className="px-4 py-3">DNI</th>
                <th className="px-4 py-3">Plan</th>
                <th className="px-4 py-3">Venció</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {socios.map((socio) => (
                <tr key={socio.id} className="border-t border-slate-100">
                  <td className="px-4 py-3 font-medium text-slate-900">
                    {socio.persona.apellido}, {socio.persona.nombre}
                  </td>
                  <td className="px-4 py-3">{socio.persona.dni}</td>
                  <td className="px-4 py-3">{socio.plan?.nombre || '—'}</td>
                  <td className="px-4 py-3">{formatFecha(socio.fechaVencimiento)}</td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      to={`/infinity-academia/socios?cobrar=${socio.id}`}
                      className="inline-flex h-8 items-center rounded-lg bg-indigo-700 px-3 text-xs font-semibold text-white hover:bg-indigo-600"
                    >
                      Cobrar
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

export default Vencidas
