import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Swal from 'sweetalert2'
import {
  Banknote,
  FileDown,
  Minus,
  Package,
  Plus,
  Receipt,
  Search,
  ShoppingCart,
  Trash2,
  User,
  X,
} from 'lucide-react'
import { productosApi } from '../../api/productos'
import { clientesApi } from '../../api/clientes'
import { ventasApi } from '../../api/ventas'
import { descargarPresupuesto } from '../../utils/presupuestoPdf'
import {
  fechaInputHoy,
  formatPrecio,
  interesDe,
  MEDIOS_PAGO,
  nombreCliente,
  nuevoPago,
  precioCatalogo,
  roundMoney,
  totalConInteres,
  etiquetaTipo,
} from '../../utils/venta'
import ClienteSearch from './ClienteSearch'
import NuevoClienteModal from './NuevoClienteModal'
import { useStockEvents } from '../../hooks/useStockEvents'
import { useSucursalStore } from '../../store/sucursalStore'
import {
  applyStockEvent,
  nombreCortoSucursal,
  otrasSucursalesConStock,
} from '../../utils/stock'

function NuevaVenta() {
  const sucursalId = useSucursalStore((state) => state.sucursalId)
  const sucursales = useSucursalStore((state) => state.sucursales)
  const sucursal = sucursales.find((item) => item.id === sucursalId) || null
  const [productos, setProductos] = useState([])
  const [clientes, setClientes] = useState([])
  const [busqueda, setBusqueda] = useState('')
  const [carrito, setCarrito] = useState([])
  const [mensaje, setMensaje] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [cobrando, setCobrando] = useState(false)
  const [clienteId, setClienteId] = useState('')
  const [fecha, setFecha] = useState(fechaInputHoy)
  const [estado, setEstado] = useState('RETIRADO')
  const [pagos, setPagos] = useState([nuevoPago()])
  const [nuevoCliente, setNuevoCliente] = useState(false)

  const cliente = useMemo(
    () => clientes.find((item) => String(item.id) === String(clienteId)) || null,
    [clientes, clienteId],
  )

  const load = async () => {
    const [listaProductos, listaClientes] = await Promise.all([
      productosApi.list(sucursalId),
      clientesApi.list(),
    ])
    setProductos(listaProductos)
    setClientes(listaClientes)
  }

  const sucursalAnterior = useRef(sucursalId)

  useEffect(() => {
    if (!sucursalId) {
      setLoading(false)
      return
    }
    if (sucursalAnterior.current !== sucursalId) {
      setCarrito([])
      sucursalAnterior.current = sucursalId
    }
    setLoading(true)
    load()
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [sucursalId])

  const onStockEvent = useCallback(
    (event) => {
      setProductos((lista) => lista.map((producto) => applyStockEvent(producto, event, sucursalId)))
      setCarrito((items) =>
        items.map((item) => {
          const actualizado = applyStockEvent(item, event, sucursalId)
          if (actualizado === item) return item
          return actualizado
        }),
      )
    },
    [sucursalId],
  )

  useStockEvents(onStockEvent)

  const productosFiltrados = useMemo(() => {
    const termino = busqueda.trim().toLowerCase()
    if (!termino) return productos
    return productos.filter(
      (producto) =>
        producto.nombre.toLowerCase().includes(termino) ||
        (producto.marca || '').toLowerCase().includes(termino),
    )
  }, [busqueda, productos])

  const subtotal = useMemo(
    () =>
      roundMoney(
        carrito.reduce(
          (acc, item) => acc + Number(item.precioUnitario) * item.cantidad,
          0,
        ),
      ),
    [carrito],
  )

  const total = useMemo(() => totalConInteres(subtotal, pagos), [subtotal, pagos])
  const interes = useMemo(() => interesDe(subtotal, pagos), [subtotal, pagos])
  const sumaPagos = useMemo(
    () => roundMoney(pagos.reduce((acc, pago) => acc + (Number(pago.monto) || 0), 0)),
    [pagos],
  )
  const restante = roundMoney(total - sumaPagos)
  const hayConsignacion = pagos.some((pago) => pago.medio === 'CONSIGNACION')
  const cantidadTotal = useMemo(
    () => carrito.reduce((acc, item) => acc + item.cantidad, 0),
    [carrito],
  )

  const agregarProducto = (producto) => {
    setMensaje('')
    setError('')
    setCarrito((items) => {
      const existente = items.find((item) => item.id === producto.id)
      if (!existente) {
        return [
          ...items,
          {
            ...producto,
            cantidad: 1,
            precioUnitario: precioCatalogo(producto, cliente?.tipo),
          },
        ]
      }
      if (existente.cantidad >= (producto.stockLocal ?? 0)) return items
      return items.map((item) =>
        item.id === producto.id
          ? { ...item, cantidad: item.cantidad + 1 }
          : item,
      )
    })
  }

  const cambiarCantidad = (id, delta) => {
    setMensaje('')
    setCarrito((items) =>
      items.flatMap((item) => {
        if (item.id !== id) return [item]
        const siguiente = item.cantidad + delta
        if (siguiente <= 0) return []
        if (siguiente > (item.stockLocal ?? 0)) return [item]
        return [{ ...item, cantidad: siguiente }]
      }),
    )
  }

  const cambiarPrecio = (id, valor) => {
    setCarrito((items) =>
      items.map((item) =>
        item.id === id
          ? { ...item, precioUnitario: valor === '' ? '' : Number(valor) }
          : item,
      ),
    )
  }

  const actualizarPago = (key, campo, valor) => {
    setPagos((items) =>
      items.map((pago) => {
        if (pago.key !== key) return pago
        const siguiente = { ...pago, [campo]: valor }
        if (campo === 'medio' && valor !== 'CREDITO') siguiente.cuotas = 1
        if (campo === 'medio' && valor !== 'OTRO') siguiente.nota = ''
        return siguiente
      }),
    )
  }

  const agregarPago = () => {
    setPagos((items) => [...items, nuevoPago({ monto: restante > 0 ? restante : '' })])
  }

  const quitarPago = (key) => {
    setPagos((items) => (items.length === 1 ? items : items.filter((pago) => pago.key !== key)))
  }

  const cargarRestanteConsignacion = () => {
    if (restante <= 0) return
    setPagos((items) => {
      const existente = items.find((pago) => pago.medio === 'CONSIGNACION')
      if (existente) {
        return items.map((pago) =>
          pago.key === existente.key
            ? { ...pago, monto: roundMoney((Number(pago.monto) || 0) + restante) }
            : pago,
        )
      }
      return [...items, nuevoPago({ medio: 'CONSIGNACION', monto: restante })]
    })
  }

  const cancelarVenta = () => {
    setCarrito([])
    setPagos([nuevoPago()])
    setMensaje('')
    setError('')
    setEstado('RETIRADO')
  }

  const pagosPayload = () =>
    pagos
      .filter((pago) => Number(pago.monto) > 0)
      .map((pago) => ({
        medio: pago.medio,
        monto: Number(pago.monto),
        cuotas: pago.medio === 'CREDITO' ? Number(pago.cuotas) : null,
        nota: pago.nota || null,
      }))

  const validarCobro = () => {
    if (!sucursalId) return 'Elegí el local en la barra superior'
    if (carrito.length === 0) return 'Agregá productos al ticket'
    const sinStock = carrito.find((item) => item.cantidad > (item.stockLocal ?? 0))
    if (sinStock) {
      return `Stock insuficiente en este local para "${sinStock.nombre}". Disponible: ${sinStock.stockLocal ?? 0}`
    }
    if (carrito.some((item) => !Number(item.precioUnitario) || Number(item.precioUnitario) <= 0)) {
      return 'Todos los productos necesitan un precio mayor a 0'
    }
    const payload = pagosPayload()
    if (payload.length === 0) return 'Cargá al menos un pago'
    if (payload.filter((pago) => pago.medio === 'CREDITO').length > 1) {
      return 'Solo un pago con crédito por venta'
    }
    if (payload.some((pago) => pago.medio === 'OTRO' && !pago.nota)) {
      return 'Indicá el detalle del medio "Otro"'
    }
    if (Math.abs(roundMoney(payload.reduce((acc, pago) => acc + pago.monto, 0)) - total) > 0.5) {
      return 'La suma de los pagos debe coincidir con el total'
    }
    if (payload.some((pago) => pago.medio === 'CONSIGNACION') && !clienteId) {
      return 'La consignación requiere un cliente'
    }
    return ''
  }

  const cobrarVenta = async () => {
    if (cobrando) return
    const invalid = validarCobro()
    if (invalid) {
      setError(invalid)
      return
    }

    const confirm = await Swal.fire({
      title: '¿Confirmar esta venta?',
      text: formatPrecio(total),
      icon: 'question',
      input: 'select',
      inputLabel: 'Estado de la venta',
      inputOptions: {
        RETIRADO: 'Retirado',
        SEPARADO: 'Reservado',
      },
      inputValue: estado,
      showCancelButton: true,
      confirmButtonText: 'Confirmar',
      cancelButtonText: 'Volver',
    })
    if (!confirm.isConfirmed) return

    const estadoVenta = confirm.value === 'SEPARADO' ? 'SEPARADO' : 'RETIRADO'
    setEstado(estadoVenta)

    setCobrando(true)
    setError('')
    try {
      await ventasApi.create({
        sucursalId,
        clienteId: clienteId ? Number(clienteId) : null,
        fecha:
          fecha === fechaInputHoy()
            ? new Date().toISOString()
            : `${fecha}T12:00:00`,
        estado: estadoVenta,
        items: carrito.map((item) => ({
          productoId: item.id,
          cantidad: item.cantidad,
          precioUnitario: Number(item.precioUnitario),
        })),
        pagos: pagosPayload(),
      })
      setCarrito([])
      setPagos([nuevoPago()])
      setEstado('RETIRADO')
      setMensaje('Venta registrada correctamente')
      await load()
    } catch (err) {
      setError(err.message)
    } finally {
      setCobrando(false)
    }
  }

  const generarPresupuesto = () => {
    if (carrito.length === 0) {
      setError('Agregá productos para armar el presupuesto')
      return
    }
    setError('')
    descargarPresupuesto({
      cliente,
      fecha,
      items: carrito,
      subtotal,
      interes,
      total,
      pagos: pagosPayload(),
    })
  }

  if (!sucursalId) {
    return <p className="text-sm text-slate-500">Elegí el local para empezar a vender.</p>
  }

  if (loading) {
    return <p className="text-sm text-slate-500">Cargando punto de venta...</p>
  }

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col gap-4 lg:flex-row">
      {nuevoCliente ? (
        <NuevoClienteModal
          onClose={() => setNuevoCliente(false)}
          onCreated={(creado) => {
            setClientes((lista) => [creado, ...lista])
            setClienteId(String(creado.id))
            setNuevoCliente(false)
          }}
        />
      ) : null}

      <section className="flex min-h-0 min-w-0 flex-col lg:w-[58%]">
        <div className="mb-4 flex shrink-0 flex-col gap-3 sm:flex-row sm:items-end">
          <div className="min-w-0 flex-1">
            <p className="mb-2 text-sm font-medium text-slate-700">Cliente de la venta</p>
            <div className="flex gap-2">
              <ClienteSearch
                clientes={clientes}
                cliente={cliente}
                clienteId={clienteId}
                onSelect={setClienteId}
              />
              <button
                type="button"
                onClick={() => setNuevoCliente(true)}
                className="inline-flex h-12 shrink-0 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Nuevo
              </button>
            </div>
          </div>
          <label className="shrink-0 text-sm font-medium text-slate-700">
            Fecha
            <input
              type="date"
              value={fecha}
              onChange={(event) => setFecha(event.target.value)}
              className="mt-2 block h-12 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 shadow-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
            />
          </label>
        </div>

        <div className="mb-4 shrink-0">
          <h1 className="text-xl font-semibold text-slate-900">Catálogo</h1>
          <p className="text-sm text-slate-500">
            Buscá el suplemento e incorporalo al ticket
          </p>
        </div>

        <div className="relative mb-4 shrink-0">
          <Search className="pointer-events-none absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={busqueda}
            onChange={(event) => setBusqueda(event.target.value)}
            placeholder="Buscar por nombre o marca..."
            className="h-14 w-full rounded-xl border border-slate-200 bg-white pr-4 pl-12 text-base text-slate-900 shadow-sm outline-none placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
          />
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto pr-1">
          {productosFiltrados.length === 0 ? (
            <div className="flex h-48 items-center justify-center rounded-xl border border-dashed border-slate-200 bg-white text-sm text-slate-500">
              {productos.length === 0
                ? 'No hay productos en inventario'
                : `No hay productos que coincidan con “${busqueda}”`}
            </div>
          ) : (
            <ul className="divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-200 bg-white">
              {productosFiltrados.map((producto) => {
                const enCarrito =
                  carrito.find((item) => item.id === producto.id)?.cantidad ?? 0
                const stockLocal = producto.stockLocal ?? 0
                const stockMinimoLocal = producto.stockMinimoLocal ?? 5
                const sinStock = stockLocal <= 0 || enCarrito >= stockLocal
                const stockBajo = stockLocal > 0 && stockLocal <= stockMinimoLocal
                const otros = otrasSucursalesConStock(producto, sucursalId)
                const precio = precioCatalogo(producto, cliente?.tipo)

                return (
                  <li
                    key={producto.id}
                    className="flex items-center gap-3 px-4 py-3"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] font-semibold tracking-wide text-emerald-700 uppercase">
                        {producto.marca || 'Sin marca'}
                      </p>
                      <h2 className="truncate text-sm font-semibold text-slate-900">
                        {producto.nombre}
                      </h2>
                      <span
                        className={[
                          'mt-1 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium',
                          stockLocal <= 0
                            ? 'bg-red-50 text-red-700'
                            : stockBajo
                              ? 'bg-amber-50 text-amber-700'
                              : 'bg-slate-100 text-slate-600',
                        ].join(' ')}
                      >
                        <Package className="h-3.5 w-3.5" />
                        {stockLocal <= 0 ? 'Sin stock acá' : `${stockLocal} en este local`}
                      </span>
                      {stockLocal <= 0 && otros.length > 0 ? (
                        <p className="mt-1 text-xs text-emerald-700">
                          {otros
                            .map(
                              (stock) =>
                                `${stock.cantidad} en ${nombreCortoSucursal(stock.nombre)}`,
                            )
                            .join(' · ')}
                        </p>
                      ) : null}
                    </div>
                    <p className="shrink-0 text-sm font-bold text-slate-900">
                      {formatPrecio(precio)}
                    </p>
                    <button
                      type="button"
                      onClick={() => agregarProducto(producto)}
                      disabled={sinStock}
                      className="inline-flex h-9 shrink-0 items-center justify-center gap-1 rounded-lg bg-emerald-600 px-3 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:bg-slate-300"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Agregar
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </section>

      <aside className="flex min-h-0 w-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-md lg:w-[42%]">
        <header className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-900 text-white">
              <Receipt className="h-4 w-4" />
            </span>
            <div>
              <p className="text-sm font-semibold text-slate-900">Carrito / Ticket</p>
              <p className="text-xs text-slate-400">
                {sucursal ? sucursal.nombre : 'Caja registradora'}
              </p>
            </div>
          </div>
          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
            {cantidadTotal} {cantidadTotal === 1 ? 'ítem' : 'ítems'}
          </span>
        </header>

        <div className="border-b border-slate-100 px-4 py-3">
          <div className="flex items-center gap-2 rounded-lg border border-slate-100 bg-slate-50 px-3 py-2">
            <User className="h-4 w-4 shrink-0 text-slate-400" />
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-slate-800">
                {cliente ? nombreCliente(cliente) : 'Consumidor final'}
              </p>
              <p className="truncate text-xs text-slate-500">
                {cliente
                  ? `DNI ${cliente.persona.dni} · ${etiquetaTipo(cliente.tipo)}`
                  : 'Sin cliente asociado'}
              </p>
            </div>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
          {mensaje ? (
            <p className="mb-3 rounded-lg bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700">
              {mensaje}
            </p>
          ) : null}
          {error ? (
            <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
              {error}
            </p>
          ) : null}

          {carrito.length === 0 ? (
            <div className="flex min-h-32 flex-col items-center justify-center text-center">
              <ShoppingCart className="mb-2 h-8 w-8 text-slate-300" />
              <p className="text-sm font-medium text-slate-500">Ticket vacío</p>
              <p className="mt-1 text-xs text-slate-400">
                Agregá productos del catálogo para armar la venta
              </p>
            </div>
          ) : (
            <ul className="space-y-3">
              {carrito.map((item) => {
                const precio = Number(item.precioUnitario) || 0
                return (
                  <li
                    key={item.id}
                    className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-900">
                          {item.nombre}
                        </p>
                        <p className="text-xs text-slate-500">{item.marca}</p>
                        {item.cantidad > (item.stockLocal ?? 0) ? (
                          <p className="mt-1 text-xs font-medium text-red-600">
                            Quedan {item.stockLocal ?? 0} en este local
                          </p>
                        ) : null}
                      </div>
                      <p className="shrink-0 text-sm font-semibold text-slate-900">
                        {formatPrecio(precio * item.cantidad)}
                      </p>
                    </div>

                    <div className="mt-3 flex items-center justify-between gap-2">
                      <label className="flex min-w-0 items-center gap-1 text-xs text-slate-500">
                        $
                        <input
                          type="number"
                          min="0"
                          value={item.precioUnitario}
                          onChange={(event) => cambiarPrecio(item.id, event.target.value)}
                          className="h-7 w-24 rounded-md border border-slate-200 bg-white px-2 text-sm text-slate-900"
                          aria-label={`Precio unitario de ${item.nombre}`}
                        />
                      </label>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => cambiarCantidad(item.id, -1)}
                          className="flex h-7 w-7 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-600 hover:bg-slate-100"
                          aria-label={`Quitar una unidad de ${item.nombre}`}
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                        <span className="w-6 text-center text-sm font-semibold text-slate-900">
                          {item.cantidad}
                        </span>
                        <button
                          type="button"
                          onClick={() => cambiarCantidad(item.id, 1)}
                          disabled={item.cantidad >= (item.stockLocal ?? 0)}
                          className="flex h-7 w-7 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
                          aria-label={`Agregar una unidad de ${item.nombre}`}
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}

          <div className="mt-4 space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-slate-800">Pagos</p>
              <button
                type="button"
                onClick={agregarPago}
                className="text-xs font-medium text-emerald-700 hover:underline"
              >
                Agregar medio
              </button>
            </div>
            {pagos.map((pago) => (
              <div key={pago.key} className="rounded-xl border border-slate-100 p-2">
                <div className="flex gap-2">
                  <select
                    value={pago.medio}
                    onChange={(event) => actualizarPago(pago.key, 'medio', event.target.value)}
                    className="h-9 min-w-0 flex-1 rounded-lg border border-slate-200 bg-white px-2 text-xs text-slate-800"
                  >
                    {MEDIOS_PAGO.map((medio) => (
                      <option key={medio.value} value={medio.value}>
                        {medio.label}
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    min="0"
                    value={pago.monto}
                    onChange={(event) => actualizarPago(pago.key, 'monto', event.target.value)}
                    placeholder="Monto"
                    className="h-9 w-24 rounded-lg border border-slate-200 px-2 text-sm"
                  />
                  {pagos.length > 1 ? (
                    <button
                      type="button"
                      onClick={() => quitarPago(pago.key)}
                      className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-red-600"
                      aria-label="Quitar pago"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  ) : null}
                </div>
                {pago.medio === 'CREDITO' ? (
                  <select
                    value={pago.cuotas}
                    onChange={(event) => actualizarPago(pago.key, 'cuotas', Number(event.target.value))}
                    className="mt-2 h-9 w-full rounded-lg border border-slate-200 bg-white px-2 text-xs text-slate-800"
                  >
                    <option value={1}>1 cuota (+10%)</option>
                    <option value={3}>3 cuotas (+15%)</option>
                  </select>
                ) : null}
                {pago.medio === 'OTRO' ? (
                  <input
                    value={pago.nota}
                    onChange={(event) => actualizarPago(pago.key, 'nota', event.target.value)}
                    placeholder="¿Qué medio es?"
                    className="mt-2 h-9 w-full rounded-lg border border-slate-200 px-2 text-xs"
                  />
                ) : null}
              </div>
            ))}
            {restante > 0 ? (
              <button
                type="button"
                onClick={cargarRestanteConsignacion}
                className="w-full rounded-lg border border-dashed border-amber-300 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800 hover:bg-amber-100"
              >
                Cargar restante ({formatPrecio(restante)}) a consignación
              </button>
            ) : null}
            {hayConsignacion && !clienteId ? (
              <p className="text-xs text-amber-700">La consignación necesita un cliente.</p>
            ) : null}
          </div>
        </div>

        <div className="shrink-0 border-t border-slate-200 bg-white px-5 py-4">
          <div className="mb-3 space-y-1 text-sm">
            <div className="flex justify-between text-slate-500">
              <span>Subtotal</span>
              <span>{formatPrecio(subtotal)}</span>
            </div>
            {interes > 0 ? (
              <div className="flex justify-between text-amber-700">
                <span>Interés crédito</span>
                <span>{formatPrecio(interes)}</span>
              </div>
            ) : null}
            <div className="flex justify-between text-slate-500">
              <span>Pagado</span>
              <span>{formatPrecio(sumaPagos)}</span>
            </div>
            {restante !== 0 ? (
              <div className="flex justify-between text-red-600">
                <span>Diferencia</span>
                <span>{formatPrecio(restante)}</span>
              </div>
            ) : null}
          </div>
          <div className="mb-4 flex items-end justify-between rounded-xl bg-slate-900 px-4 py-3 text-white">
            <span className="text-sm font-medium text-slate-300">Total</span>
            <span className="text-2xl font-bold tracking-tight">{formatPrecio(total)}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={cobrarVenta}
              disabled={
                carrito.length === 0 ||
                cobrando ||
                carrito.some((item) => item.cantidad > (item.stockLocal ?? 0))
              }
              className="inline-flex h-12 min-w-0 flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-600 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:bg-emerald-600/40"
            >
              <Banknote className="h-4 w-4" />
              {cobrando ? 'Registrando...' : 'Confirmar venta'}
            </button>
            <button
              type="button"
              onClick={generarPresupuesto}
              disabled={carrito.length === 0}
              className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-400"
              aria-label="Descargar presupuesto"
            >
              <FileDown className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={cancelarVenta}
              disabled={carrito.length === 0}
              className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-red-600 text-white transition hover:bg-red-500 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400"
              aria-label="Cancelar"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>
    </div>
  )
}

export default NuevaVenta
