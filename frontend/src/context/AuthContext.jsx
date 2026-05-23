import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import api from '../api/axios'
import toast from 'react-hot-toast'

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(() => localStorage.getItem('token'))
  const [loading, setLoading] = useState(true)

  const fetchMe = useCallback(async () => {
    try {
      const { data } = await api.get('/auth/me')
      setUser(data)
    } catch {
      setToken(null)
      setUser(null)
      localStorage.removeItem('token')
      localStorage.removeItem('refreshToken')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`
      fetchMe()
    } else {
      setLoading(false)
    }
  }, [token, fetchMe])

  // Silent token refresh
  useEffect(() => {
    const interceptor = api.interceptors.response.use(
      (res) => res,
      async (error) => {
        const originalRequest = error.config
        if (error.response?.status === 401 && error.response?.data?.code === 'TOKEN_EXPIRED' && !originalRequest._retry) {
          originalRequest._retry = true
          try {
            const refreshToken = localStorage.getItem('refreshToken')
            const { data } = await api.post('/auth/refresh-token', { refreshToken })
            localStorage.setItem('token', data.token)
            localStorage.setItem('refreshToken', data.refreshToken)
            api.defaults.headers.common['Authorization'] = `Bearer ${data.token}`
            setToken(data.token)
            originalRequest.headers['Authorization'] = `Bearer ${data.token}`
            return api(originalRequest)
          } catch {
            logout()
          }
        }
        return Promise.reject(error)
      }
    )
    return () => api.interceptors.response.eject(interceptor)
  }, [])

  const login = async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password })
    localStorage.setItem('token', data.token)
    localStorage.setItem('refreshToken', data.refreshToken)
    api.defaults.headers.common['Authorization'] = `Bearer ${data.token}`
    setToken(data.token)
    setUser(data.user)
    toast.success(`Welcome back, ${data.user.username}! 👋`)
    return data
  }

  const register = async (username, email, password, role = 'employee') => {
    const { data } = await api.post('/auth/register', { username, email, password, role })
    localStorage.setItem('token', data.token)
    localStorage.setItem('refreshToken', data.refreshToken)
    api.defaults.headers.common['Authorization'] = `Bearer ${data.token}`
    setToken(data.token)
    setUser(data.user)
    toast.success(`Account created! Welcome, ${data.user.username}! 🎉`)
    return data
  }

  const logout = () => {
    api.post('/auth/logout').catch(() => {})
    localStorage.removeItem('token')
    localStorage.removeItem('refreshToken')
    delete api.defaults.headers.common['Authorization']
    setToken(null)
    setUser(null)
    toast.success('Logged out successfully')
  }

  const updateUser = (updatedUser) => {
    setUser(updatedUser)
  }

  const isAdmin = user?.role === 'admin'
  const isEmployee = user?.role === 'employee'

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, updateUser, fetchMe, isAdmin, isEmployee }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
