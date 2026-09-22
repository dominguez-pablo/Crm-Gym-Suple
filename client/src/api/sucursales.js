import api from './client'

export const sucursalesApi = {
  list: async (todas = false, modulo) => {
    const { data } = await api.get('/sucursales', {
      params: {
        ...(todas ? { todas: 1 } : {}),
        ...(modulo ? { modulo } : {}),
      },
    })
    return data
  },
  create: async (payload) => {
    const { data } = await api.post('/sucursales', payload)
    return data
  },
  update: async (id, payload) => {
    const { data } = await api.patch(`/sucursales/${id}`, payload)
    return data
  },
  cerrar: async (id, payload) => {
    const { data } = await api.post(`/sucursales/${id}/cerrar`, payload)
    return data
  },
  reabrir: async (id) => {
    const { data } = await api.post(`/sucursales/${id}/reabrir`)
    return data
  },
}
