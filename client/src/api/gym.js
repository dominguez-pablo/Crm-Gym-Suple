import api from './client'

export const gymApi = {
  dashboard: async (sucursalId) => {
    const { data } = await api.get('/gym/dashboard', { params: { sucursalId } })
    return data
  },
  planes: {
    list: async (todas = false) => {
      const { data } = await api.get('/gym/planes', {
        params: todas ? { todas: 1 } : undefined,
      })
      return data
    },
    create: async (payload) => {
      const { data } = await api.post('/gym/planes', payload)
      return data
    },
    update: async (id, payload) => {
      const { data } = await api.patch(`/gym/planes/${id}`, payload)
      return data
    },
  },
  socios: {
    list: async (params) => {
      const { data } = await api.get('/gym/socios', { params })
      return data
    },
    get: async (id) => {
      const { data } = await api.get(`/gym/socios/${id}`)
      return data
    },
    create: async (payload) => {
      const { data } = await api.post('/gym/socios', payload)
      return data
    },
    update: async (id, payload) => {
      const { data } = await api.patch(`/gym/socios/${id}`, payload)
      return data
    },
  },
  pagos: {
    list: async (params) => {
      const { data } = await api.get('/gym/pagos', { params })
      return data
    },
    create: async (payload) => {
      const { data } = await api.post('/gym/pagos', payload)
      return data
    },
  },
  accesos: {
    list: async (params) => {
      const { data } = await api.get('/gym/accesos', { params })
      return data
    },
    create: async (payload) => {
      const { data } = await api.post('/gym/accesos', payload)
      return data
    },
  },
  caja: {
    abierta: async (sucursalId) => {
      const { data } = await api.get('/gym/cajas/abierta', { params: { sucursalId } })
      return data
    },
    list: async (sucursalId) => {
      const { data } = await api.get('/gym/cajas', { params: { sucursalId } })
      return data
    },
    abrir: async (payload) => {
      const { data } = await api.post('/gym/cajas/abrir', payload)
      return data
    },
    movimiento: async (id, payload) => {
      const { data } = await api.post(`/gym/cajas/${id}/movimientos`, payload)
      return data
    },
    cerrar: async (id, payload) => {
      const { data } = await api.post(`/gym/cajas/${id}/cerrar`, payload)
      return data
    },
  },
}

export const empleadosApi = {
  list: async () => {
    const { data } = await api.get('/empleados')
    return data
  },
  create: async (payload) => {
    const { data } = await api.post('/empleados', payload)
    return data
  },
  update: async (id, payload) => {
    const { data } = await api.patch(`/empleados/${id}`, payload)
    return data
  },
}
