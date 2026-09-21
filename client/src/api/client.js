import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const data = error.response?.data
    const message =
      data?.errors?.[0]?.message || data?.message || error.message || 'Error de red'
    return Promise.reject(Object.assign(error, { message }))
  },
)

export default api
