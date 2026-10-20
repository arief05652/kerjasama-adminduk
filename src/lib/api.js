import { authHeaders } from './auth'

const ENDPOINT = '/api/fs'

async function send(payload) {
  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(payload),
  })
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.error || 'Operasi gagal')
  }
  return res.json()
}

export async function fetchTree() {
  const res = await fetch(ENDPOINT)
  if (!res.ok) throw new Error('Gagal memuat storage')
  return res.json()
}

export async function fetchUsage() {
  const res = await fetch(`${ENDPOINT}/usage`)
  if (!res.ok) throw new Error('Gagal memuat penggunaan storage')
  return res.json()
}

export function rawUrl(path) {
  return `${ENDPOINT}/raw?path=${encodeURIComponent(path)}`
}

// Langganan event realtime (SSE). listener dipanggil dengan tipe event.
export function subscribe(listener) {
  const source = new EventSource(`${ENDPOINT}/events`)
  for (const type of ['fs', 'users', 'logs']) {
    source.addEventListener(type, () => listener(type))
  }
  return () => source.close()
}

export async function uploadFile(dir, file) {
  const url = `${ENDPOINT}/upload?dir=${encodeURIComponent(dir)}&name=${encodeURIComponent(file.name)}`
  const res = await fetch(url, {
    method: 'POST',
    headers: authHeaders(),
    body: file,
  })
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.error || `Gagal mengunggah ${file.name}`)
  }
  return res.json()
}

export const createEntry = (dir, name, type) =>
  send({ action: 'create', dir, name, type })

export const renameEntry = (path, name) =>
  send({ action: 'rename', path, name })

export const deleteEntry = (path) => send({ action: 'delete', path })

export const moveEntry = (from, toDir) =>
  send({ action: 'move', from, toDir })

export const copyEntry = (from, toDir) =>
  send({ action: 'copy', from, toDir })
