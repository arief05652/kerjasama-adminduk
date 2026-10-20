import { useCallback, useEffect, useState } from 'react'
import { apiLogin, apiLogout, apiMe, getToken, setToken } from '../lib/auth'

export function useAuth() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    if (!getToken()) {
      setUser(null)
      setLoading(false)
      return
    }
    try {
      setUser(await apiMe())
    } catch {
      setToken(null)
      setUser(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  const login = useCallback(async (username, password) => {
    const { token, user: account } = await apiLogin(username, password)
    setToken(token)
    setUser(account)
    return account
  }, [])

  const logout = useCallback(async () => {
    await apiLogout()
    setToken(null)
    setUser(null)
  }, [])

  return { user, loading, login, logout }
}
