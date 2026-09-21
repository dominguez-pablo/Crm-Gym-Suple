import api from './client'

export const trasladosApi = {
  list: async () => {
    const { data } = await api.get('/traslados')
    return data
  },
  create: async (payload) => {
    const { data } = await api.post('/traslados', payload)
    return data
  },
}
