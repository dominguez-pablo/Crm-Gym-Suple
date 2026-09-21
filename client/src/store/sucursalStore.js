import { create } from 'zustand'
import { sucursalesApi } from '../api/sucursales'

const STORAGE_KEY = 'fitmarket.sucursalId'

function readStoredId() {
  const raw = localStorage.getItem(STORAGE_KEY)
  const id = Number(raw)
  return Number.isInteger(id) && id > 0 ? id : null
}

export const useSucursalStore = create((set, get) => ({
  sucursales: [],
  sucursalId: readStoredId(),
  loading: true,
  error: '',
  load: async () => {
    set({ loading: true, error: '' })
    const sucursales = await sucursalesApi.list()
    const current = get().sucursalId
    const valid = sucursales.some((sucursal) => sucursal.id === current)
    set({
      sucursales,
      sucursalId: valid ? current : null,
      loading: false,
    })
  },
  setSucursalId: (id) => {
    if (id) {
      localStorage.setItem(STORAGE_KEY, String(id))
    } else {
      localStorage.removeItem(STORAGE_KEY)
    }
    set({ sucursalId: id })
  },
  sucursal: () => get().sucursales.find((item) => item.id === get().sucursalId) || null,
}))
