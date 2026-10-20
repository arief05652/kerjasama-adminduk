import {
  addLog,
  createUser,
  findByToken,
  findByUsername,
  findUser,
  forceLogout,
  listLogs,
  listUsers,
  setActive,
} from './db.js'
import { broadcast } from './events.js'

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
      if (raw.length > 1_000_000) reject(new Error('Payload terlalu besar'))
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

function route(req) {
  const pathname = req.url.split('?')[0].replace(/^\/api\/admin/, '') || '/'
  const query = new URLSearchParams(req.url.split('?')[1] ?? '')
  return { pathname, query }
}

function requireAdmin(req) {
  const token = (req.headers.authorization || '')
    .replace(/^Bearer\s+/i, '')
    .trim()
  const user = findByToken(token)
  if (!user || !user.active || user.role !== 'admin') {
    throw new Error('Hanya admin yang boleh mengakses')
  }
  return user
}

async function handler(req, res) {
  try {
    const { pathname, query } = route(req)

    if (req.method === 'GET' && pathname === '/users') {
      requireAdmin(req)
      return json(res, 200, listUsers())
    }

    if (req.method === 'GET' && pathname === '/logs') {
      requireAdmin(req)
      return json(res, 200, listLogs(Number(query.get('limit')) || 100))
    }

    if (req.method === 'POST' && pathname === '/users') {
      const body = await readBody(req)
      const { username, name, email, password, role } = body
      const actor = requireAdmin(req)
      if (!username?.trim() || !name?.trim() || !password) {
        throw new Error('Username, nama, dan password wajib diisi')
      }
      if (findByUsername(username.trim())) throw new Error('Username sudah dipakai')
      const id = createUser({
        username: username.trim(),
        name: name.trim(),
        email: email?.trim(),
        password,
        role,
      })
      addLog({
        userId: actor.id,
        username: actor.username,
        action: 'user.create',
        detail: `Menambah user "${username.trim()}"`,
      })
      broadcast('users')
      broadcast('logs')
      return json(res, 201, { id })
    }

    const force = pathname.match(/^\/users\/(\d+)\/force-logout$/)
    if (req.method === 'POST' && force) {
      const actor = requireAdmin(req)
      const target = findUser(Number(force[1]))
      if (!target) throw new Error('User tidak ditemukan')
      forceLogout(target.id)
      addLog({
        userId: actor.id,
        username: actor.username,
        action: 'user.force-logout',
        detail: `Logout paksa "${target.username}"`,
      })
      broadcast('users')
      broadcast('logs')
      return json(res, 200, { ok: true })
    }

    const active = pathname.match(/^\/users\/(\d+)\/active$/)
    if (req.method === 'POST' && active) {
      const body = await readBody(req)
      const actor = requireAdmin(req)
      const target = findUser(Number(active[1]))
      if (!target) throw new Error('User tidak ditemukan')
      setActive(target.id, !!body.active)
      addLog({
        userId: actor.id,
        username: actor.username,
        action: body.active ? 'user.activate' : 'user.deactivate',
        detail: `${body.active ? 'Mengaktifkan' : 'Menonaktifkan'} "${target.username}"`,
      })
      broadcast('users')
      broadcast('logs')
      return json(res, 200, { ok: true })
    }

    return json(res, 404, { error: 'Endpoint tidak ditemukan' })
  } catch (err) {
    return json(res, 400, { error: err.message })
  }
}

export function adminPlugin() {
  return {
    name: 'admin-api',
    configureServer(server) {
      server.middlewares.use('/api/admin', handler)
    },
    configurePreviewServer(server) {
      server.middlewares.use('/api/admin', handler)
    },
  }
}
