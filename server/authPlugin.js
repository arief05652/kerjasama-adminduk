import { randomBytes } from 'node:crypto'
import {
  addLog,
  clearSession,
  findByToken,
  findByUsername,
  setSession,
  verifyPassword,
} from './db.js'

function json(res, status, data) {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json')
  res.end(JSON.stringify(data))
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let raw = ''
    req.on('data', (chunk) => {
      raw += chunk
      if (raw.length > 100_000) reject(new Error('Payload terlalu besar'))
    })
    req.on('end', () => {
      try {
        resolve(raw ? JSON.parse(raw) : {})
      } catch {
        reject(new Error('Body bukan JSON valid'))
      }
    })
    req.on('error', reject)
  })
}

function tokenOf(req) {
  const header = req.headers.authorization || ''
  return header.replace(/^Bearer\s+/i, '').trim()
}

function safeUser(user) {
  return {
    id: user.id,
    username: user.username,
    name: user.name,
    email: user.email,
    role: user.role,
  }
}

async function handler(req, res) {
  try {
    const pathname =
      req.url.split('?')[0].replace(/^\/api\/auth/, '') || '/'

    if (req.method === 'POST' && pathname === '/login') {
      const { username, password } = await readBody(req)
      const user = findByUsername(String(username || '').trim())
      if (!user || !verifyPassword(password || '', user.password)) {
        return json(res, 401, { error: 'Username atau password salah' })
      }
      if (!user.active) {
        return json(res, 403, { error: 'Akun dinonaktifkan' })
      }
      const token = randomBytes(32).toString('hex')
      setSession(user.id, token)
      addLog({
        userId: user.id,
        username: user.username,
        action: 'auth.login',
        detail: `${user.username} masuk`,
      })
      return json(res, 200, { token, user: safeUser(user) })
    }

    if (req.method === 'GET' && pathname === '/me') {
      const user = findByToken(tokenOf(req))
      if (!user || !user.active) {
        return json(res, 401, { error: 'Sesi tidak valid' })
      }
      return json(res, 200, safeUser(user))
    }

    if (req.method === 'POST' && pathname === '/logout') {
      const user = findByToken(tokenOf(req))
      if (user) {
        clearSession(user.id)
        addLog({
          userId: user.id,
          username: user.username,
          action: 'auth.logout',
          detail: `${user.username} keluar`,
        })
      }
      return json(res, 200, { ok: true })
    }

    return json(res, 404, { error: 'Endpoint tidak ditemukan' })
  } catch (err) {
    return json(res, 400, { error: err.message })
  }
}

export function authPlugin() {
  return {
    name: 'auth-api',
    configureServer(server) {
      server.middlewares.use('/api/auth', handler)
    },
    configurePreviewServer(server) {
      server.middlewares.use('/api/auth', handler)
    },
  }
}
