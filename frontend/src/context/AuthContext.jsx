import { createContext, useContext, useState, useEffect } from 'react'
import { api } from '../utils/api'

const AuthContext = createContext(null)

// Decodifica el payload del JWT sin verificar firma (solo para leer datos en cliente)
function decodeToken(token) {
  try {
    const payload = token.split('.')[1]
    return JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')))
  } catch {
    return null
  }
}

function isTokenExpired(token) {
  const payload = decodeToken(token)
  if (!payload?.exp) return true
  return payload.exp < Math.floor(Date.now() / 1000)
}

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('ft_token')

    // Sin token — no autenticado
    if (!token) { setLoading(false); return }

    // Token expirado — limpiar y salir
    if (isTokenExpired(token)) {
      localStorage.removeItem('ft_token')
      setLoading(false)
      return
    }

    // Token válido — cargar datos del usuario desde el servidor
    // Si falla la red, usar los datos del propio token para no expulsar al usuario
    api.get('/auth/me')
      .then(data => setUser(data))
      .catch(() => {
        // Fallo de red o servidor — usar payload del token como fallback
        const payload = decodeToken(token)
        if (payload) {
          setUser({ id: payload.id, name: payload.name, role: payload.role })
        } else {
          localStorage.removeItem('ft_token')
        }
      })
      .finally(() => setLoading(false))
  }, [])

  const login = async (email, password) => {
    const data = await api.post('/auth/login', { email, password })
    localStorage.setItem('ft_token', data.token)
    setUser(data.user)
    return data.user
  }

  const logout = () => {
    localStorage.removeItem('ft_token')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
