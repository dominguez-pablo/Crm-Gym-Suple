import { useEffect } from 'react'

export function useStockEvents(onEvent) {
  useEffect(() => {
    const source = new EventSource('/api/eventos/stock', { withCredentials: true })

    const handler = (event) => {
      try {
        onEvent(JSON.parse(event.data))
      } catch {
        // ignore malformed payloads
      }
    }

    source.addEventListener('STOCK_CHANGED', handler)
    source.onerror = () => {
      // El browser reintenta solo; no rompemos la UI
    }

    return () => {
      source.removeEventListener('STOCK_CHANGED', handler)
      source.close()
    }
  }, [onEvent])
}
