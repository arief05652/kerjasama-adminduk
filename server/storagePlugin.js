import { createReadStream, promises as fsp } from 'node:fs'
import path from 'node:path'
import { addLog, findByToken } from './db.js'
import { addClient, broadcast, removeClient } from './events.js'

const ROOT = () => path.resolve(process.cwd(), 'storage')

// Pelaku diambil dari token sesi, bukan hardcode, supaya log mencatat user yang benar
function actorOf(req) {
  const token = (req.headers.authorization || '')
    .replace(/^Bearer\s+/i, '')
    .trim()
  const user = findByToken(token)
  return user
    ? { id: user.id, username: user.username }
    : { id: null, username: 'sistem' }
}

function logAction(body, actor) {
  const actions = {
    create: body.type === 'folder' ? 'folder.create' : 'file.create',
    rename: 'file.rename',
    delete: 'file.delete',
    move: 'file.move',
    copy: 'file.copy',
  }
  const action = actions[body.action]
  if (!action) return
  addLog({
    userId: actor.id,
    username: actor.username,
    action,
    detail: body.name || body.path || body.from || null,
  })
}

const CONTENT_TYPES = {
  pdf: 'application/pdf',
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  gif: 'image/gif',
  webp: 'image/webp',
  bmp: 'image/bmp',
  ico: 'image/x-icon',
  svg: 'image/svg+xml',
  mp4: 'video/mp4',
  webm: 'video/webm',
  ogg: 'video/ogg',
  mp3: 'audio/mpeg',
  wav: 'audio/wav',
  txt: 'text/plain; charset=utf-8',
  md: 'text/plain; charset=utf-8',
  log: 'text/plain; charset=utf-8',
  json: 'application/json; charset=utf-8',
  csv: 'text/csv; charset=utf-8',
  xml: 'application/xml; charset=utf-8',
  html: 'text/html; charset=utf-8',
  css: 'text/css; charset=utf-8',
  js: 'text/javascript; charset=utf-8',
}

function contentType(file) {
  const ext = path.extname(file).slice(1).toLowerCase()
  return CONTENT_TYPES[ext] || 'application/octet-stream'
}

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

// Pastikan path tetap di dalam folder storage (cegah path traversal)
function resolveInside(rel) {
  const root = ROOT()
  const abs = path.resolve(root, rel || '')
  const relative = path.relative(root, abs)
  if (relative.startsWith('..') || path.isAbsolute(relative)) {
    throw new Error('Path tidak diizinkan')
  }
  return abs
}

function assertName(name) {
  if (!name || typeof name !== 'string') throw new Error('Nama wajib diisi')
  if (name.includes('/') || name.includes('\\') || name.includes('\0')) {
    throw new Error('Nama tidak boleh mengandung "/" atau "\\"')
  }
  if (name === '.' || name === '..') throw new Error('Nama tidak valid')
}

async function exists(abs) {
  try {
    await fsp.access(abs)
    return true
  } catch {
    return false
  }
}

async function buildTree(absDir, relDir) {
  const entries = await fsp.readdir(absDir, { withFileTypes: true })
  const nodes = []
  for (const entry of entries) {
    if (entry.name.startsWith('.')) continue
    const rel = relDir ? `${relDir}/${entry.name}` : entry.name
    const abs = path.join(absDir, entry.name)
    const stat = await fsp.stat(abs)
    if (entry.isDirectory()) {
      nodes.push({
        id: rel,
        name: entry.name,
        type: 'folder',
        modified: stat.mtime.toISOString(),
        children: await buildTree(abs, rel),
      })
    } else if (entry.isFile()) {
      nodes.push({
        id: rel,
        name: entry.name,
        type: 'file',
        size: stat.size,
        modified: stat.mtime.toISOString(),
      })
    }
  }
  nodes.sort((a, b) =>
    a.type === b.type
      ? a.name.localeCompare(b.name, 'id')
      : a.type === 'folder'
        ? -1
        : 1,
  )
  return nodes
}

async function createEntry({ dir, name, type }) {
  assertName(name)
  const parent = resolveInside(dir)
  if (!(await exists(parent))) throw new Error('Folder tujuan tidak ditemukan')
  const target = path.join(parent, name)
  if (await exists(target)) throw new Error('Nama sudah dipakai')
  if (type === 'folder') await fsp.mkdir(target)
  else await fsp.writeFile(target, '', { flag: 'wx' })
}

async function renameEntry({ path: relPath, name }) {
  assertName(name)
  const source = resolveInside(relPath)
  if (!(await exists(source))) throw new Error('Item tidak ditemukan')
  const target = path.join(path.dirname(source), name)
  if (target !== source && (await exists(target))) {
    throw new Error('Nama sudah dipakai')
  }
  await fsp.rename(source, target)
}

async function deleteEntry({ path: relPath }) {
  const target = resolveInside(relPath)
  await fsp.rm(target, { recursive: true })
}

async function moveEntry({ from, toDir }) {
  const source = resolveInside(from)
  const destDir = resolveInside(toDir)
  if (!(await exists(source))) throw new Error('Item tidak ditemukan')
  if (!(await exists(destDir))) throw new Error('Folder tujuan tidak ditemukan')
  const relative = path.relative(source, destDir)
  if (relative === '' || (!relative.startsWith('..') && !path.isAbsolute(relative))) {
    throw new Error('Tidak bisa memindahkan ke dalam dirinya sendiri')
  }
  const target = path.join(destDir, path.basename(source))
  if (await exists(target)) throw new Error('Sudah ada item serupa di tujuan')
  await fsp.rename(source, target)
}

async function copyEntry({ from, toDir }) {
  const source = resolveInside(from)
  const destDir = resolveInside(toDir)
  if (!(await exists(source))) throw new Error('Item tidak ditemukan')
  if (!(await exists(destDir))) throw new Error('Folder tujuan tidak ditemukan')
  const target = path.join(destDir, path.basename(source))
  if (await exists(target)) throw new Error('Sudah ada item serupa di tujuan')
  await fsp.cp(source, target, { recursive: true })
}

async function uploadFile(req, dir, name) {
  assertName(name)
  const parent = resolveInside(dir)
  if (!(await exists(parent))) throw new Error('Folder tujuan tidak ditemukan')
  const target = path.join(parent, name)
  if (await exists(target)) throw new Error('Nama sudah dipakai')
  await fsp.writeFile(target, req)
}

async function applyAction(body) {
  switch (body.action) {
    case 'create':
      return createEntry(body)
    case 'rename':
      return renameEntry(body)
    case 'delete':
      return deleteEntry(body)
    case 'move':
      return moveEntry(body)
    case 'copy':
      return copyEntry(body)
    default:
      throw new Error('Aksi tidak dikenal')
  }
}

async function dirSize(abs) {
  let total = 0
  const entries = await fsp.readdir(abs, { withFileTypes: true })
  for (const entry of entries) {
    const child = path.join(abs, entry.name)
    if (entry.isDirectory()) total += await dirSize(child)
    else if (entry.isFile()) total += (await fsp.stat(child)).size
  }
  return total
}

async function usage(root) {
  const stat = await fsp.statfs(root)
  const total = Number(stat.blocks) * Number(stat.bsize)
  const free = Number(stat.bavail) * Number(stat.bsize)
  return {
    device: { total, used: total - free, free },
    storage: { size: await dirSize(root) },
  }
}

async function handler(req, res) {
  try {
    const root = ROOT()
    await fsp.mkdir(root, { recursive: true })

    if (req.method === 'GET') {
      const pathname = req.url.split('?')[0]
      if (pathname.endsWith('/events')) {
        res.statusCode = 200
        res.setHeader('Content-Type', 'text/event-stream')
        res.setHeader('Cache-Control', 'no-cache')
        res.setHeader('Connection', 'keep-alive')
        res.setHeader('X-Accel-Buffering', 'no')
        res.flushHeaders?.()
        addClient(res)
        req.on('close', () => removeClient(res))
        return
      }
      if (pathname.endsWith('/usage')) {
        return json(res, 200, await usage(root))
      }
      if (pathname.endsWith('/raw')) {
        const params = new URLSearchParams(req.url.split('?')[1] ?? '')
        const abs = resolveInside(params.get('path'))
        const stat = await fsp.stat(abs)
        if (!stat.isFile()) throw new Error('Bukan sebuah file')
        res.statusCode = 200
        res.setHeader('Content-Type', contentType(abs))
        res.setHeader('Content-Length', stat.size)
        res.setHeader('Content-Disposition', 'inline')
        createReadStream(abs).pipe(res)
        return
      }
      const tree = {
        id: '',
        name: 'Storage',
        type: 'folder',
        modified: new Date().toISOString(),
        children: await buildTree(root, ''),
      }
      return json(res, 200, tree)
    }

    if (req.method === 'POST') {
      const actor = actorOf(req)
      const pathname = req.url.split('?')[0]
      if (pathname.endsWith('/upload')) {
        const params = new URLSearchParams(req.url.split('?')[1] ?? '')
        const name = params.get('name') ?? ''
        await uploadFile(req, params.get('dir') ?? '', name)
        addLog({
          userId: actor.id,
          username: actor.username,
          action: 'file.upload',
          detail: name,
        })
        broadcast('fs')
        broadcast('logs')
        return json(res, 200, { ok: true })
      }
      const body = await readBody(req)
      await applyAction(body)
      logAction(body, actor)
      broadcast('fs')
      broadcast('logs')
      return json(res, 200, { ok: true })
    }

    return json(res, 405, { error: 'Method tidak diizinkan' })
  } catch (err) {
    return json(res, 400, { error: err.message })
  }
}

export function storagePlugin() {
  return {
    name: 'storage-api',
    configureServer(server) {
      server.middlewares.use('/api/fs', handler)
    },
    configurePreviewServer(server) {
      server.middlewares.use('/api/fs', handler)
    },
  }
}
