import api from './client'

export const authApi = {
  login: async (payload) => {
    const { data } = await api.post('/auth/login', payload)
    return data
  },
  register: async (payload) => {
    const { data } = await api.post('/auth/register', payload)
    return data
  },
  me: async () => {
    const { data } = await api.get('/auth/me')
    return data
  },
  logout: async () => {
    const { data } = await api.post('/auth/logout')
    return data
  },
}
