import { useState } from 'react'
import HistorialVentas from './pos/HistorialVentas'
import NuevaVenta from './pos/NuevaVenta'

function PuntoDeVenta() {
  const [tab, setTab] = useState('nueva')

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col">
      <div className="mb-4 flex shrink-0 gap-2">
        <button
          type="button"
          onClick={() => setTab('nueva')}
          className={[
            'h-10 rounded-xl px-4 text-sm font-semibold',
            tab === 'nueva'
              ? 'bg-slate-900 text-white'
              : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50',
          ].join(' ')}
        >
          Nueva venta
        </button>
        <button
          type="button"
          onClick={() => setTab('historial')}
          className={[
            'h-10 rounded-xl px-4 text-sm font-semibold',
            tab === 'historial'
              ? 'bg-slate-900 text-white'
              : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50',
          ].join(' ')}
        >
          Ventas realizadas
        </button>
      </div>

      {tab === 'nueva' ? <NuevaVenta /> : <HistorialVentas />}
    </div>
  )
}

export default PuntoDeVenta
