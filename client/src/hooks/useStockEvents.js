import { useEffect } from 'react'

export function useStockEvents(onStockChanged, onSucursalChanged) {
  useEffect(() => {
    const source = new EventSource('/api/eventos/stock', { withCredentials: true })

    const stockHandler = (event) => {
      if (!onStockChanged) return
      try {
        onStockChanged(JSON.parse(event.data))
      } catch {
        // ignore malformed payloads
      }
    }

    const sucursalHandler = (event) => {
      if (!onSucursalChanged) return
      try {
        onSucursalChanged(event.data ? JSON.parse(event.data) : {})
      } catch {
        onSucursalChanged({})
      }
    }

    source.addEventListener('STOCK_CHANGED', stockHandler)
    source.addEventListener('SUCURSAL_CHANGED', sucursalHandler)
    source.onerror = () => {
      // El browser reintenta solo; no rompemos la UI
    }

    return () => {
      source.removeEventListener('STOCK_CHANGED', stockHandler)
      source.removeEventListener('SUCURSAL_CHANGED', sucursalHandler)
      source.close()
    }
  }, [onStockChanged, onSucursalChanged])
}
