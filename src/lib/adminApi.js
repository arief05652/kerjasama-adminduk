import { authHeaders } from './auth'

const BASE = '/api/admin'

async function request(path, options = {}) {
  const res = await fetch(BASE + path, {
    ...options,
    headers: { ...authHeaders(), ...(options.headers || {}) },
  })
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.error || 'Permintaan gagal')
  }
  return res.json()
}

function post(path, body) {
  return request(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body ?? {}),
  })
}

export const fetchUsers = () => request('/users')

export const createUser = (payload) => post('/users', payload)

export const forceLogoutUser = (id) => post(`/users/${id}/force-logout`)

export const setUserActive = (id, active) => post(`/users/${id}/active`, { active })

export const fetchLogs = (limit = 100) =>
  request(`/logs?limit=${encodeURIComponent(limit)}`)
