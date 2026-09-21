import api from './client'

export const productosApi = {
  list: async (sucursalId) => {
    const { data } = await api.get('/productos', {
      params: sucursalId ? { sucursalId } : undefined,
    })
    return data
  },
  get: async (id, sucursalId) => {
    const { data } = await api.get(`/productos/${id}`, {
      params: sucursalId ? { sucursalId } : undefined,
    })
    return data
  },
  create: async (payload) => {
    const { data } = await api.post('/productos', payload)
    return data
  },
  update: async (id, payload) => {
    const { data } = await api.patch(`/productos/${id}`, payload)
    return data
  },
  updateStock: async (id, payload) => {
    const { data } = await api.patch(`/productos/${id}/stock`, payload)
    return data
  },
  remove: async (id) => {
    await api.delete(`/productos/${id}`)
  },
}
