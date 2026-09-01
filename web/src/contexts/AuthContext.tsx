import { createContext, useContext, useMemo, useState, useCallback, type ReactNode } from 'react'
import { apiRequest, clearTokens, setTokens } from '@/lib/api-client'

export type AuthUser = {
  id: string
  email: string
  name: string
  role: string
  avatarUrl?: string | null
  permissions: string[]
}

type AuthContextValue = {
  user: AuthUser | null
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
  hasPermission: (...codes: string[]) => boolean
  hasAnyPermission: (...codes: string[]) => boolean
}

const AuthContext = createContext<AuthContextValue | null>(null)

function readStoredUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem('paroquia_user')
    return raw ? (JSON.parse(raw) as AuthUser) : null
  } catch {
    return null
  }
}

function persistUser(next: AuthUser | null) {
  if (next) localStorage.setItem('paroquia_user', JSON.stringify(next))
  else localStorage.removeItem('paroquia_user')
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => readStoredUser())

  const login = useCallback(async (email: string, password: string) => {
    const result = await apiRequest<{
      accessToken: string
      refreshToken: string
      user: AuthUser
    }>('/api/auth/login', {
      method: 'POST',
      auth: false,
      json: { email, password },
    })
    setTokens(result.accessToken, result.refreshToken)
    persistUser(result.user)
    setUser(result.user)
  }, [])

  const logout = useCallback(async () => {
    const refreshToken = localStorage.getItem('paroquia_refresh_token')
    try {
      await apiRequest('/api/auth/logout', { method: 'POST', json: { refreshToken } })
    } catch {
      // ignore
    }
    clearTokens()
    persistUser(null)
    setUser(null)
  }, [])

  const refreshUser = useCallback(async () => {
    try {
      const result = await apiRequest<{ user: AuthUser }>('/api/auth/me')
      if (result.user?.id) {
        persistUser(result.user)
        setUser(result.user)
      }
    } catch {
      // keep stored user
    }
  }, [])

  const hasPermission = useCallback(
    (...codes: string[]) => {
      if (!user) return false
      if (user.role === 'ADMIN') return true
      return codes.every((code) => user.permissions.includes(code))
    },
    [user],
  )

  const hasAnyPermission = useCallback(
    (...codes: string[]) => {
      if (!user) return false
      if (user.role === 'ADMIN') return true
      return codes.some((code) => user.permissions.includes(code))
    },
    [user],
  )

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      login,
      logout,
      refreshUser,
      hasPermission,
      hasAnyPermission,
    }),
    [user, login, logout, refreshUser, hasPermission, hasAnyPermission],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth deve ser usado dentro de AuthProvider')
  return ctx
}
