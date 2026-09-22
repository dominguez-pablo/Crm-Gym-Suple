import { useEffect, useState } from 'react'
import Swal from 'sweetalert2'
import { gymApi } from '../../api/gym'
import { useGymSucursalStore } from '../../store/gymSucursalStore'
import { formatPrecio } from '../../utils/modulos'
import { formatFecha } from '../../utils/gym'

function Caja() {
  const sucursalId = useGymSucursalStore((state) => state.sucursalId)
  const [caja, setCaja] = useState(null)
  const [historial, setHistorial] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [montoApertura, setMontoApertura] = useState('0')
  const [concepto, setConcepto] = useState('')
  const [montoMov, setMontoMov] = useState('')
  const [tipoMov, setTipoMov] = useState('INGRESO')
  const [montoCierre, setMontoCierre] = useState('')
  const [observaciones, setObservaciones] = useState('')

  const load = async () => {
    if (!sucursalId) return
    setError('')
    const [abierta, lista] = await Promise.all([
      gymApi.caja.abierta(sucursalId),
      gymApi.caja.list(sucursalId),
    ])
    setCaja(abierta)
    setHistorial(lista.filter((item) => item.estado === 'CERRADA'))
    if (abierta?.resumen) {
      setMontoCierre(String(abierta.resumen.efectivoEsperado))
    }
  }

  useEffect(() => {
    load()
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [sucursalId])

  const abrir = async (event) => {
    event.preventDefault()
    try {
      await gymApi.caja.abrir({ sucursalId, montoApertura: Number(montoApertura) })
      await load()
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'No se pudo abrir la caja', text: err.message })
    }
  }

  const mover = async (event) => {
    event.preventDefault()
    if (!caja) return
    try {
      await gymApi.caja.movimiento(caja.id, {
        tipo: tipoMov,
        monto: Number(montoMov),
        concepto,
        medio: 'EFECTIVO',
      })
      setConcepto('')
      setMontoMov('')
      await load()
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'No se pudo registrar', text: err.message })
    }
  }

  const cerrar = async (event) => {
    event.preventDefault()
    if (!caja) return
    const confirm = await Swal.fire({
      title: '¿Cerrar caja?',
      text: 'Se compara el efectivo declarado con el esperado por el sistema.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Cerrar',
      cancelButtonText: 'Cancelar',
    })
    if (!confirm.isConfirmed) return
    try {
      await gymApi.caja.cerrar(caja.id, {
        montoCierreDeclarado: Number(montoCierre),
        observaciones: observaciones || undefined,
      })
      setObservaciones('')
      await load()
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'No se pudo cerrar', text: err.message })
    }
  }

  if (!sucursalId) {
    return <p className="text-sm text-slate-500">Elegí la sede para operar la caja.</p>
  }

  if (loading) {
    return <p className="text-sm text-slate-500">Cargando caja...</p>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Caja</h1>
        <p className="text-sm text-slate-500">Apertura, ingresos, egresos y cierre del turno</p>
      </div>

      {error ? (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      ) : null}

      {!caja ? (
        <form
          onSubmit={abrir}
          className="max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
        >
          <h2 className="text-lg font-semibold text-slate-900">Abrir caja</h2>
          <p className="mt-1 text-sm text-slate-500">
            No hay una caja abierta en esta sede. Ingresá el efectivo inicial.
          </p>
          <label className="mt-4 block text-xs text-slate-500">
            Monto de apertura
            <input
              type="number"
              className="mt-1 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm"
              value={montoApertura}
              onChange={(event) => setMontoApertura(event.target.value)}
              required
            />
          </label>
          <button
            type="submit"
            className="mt-4 h-11 rounded-xl bg-indigo-700 px-4 text-sm font-semibold text-white hover:bg-indigo-600"
          >
            Abrir caja
          </button>
        </form>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-sm text-slate-500">Apertura</p>
              <p className="mt-1 text-xl font-semibold">{formatPrecio(caja.montoApertura)}</p>
            </article>
            <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-sm text-slate-500">Efectivo esperado</p>
              <p className="mt-1 text-xl font-semibold">
                {formatPrecio(caja.resumen?.efectivoEsperado)}
              </p>
            </article>
            <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-sm text-slate-500">Ingresos del turno</p>
              <p className="mt-1 text-xl font-semibold">
                {formatPrecio(caja.resumen?.totalIngresos)}
              </p>
            </article>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <form
              onSubmit={mover}
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
            >
              <h2 className="text-sm font-semibold text-slate-900">Ingreso o egreso</h2>
              <div className="mt-3 grid gap-3">
                <select
                  className="h-11 rounded-xl border border-slate-200 px-3 text-sm"
                  value={tipoMov}
                  onChange={(event) => setTipoMov(event.target.value)}
                >
                  <option value="INGRESO">Ingreso</option>
                  <option value="EGRESO">Egreso</option>
                </select>
                <input
                  className="h-11 rounded-xl border border-slate-200 px-3 text-sm"
                  placeholder="Concepto"
                  value={concepto}
                  onChange={(event) => setConcepto(event.target.value)}
                  required
                />
                <input
                  type="number"
                  className="h-11 rounded-xl border border-slate-200 px-3 text-sm"
                  placeholder="Monto"
                  value={montoMov}
                  onChange={(event) => setMontoMov(event.target.value)}
                  required
                />
                <button
                  type="submit"
                  className="h-11 rounded-xl bg-slate-900 text-sm font-semibold text-white"
                >
                  Registrar movimiento
                </button>
              </div>
            </form>

            <form
              onSubmit={cerrar}
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
            >
              <h2 className="text-sm font-semibold text-slate-900">Cerrar caja</h2>
              <label className="mt-3 block text-xs text-slate-500">
                Efectivo contado
                <input
                  type="number"
                  className="mt-1 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm"
                  value={montoCierre}
                  onChange={(event) => setMontoCierre(event.target.value)}
                  required
                />
              </label>
              <label className="mt-3 block text-xs text-slate-500">
                Observaciones
                <input
                  className="mt-1 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm"
                  value={observaciones}
                  onChange={(event) => setObservaciones(event.target.value)}
                />
              </label>
              <button
                type="submit"
                className="mt-4 h-11 rounded-xl bg-red-600 px-4 text-sm font-semibold text-white hover:bg-red-500"
              >
                Cerrar caja
              </button>
            </form>
          </div>

          <section className="overflow-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-4 py-3">
              <h2 className="text-sm font-semibold text-slate-900">Movimientos de la caja abierta</h2>
            </div>
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs font-semibold tracking-wide text-slate-500 uppercase">
                <tr>
                  <th className="px-4 py-3">Hora</th>
                  <th className="px-4 py-3">Tipo</th>
                  <th className="px-4 py-3">Concepto</th>
                  <th className="px-4 py-3">Medio</th>
                  <th className="px-4 py-3">Monto</th>
                </tr>
              </thead>
              <tbody>
                {(caja.movimientos || []).map((movimiento) => (
                  <tr key={movimiento.id} className="border-t border-slate-100">
                    <td className="px-4 py-3">{formatFecha(movimiento.createdAt, true)}</td>
                    <td className="px-4 py-3">{movimiento.tipo.replace('_', ' ')}</td>
                    <td className="px-4 py-3">{movimiento.concepto}</td>
                    <td className="px-4 py-3">{movimiento.medio || '—'}</td>
                    <td className="px-4 py-3 font-medium">{formatPrecio(movimiento.monto)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        </>
      )}

      {historial.length > 0 ? (
        <section className="overflow-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-4 py-3">
            <h2 className="text-sm font-semibold text-slate-900">Cierres recientes</h2>
          </div>
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs font-semibold tracking-wide text-slate-500 uppercase">
              <tr>
                <th className="px-4 py-3">Cierre</th>
                <th className="px-4 py-3">Sistema</th>
                <th className="px-4 py-3">Declarado</th>
                <th className="px-4 py-3">Diferencia</th>
              </tr>
            </thead>
            <tbody>
              {historial.map((item) => (
                <tr key={item.id} className="border-t border-slate-100">
                  <td className="px-4 py-3">{formatFecha(item.cerradaEn, true)}</td>
                  <td className="px-4 py-3">{formatPrecio(item.montoCierreSistema)}</td>
                  <td className="px-4 py-3">{formatPrecio(item.montoCierreDeclarado)}</td>
                  <td className="px-4 py-3">{formatPrecio(item.diferencia)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      ) : null}
    </div>
  )
}

export default Caja
