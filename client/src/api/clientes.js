import api from './client'

export const clientesApi = {
  list: async () => {
    const { data } = await api.get('/clientes')
    return data
  },
  get: async (id) => {
    const { data } = await api.get(`/clientes/${id}`)
    return data
  },
  create: async (payload) => {
    const { data } = await api.post('/clientes', payload)
    return data
  },
  update: async (id, payload) => {
    const { data } = await api.patch(`/clientes/${id}`, payload)
    return data
  },
}
