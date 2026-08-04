import { useEffect, useState, useCallback } from 'react'
import { AuthContext } from './authContext.js'
import { fetchMe, login as apiLogin, logout as apiLogout } from '../lib/auth'

export default function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    fetchMe()
      .then((u) => {
        if (!cancelled) setUser(u)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const login = useCallback(async (email, password) => {
    const { user } = await apiLogin(email, password)
    setUser(user)
    return user
  }, [])

  const logout = useCallback(async () => {
    try {
      await apiLogout()
    } catch {
      // cookie déjà expiré : on ignore
    }
    setUser(null)
  }, [])

  return <AuthContext.Provider value={{ user, loading, login, logout }}>{children}</AuthContext.Provider>
}
