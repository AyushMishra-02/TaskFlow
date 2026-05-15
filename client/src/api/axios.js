import axios from 'axios'

const API = axios.create({ baseURL: '/api' })

API.interceptors.request.use((config) => {
  try {
    const user = JSON.parse(localStorage.getItem('user'))
    if (user?.token) config.headers.Authorization = `Bearer ${user.token}`
  } catch { localStorage.removeItem('user') }
  return config
})

API.interceptors.response.use(
  (r) => r,
  (error) => {
    if (error.response?.status === 401 && localStorage.getItem('user')) {
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default API
