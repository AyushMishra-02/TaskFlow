import { createContext, useContext, useState, useEffect } from 'react'
import API from '../api/axios'

const AuthContext = createContext()
export const useAuth = () => useContext(AuthContext)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('user')) } catch { return null }
  })
  const [loading, setLoading] = useState(false)

  const login = async (email, password) => {
    setLoading(true)
    try {
      const { data } = await API.post('/auth/login', { email, password })
      localStorage.setItem('user', JSON.stringify(data))
      setUser(data)
      return data
    } finally { setLoading(false) }
  }

  const register = async (name, email, password) => {
    setLoading(true)
    try {
      const { data } = await API.post('/auth/register', { name, email, password })
      localStorage.setItem('user', JSON.stringify(data))
      setUser(data)
      return data
    } finally { setLoading(false) }
  }

  const logout = () => {
    localStorage.removeItem('user')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  )
}
