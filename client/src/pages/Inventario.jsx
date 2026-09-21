import { useCallback, useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import Swal from 'sweetalert2'
import { ArrowRightLeft, Package, Pencil, Plus, Trash2 } from 'lucide-react'
import { productosApi } from '../api/productos'
import { trasladosApi } from '../api/traslados'
import { useStockEvents } from '../hooks/useStockEvents'
import { useSucursalStore } from '../store/sucursalStore'
import { applyStockEvent, nombreCortoSucursal } from '../utils/stock'

const formatPrecio = (valor) =>
  new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  }).format(Number(valor) || 0)

const emptyValues = {
  nombre: '',
  marca: '',
  descripcion: '',
  precioCosto: 0,
  precioMayorista: 0,
  precioRecomendado: 0,
  precioPublico: 0,
}

function emptyStocks(sucursales) {
  return Object.fromEntries(
    sucursales.map((sucursal) => [sucursal.id, { cantidad: 0, stockMinimo: 5 }]),
  )
}

function stocksFromProducto(producto, sucursales) {
  const base = emptyStocks(sucursales)
  for (const stock of producto.stocks || []) {
    base[stock.sucursalId] = {
      cantidad: stock.cantidad,
      stockMinimo: stock.stockMinimo,
    }
  }
  return base
}

function Inventario() {
  const sucursales = useSucursalStore((state) => state.sucursales)
  const [tab, setTab] = useState('productos')
  const [productos, setProductos] = useState([])
  const [traslados, setTraslados] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editing, setEditing] = useState(null)
  const [open, setOpen] = useState(false)
  const [stockInputs, setStockInputs] = useState({})
  const [traslado, setTraslado] = useState(null)
  const { register, handleSubmit, reset } = useForm({ defaultValues: emptyValues })

  const loadProductos = async () => {
    setProductos(await productosApi.list())
  }

  const loadTraslados = async () => {
    setTraslados(await trasladosApi.list())
  }

  const load = async () => {
    setError('')
    await Promise.all([loadProductos(), loadTraslados()])
  }

  useEffect(() => {
    load()
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  const onStockEvent = useCallback((event) => {
    setProductos((lista) => lista.map((producto) => applyStockEvent(producto, event)))
  }, [])

  useStockEvents(onStockEvent)

  const openCreate = () => {
    setEditing(null)
    reset(emptyValues)
    setStockInputs(emptyStocks(sucursales))
    setOpen(true)
  }

  const openEdit = (producto) => {
    setEditing(producto)
    reset(producto)
    setStockInputs(stocksFromProducto(producto, sucursales))
    setOpen(true)
  }

  const openTraslado = (producto) => {
    const origen = sucursales[0]?.id || ''
    const destino = sucursales[1]?.id || sucursales[0]?.id || ''
    setTraslado({
      producto,
      sucursalOrigenId: origen,
      sucursalDestinoId: destino,
      cantidad: 1,
      nota: '',
    })
  }

  const onSubmit = async (values) => {
    const payload = {
      nombre: values.nombre,
      marca: values.marca,
      descripcion: values.descripcion,
      precioCosto: Number(values.precioCosto),
      precioMayorista: Number(values.precioMayorista),
      precioRecomendado: Number(values.precioRecomendado),
      precioPublico: Number(values.precioPublico),
      stocks: sucursales.map((sucursal) => ({
        sucursalId: sucursal.id,
        cantidad: Number(stockInputs[sucursal.id]?.cantidad ?? 0),
        stockMinimo: Number(stockInputs[sucursal.id]?.stockMinimo ?? 5),
      })),
    }

    try {
      if (editing) {
        await productosApi.update(editing.id, payload)
      } else {
        await productosApi.create(payload)
      }
      setOpen(false)
      await loadProductos()
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'No se pudo guardar', text: err.message })
    }
  }

  const remove = async (producto) => {
    const result = await Swal.fire({
      title: `¿Eliminar ${producto.nombre}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Eliminar',
      cancelButtonText: 'Cancelar',
    })
    if (!result.isConfirmed) return

    try {
      await productosApi.remove(producto.id)
      await loadProductos()
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'No se pudo eliminar', text: err.message })
    }
  }

  const enviarTraslado = async (event) => {
    event.preventDefault()
    if (!traslado) return
    try {
      await trasladosApi.create({
        productoId: traslado.producto.id,
        sucursalOrigenId: Number(traslado.sucursalOrigenId),
        sucursalDestinoId: Number(traslado.sucursalDestinoId),
        cantidad: Number(traslado.cantidad),
        nota: traslado.nota || null,
      })
      setTraslado(null)
      await Promise.all([loadProductos(), loadTraslados()])
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'No se pudo trasladar', text: err.message })
    }
  }

  const actualizarStockInput = (sucursalId, campo, valor) => {
    setStockInputs((actual) => ({
      ...actual,
      [sucursalId]: {
        ...(actual[sucursalId] || { cantidad: 0, stockMinimo: 5 }),
        [campo]: valor,
      },
    }))
  }

  const stockDe = (producto, sucursalId) =>
    producto.stocks?.find((stock) => stock.sucursalId === sucursalId)

  const totalStock = (producto) =>
    (producto.stocks || []).reduce((acc, stock) => acc + stock.cantidad, 0)

  const tabClass = (id) =>
    [
      'h-10 rounded-xl px-4 text-sm font-semibold',
      tab === id
        ? 'bg-slate-900 text-white'
        : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50',
    ].join(' ')

  const sucursalOrigenTraslado = useMemo(
    () => sucursales.find((item) => item.id === Number(traslado?.sucursalOrigenId)),
    [sucursales, traslado],
  )

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Inventario</h1>
          <p className="text-sm text-slate-500">Stock por sucursal, precios y traslados</p>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={() => setTab('productos')} className={tabClass('productos')}>
            Productos
          </button>
          <button type="button" onClick={() => setTab('traslados')} className={tabClass('traslados')}>
            Traslados
          </button>
          {tab === 'productos' ? (
            <button
              type="button"
              onClick={openCreate}
              className="inline-flex h-10 items-center gap-2 rounded-xl bg-emerald-600 px-4 text-sm font-semibold text-white hover:bg-emerald-500"
            >
              <Plus className="h-4 w-4" />
              Nuevo producto
            </button>
          ) : null}
        </div>
      </div>

      {error ? (
        <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      ) : null}

      <div className="min-h-0 flex-1 overflow-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
        {loading ? (
          <p className="p-6 text-sm text-slate-500">Cargando inventario...</p>
        ) : tab === 'traslados' ? (
          traslados.length === 0 ? (
            <div className="flex h-48 flex-col items-center justify-center text-slate-500">
              <ArrowRightLeft className="mb-2 h-8 w-8 text-slate-300" />
              Todavía no hay traslados
            </div>
          ) : (
            <table className="min-w-full text-left text-sm">
              <thead className="sticky top-0 bg-slate-50 text-xs font-semibold tracking-wide text-slate-500 uppercase">
                <tr>
                  <th className="px-4 py-3">Fecha</th>
                  <th className="px-4 py-3">Producto</th>
                  <th className="px-4 py-3">Origen</th>
                  <th className="px-4 py-3">Destino</th>
                  <th className="px-4 py-3">Cantidad</th>
                  <th className="px-4 py-3">Nota</th>
                </tr>
              </thead>
              <tbody>
                {traslados.map((item) => (
                  <tr key={item.id} className="border-t border-slate-100">
                    <td className="px-4 py-3 text-slate-600">
                      {new Date(item.createdAt).toLocaleString('es-AR')}
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-900">
                      {item.producto?.nombre}
                    </td>
                    <td className="px-4 py-3">{nombreCortoSucursal(item.sucursalOrigen?.nombre)}</td>
                    <td className="px-4 py-3">{nombreCortoSucursal(item.sucursalDestino?.nombre)}</td>
                    <td className="px-4 py-3 font-medium">{item.cantidad}</td>
                    <td className="px-4 py-3 text-slate-500">{item.nota || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )
        ) : productos.length === 0 ? (
          <div className="flex h-48 flex-col items-center justify-center text-slate-500">
            <Package className="mb-2 h-8 w-8 text-slate-300" />
            Todavía no hay productos
          </div>
        ) : (
          <table className="min-w-full text-left text-sm">
            <thead className="sticky top-0 bg-slate-50 text-xs font-semibold tracking-wide text-slate-500 uppercase">
              <tr>
                <th className="px-4 py-3">Producto</th>
                {sucursales.map((sucursal) => (
                  <th key={sucursal.id} className="px-4 py-3">
                    {nombreCortoSucursal(sucursal.nombre)}
                  </th>
                ))}
                <th className="px-4 py-3">Total</th>
                <th className="px-4 py-3">Costo</th>
                <th className="px-4 py-3">Mayorista</th>
                <th className="px-4 py-3">Recomendado</th>
                <th className="px-4 py-3">Público</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {productos.map((producto) => (
                <tr key={producto.id} className="border-t border-slate-100">
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-900">{producto.nombre}</p>
                    <p className="text-xs text-slate-400">{producto.marca || 'Sin marca'}</p>
                  </td>
                  {sucursales.map((sucursal) => {
                    const stock = stockDe(producto, sucursal.id)
                    const cantidad = stock?.cantidad ?? 0
                    const minimo = stock?.stockMinimo ?? 5
                    const bajo = cantidad <= minimo
                    return (
                      <td key={sucursal.id} className="px-4 py-3">
                        <span
                          className={
                            bajo
                              ? 'rounded-full bg-amber-50 px-2 py-1 text-xs font-medium text-amber-700'
                              : 'text-slate-700'
                          }
                        >
                          {cantidad} / min {minimo}
                        </span>
                      </td>
                    )
                  })}
                  <td className="px-4 py-3 font-medium text-slate-900">{totalStock(producto)}</td>
                  <td className="px-4 py-3">{formatPrecio(producto.precioCosto)}</td>
                  <td className="px-4 py-3">{formatPrecio(producto.precioMayorista)}</td>
                  <td className="px-4 py-3">{formatPrecio(producto.precioRecomendado)}</td>
                  <td className="px-4 py-3 font-medium">{formatPrecio(producto.precioPublico)}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => openTraslado(producto)}
                      className="mr-2 inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
                      aria-label={`Trasladar ${producto.nombre}`}
                    >
                      <ArrowRightLeft className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => openEdit(producto)}
                      className="mr-2 inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
                      aria-label={`Editar ${producto.nombre}`}
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => remove(producto)}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-red-600 hover:bg-red-50"
                      aria-label={`Eliminar ${producto.nombre}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {open ? (
        <div className="fixed inset-0 z-20 flex items-center justify-center bg-slate-900/40 p-4">
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-xl"
          >
            <h2 className="text-lg font-semibold text-slate-900">
              {editing ? 'Editar producto' : 'Nuevo producto'}
            </h2>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <input
                className="col-span-2 h-11 rounded-xl border border-slate-200 px-3 text-sm"
                placeholder="Nombre"
                {...register('nombre', { required: true })}
              />
              <input
                className="h-11 rounded-xl border border-slate-200 px-3 text-sm"
                placeholder="Marca"
                {...register('marca')}
              />
              <input
                className="h-11 rounded-xl border border-slate-200 px-3 text-sm"
                placeholder="Descripción"
                {...register('descripcion')}
              />
              {sucursales.map((sucursal) => (
                <div key={sucursal.id} className="col-span-2 grid grid-cols-2 gap-3 rounded-xl bg-slate-50 p-3">
                  <p className="col-span-2 text-xs font-semibold text-slate-600">
                    Stock {nombreCortoSucursal(sucursal.nombre)}
                  </p>
                  <label className="text-xs text-slate-500">
                    Cantidad
                    <input
                      type="number"
                      min="0"
                      className="mt-1 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm"
                      value={stockInputs[sucursal.id]?.cantidad ?? 0}
                      onChange={(event) =>
                        actualizarStockInput(sucursal.id, 'cantidad', event.target.value)
                      }
                    />
                  </label>
                  <label className="text-xs text-slate-500">
                    Mínimo
                    <input
                      type="number"
                      min="0"
                      className="mt-1 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm"
                      value={stockInputs[sucursal.id]?.stockMinimo ?? 5}
                      onChange={(event) =>
                        actualizarStockInput(sucursal.id, 'stockMinimo', event.target.value)
                      }
                    />
                  </label>
                </div>
              ))}
              <label className="text-xs text-slate-500">
                Precio costo
                <input
                  type="number"
                  className="mt-1 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm"
                  {...register('precioCosto', { valueAsNumber: true })}
                />
              </label>
              <label className="text-xs text-slate-500">
                Precio mayorista
                <input
                  type="number"
                  className="mt-1 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm"
                  {...register('precioMayorista', { valueAsNumber: true })}
                />
              </label>
              <label className="text-xs text-slate-500">
                Precio recomendado
                <input
                  type="number"
                  className="mt-1 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm"
                  {...register('precioRecomendado', { valueAsNumber: true })}
                />
              </label>
              <label className="text-xs text-slate-500">
                Precio público
                <input
                  type="number"
                  className="mt-1 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm"
                  {...register('precioPublico', { valueAsNumber: true })}
                />
              </label>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="h-10 rounded-xl px-4 text-sm font-medium text-slate-600 hover:bg-slate-100"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="h-10 rounded-xl bg-slate-900 px-4 text-sm font-semibold text-white"
              >
                Guardar
              </button>
            </div>
          </form>
        </div>
      ) : null}

      {traslado ? (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-slate-900/40 p-4">
          <form
            onSubmit={enviarTraslado}
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
          >
            <h2 className="text-lg font-semibold text-slate-900">Trasladar stock</h2>
            <p className="mt-1 text-sm text-slate-500">{traslado.producto.nombre}</p>
            <div className="mt-4 grid gap-3">
              <label className="text-xs text-slate-500">
                Origen
                <select
                  className="mt-1 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm"
                  value={traslado.sucursalOrigenId}
                  onChange={(event) =>
                    setTraslado((actual) => ({ ...actual, sucursalOrigenId: Number(event.target.value) }))
                  }
                >
                  {sucursales.map((sucursal) => (
                    <option key={sucursal.id} value={sucursal.id}>
                      {sucursal.nombre}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-xs text-slate-500">
                Destino
                <select
                  className="mt-1 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm"
                  value={traslado.sucursalDestinoId}
                  onChange={(event) =>
                    setTraslado((actual) => ({
                      ...actual,
                      sucursalDestinoId: Number(event.target.value),
                    }))
                  }
                >
                  {sucursales.map((sucursal) => (
                    <option key={sucursal.id} value={sucursal.id}>
                      {sucursal.nombre}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-xs text-slate-500">
                Cantidad
                <input
                  type="number"
                  min="1"
                  className="mt-1 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm"
                  value={traslado.cantidad}
                  onChange={(event) =>
                    setTraslado((actual) => ({ ...actual, cantidad: event.target.value }))
                  }
                />
              </label>
              {sucursalOrigenTraslado ? (
                <p className="text-xs text-slate-500">
                  Disponible en origen:{' '}
                  {stockDe(traslado.producto, Number(traslado.sucursalOrigenId))?.cantidad ?? 0}
                </p>
              ) : null}
              <label className="text-xs text-slate-500">
                Nota (opcional)
                <input
                  className="mt-1 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm"
                  value={traslado.nota}
                  onChange={(event) =>
                    setTraslado((actual) => ({ ...actual, nota: event.target.value }))
                  }
                />
              </label>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setTraslado(null)}
                className="h-10 rounded-xl px-4 text-sm font-medium text-slate-600 hover:bg-slate-100"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="h-10 rounded-xl bg-slate-900 px-4 text-sm font-semibold text-white"
              >
                Trasladar
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </div>
  )
}

export default Inventario
