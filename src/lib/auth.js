const KEY = 'auth_token'

export function getToken() {
  return localStorage.getItem(KEY)
}

export function setToken(token) {
  if (token) localStorage.setItem(KEY, token)
  else localStorage.removeItem(KEY)
}

export function authHeaders() {
  const token = getToken()
  return token ? { Authorization: `Bearer ${token}` } : {}
}

export async function apiLogin(username, password) {
  const res = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || 'Login gagal')
  return data
}

export async function apiMe() {
  const res = await fetch('/api/auth/me', { headers: authHeaders() })
  if (!res.ok) throw new Error('Sesi tidak valid')
  return res.json()
}

export async function apiLogout() {
  try {
    await fetch('/api/auth/logout', { method: 'POST', headers: authHeaders() })
  } catch {
    // abaikan kegagalan jaringan saat logout
  }
}
