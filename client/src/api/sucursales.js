import api from './client'

export const sucursalesApi = {
  list: async () => {
    const { data } = await api.get('/sucursales')
    return data
  },
}
