import api from '../../compartido/api/client'

export const dashboardApi = {
  get: async (sucursalId) => {
    const { data } = await api.get('/dashboard', {
      params: sucursalId ? { sucursalId } : undefined,
    })
    return data
  },
}
