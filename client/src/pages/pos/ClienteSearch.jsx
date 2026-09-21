import { useEffect, useMemo, useRef, useState } from 'react'
import { Search, X } from 'lucide-react'
import { etiquetaTipo, nombreCliente } from '../../utils/venta'

const coincideCliente = (item, termino) => {
  const texto = termino.trim().toLowerCase()
  if (!texto) return true
  const nombre = nombreCliente(item).toLowerCase()
  const dni = String(item.persona.dni || '').toLowerCase()
  return (
    item.persona.nombre.toLowerCase().includes(texto) ||
    item.persona.apellido.toLowerCase().includes(texto) ||
    nombre.includes(texto) ||
    dni.includes(texto)
  )
}

function ClienteSearch({ clientes, cliente, clienteId, onSelect }) {
  const contenedorRef = useRef(null)
  const [busquedaCliente, setBusquedaCliente] = useState('')
  const [menuAbierto, setMenuAbierto] = useState(false)

  const clientesFiltrados = useMemo(
    () => clientes.filter((item) => coincideCliente(item, busquedaCliente)),
    [clientes, busquedaCliente],
  )

  const valorInput =
    cliente && !menuAbierto ? `${nombreCliente(cliente)} · ${cliente.persona.dni}` : busquedaCliente

  useEffect(() => {
    const cerrar = (event) => {
      if (!contenedorRef.current?.contains(event.target)) {
        setMenuAbierto(false)
        setBusquedaCliente('')
      }
    }
    document.addEventListener('mousedown', cerrar)
    return () => document.removeEventListener('mousedown', cerrar)
  }, [])

  const elegirCliente = (id) => {
    onSelect(id)
    setBusquedaCliente('')
    setMenuAbierto(false)
  }

  return (
    <div ref={contenedorRef} className="relative min-w-0 flex-1">
      <div className="relative">
        <Search className="pointer-events-none absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2 text-slate-400" />
        <input
          type="search"
          value={valorInput}
          onChange={(event) => {
            setBusquedaCliente(event.target.value)
            setMenuAbierto(true)
            if (clienteId) onSelect('')
          }}
          onFocus={() => {
            setMenuAbierto(true)
            if (cliente) setBusquedaCliente('')
          }}
          onKeyDown={(event) => {
            if (event.key === 'Escape') {
              setMenuAbierto(false)
              setBusquedaCliente('')
            }
          }}
          placeholder="Buscar cliente por nombre o DNI..."
          className="h-12 w-full rounded-xl border border-slate-200 bg-white pr-12 pl-12 text-sm text-slate-900 shadow-sm outline-none placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
          aria-label="Buscar cliente por nombre o DNI"
          autoComplete="off"
        />
        {clienteId ? (
          <button
            type="button"
            onClick={() => {
              onSelect('')
              setBusquedaCliente('')
              setMenuAbierto(true)
            }}
            className="absolute top-1/2 right-3 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            aria-label="Quitar cliente"
          >
            <X className="h-4 w-4" />
          </button>
        ) : null}
      </div>

      {menuAbierto ? (
        <ul className="absolute z-20 mt-1 max-h-64 w-full overflow-y-auto rounded-xl border border-slate-200 bg-white py-1 shadow-lg">
          <li>
            <button
              type="button"
              onClick={() => elegirCliente('')}
              className={[
                'flex w-full items-start px-4 py-2.5 text-left text-sm hover:bg-slate-50',
                !clienteId ? 'bg-emerald-50 font-medium text-emerald-800' : 'text-slate-800',
              ].join(' ')}
            >
              Consumidor final
            </button>
          </li>
          {clientesFiltrados.length === 0 ? (
            <li className="px-4 py-3 text-sm text-slate-500">
              No hay clientes que coincidan con “{busquedaCliente}”
            </li>
          ) : (
            clientesFiltrados.map((item) => {
              const seleccionado = String(item.id) === String(clienteId)
              return (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => elegirCliente(String(item.id))}
                    className={[
                      'flex w-full flex-col items-start px-4 py-2.5 text-left hover:bg-slate-50',
                      seleccionado ? 'bg-emerald-50' : '',
                    ].join(' ')}
                  >
                    <span className="text-sm font-medium text-slate-900">
                      {nombreCliente(item)}
                    </span>
                    <span className="text-xs text-slate-500">
                      DNI {item.persona.dni} · {etiquetaTipo(item.tipo)}
                    </span>
                  </button>
                </li>
              )
            })
          )}
        </ul>
      ) : null}
    </div>
  )
}

export default ClienteSearch
