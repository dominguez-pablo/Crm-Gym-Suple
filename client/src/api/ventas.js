import api from './client'

export const ventasApi = {
  list: async (sucursalId) => {
    const { data } = await api.get('/ventas', {
      params: sucursalId ? { sucursalId } : undefined,
    })
    return data
  },
  get: async (id) => {
    const { data } = await api.get(`/ventas/${id}`)
    return data
  },
  create: async (payload) => {
    const { data } = await api.post('/ventas', payload)
    return data
  },
  updateEstado: async (id, estado) => {
    const { data } = await api.patch(`/ventas/${id}/estado`, { estado })
    return data
  },
}
