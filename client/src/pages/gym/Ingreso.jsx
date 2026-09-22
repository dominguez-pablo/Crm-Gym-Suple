import { useEffect, useRef, useState } from 'react'
import { gymApi } from '../../api/gym'
import { useGymSucursalStore } from '../../store/gymSucursalStore'
import { formatFecha, estadoSocio } from '../../utils/gym'

function detalleIngreso(resultado) {
  if (resultado.motivo) return resultado.motivo
  const plan = resultado.socio?.plan
  const nombre = plan?.nombre || 'Sin plan'
  const vence = `vence ${formatFecha(resultado.socio?.fechaVencimiento)}`
  if (plan?.multisede) return `${nombre} · ${vence}`
  const sede = plan?.sucursal?.nombre || resultado.socio?.sucursal?.nombre
  return sede ? `${nombre} · ${sede} · ${vence}` : `${nombre} · ${vence}`
}

function Ingreso() {
  const sucursalId = useGymSucursalStore((state) => state.sucursalId)
  const inputRef = useRef(null)
  const [dni, setDni] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [resultado, setResultado] = useState(null)
  const [historial, setHistorial] = useState([])

  const loadHistorial = async () => {
    if (!sucursalId) return
    setHistorial(await gymApi.accesos.list({ sucursalId }))
  }

  useEffect(() => {
    loadHistorial().catch(() => {})
  }, [sucursalId])

  useEffect(() => {
    inputRef.current?.focus()
  }, [resultado])

  const consultar = async (event) => {
    event.preventDefault()
    if (!sucursalId) return
    setLoading(true)
    setError('')
    try {
      const acceso = await gymApi.accesos.create({ dni: dni.trim(), sucursalId })
      setResultado(acceso)
      setDni('')
      await loadHistorial()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const permitido = resultado?.resultado === 'PERMITIDO'
  const persona = resultado?.socio?.persona
  const estado = resultado?.socio ? estadoSocio(resultado.socio) : null

  return (
    <div className="flex h-full min-h-0 flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Ingreso al gimnasio</h1>
        <p className="text-sm text-slate-500">Ingresá el DNI del socio para registrar el acceso</p>
      </div>

      {!sucursalId ? (
        <p className="text-sm text-slate-500">Elegí la sede para tomar ingresos.</p>
      ) : (
        <>
          <form
            onSubmit={consultar}
            className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
          >
            <label className="block text-xs font-medium tracking-wide text-slate-400 uppercase">
              Número de DNI
              <input
                ref={inputRef}
                value={dni}
                onChange={(event) => setDni(event.target.value.replace(/\D/g, ''))}
                className="mt-2 h-16 w-full rounded-2xl border border-slate-200 px-4 text-center text-3xl font-semibold tracking-widest text-slate-900"
                placeholder="00000000"
                minLength={7}
                required
              />
            </label>
            <button
              type="submit"
              disabled={loading}
              className="mt-4 h-12 w-full rounded-xl bg-indigo-700 text-sm font-semibold text-white hover:bg-indigo-600 disabled:opacity-60"
            >
              {loading ? 'Consultando...' : 'Registrar ingreso'}
            </button>
            {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
          </form>

          {resultado ? (
            <div
              className={
                permitido
                  ? 'rounded-2xl border border-emerald-200 bg-emerald-50 p-6'
                  : 'rounded-2xl border border-red-200 bg-red-50 p-6'
              }
            >
              <p
                className={
                  permitido
                    ? 'text-sm font-semibold tracking-wide text-emerald-800 uppercase'
                    : 'text-sm font-semibold tracking-wide text-red-800 uppercase'
                }
              >
                {permitido ? 'Acceso permitido' : 'Acceso denegado'}
              </p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">
                {persona ? `${persona.nombre} ${persona.apellido}` : `DNI ${resultado.dni}`}
              </p>
              <p className="mt-1 text-sm text-slate-600">
                {detalleIngreso(resultado)}
              </p>
              {estado ? (
                <span className={`mt-3 inline-flex rounded-full px-2 py-1 text-xs font-medium ${estado.className}`}>
                  {estado.label}
                </span>
              ) : null}
            </div>
          ) : null}

          <section className="min-h-0 flex-1 overflow-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-4 py-3">
              <h2 className="text-sm font-semibold text-slate-900">Registro de ingresos</h2>
            </div>
            {historial.length === 0 ? (
              <p className="p-6 text-sm text-slate-500">Todavía no hay ingresos en esta sede.</p>
            ) : (
              <table className="min-w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs font-semibold tracking-wide text-slate-500 uppercase">
                  <tr>
                    <th className="px-4 py-3">Hora</th>
                    <th className="px-4 py-3">DNI</th>
                    <th className="px-4 py-3">Socio</th>
                    <th className="px-4 py-3">Resultado</th>
                  </tr>
                </thead>
                <tbody>
                  {historial.map((acceso) => (
                    <tr key={acceso.id} className="border-t border-slate-100">
                      <td className="px-4 py-3">{formatFecha(acceso.createdAt, true)}</td>
                      <td className="px-4 py-3">{acceso.dni}</td>
                      <td className="px-4 py-3">
                        {acceso.socio?.persona
                          ? `${acceso.socio.persona.nombre} ${acceso.socio.persona.apellido}`
                          : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={
                            acceso.resultado === 'PERMITIDO'
                              ? 'text-emerald-700'
                              : 'text-red-600'
                          }
                        >
                          {acceso.resultado === 'PERMITIDO'
                            ? 'Permitido'
                            : acceso.motivo || 'Denegado'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>
        </>
      )}
    </div>
  )
}

export default Ingreso
