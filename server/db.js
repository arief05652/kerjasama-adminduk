import { DatabaseSync } from 'node:sqlite'
import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto'
import { mkdirSync } from 'node:fs'
import path from 'node:path'

const DIR = path.resolve(process.cwd(), 'database')
mkdirSync(DIR, { recursive: true })

export const db = new DatabaseSync(path.join(DIR, 'app.sqlite'))

db.exec('PRAGMA journal_mode = WAL')
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    email TEXT,
    password TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'user',
    active INTEGER NOT NULL DEFAULT 1,
    session_token TEXT,
    last_login TEXT,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    username TEXT,
    action TEXT NOT NULL,
    detail TEXT,
    created_at TEXT NOT NULL
  );
`)

export function hashPassword(password) {
  const salt = randomBytes(16).toString('hex')
  const hash = scryptSync(password, salt, 64).toString('hex')
  return `${salt}:${hash}`
}

export function verifyPassword(password, stored) {
  const [salt, hash] = String(stored).split(':')
  if (!salt || !hash) return false
  const test = scryptSync(password, salt, 64)
  const ref = Buffer.from(hash, 'hex')
  return test.length === ref.length && timingSafeEqual(test, ref)
}

export function findByUsername(username) {
  return db.prepare('SELECT * FROM users WHERE username = ?').get(username)
}

export function findUser(id) {
  return db.prepare('SELECT * FROM users WHERE id = ?').get(id)
}

export function listUsers() {
  return db
    .prepare(
      `SELECT id, username, name, email, role, active, last_login, created_at,
              CASE WHEN session_token IS NULL THEN 0 ELSE 1 END AS session_active
       FROM users ORDER BY (role = 'admin') DESC, username COLLATE NOCASE`,
    )
    .all()
    .map((u) => ({
      ...u,
      active: !!u.active,
      sessionActive: !!u.session_active,
    }))
}

export function createUser({ username, name, email, password, role }) {
  const info = db
    .prepare(
      `INSERT INTO users (username, name, email, password, role, active, created_at)
       VALUES (?, ?, ?, ?, ?, 1, ?)`,
    )
    .run(
      username,
      name,
      email || null,
      hashPassword(password),
      role === 'admin' ? 'admin' : 'user',
      new Date().toISOString(),
    )
  return Number(info.lastInsertRowid)
}

export function forceLogout(id) {
  db.prepare('UPDATE users SET session_token = NULL WHERE id = ?').run(id)
}

export function setSession(id, token) {
  db.prepare('UPDATE users SET session_token = ?, last_login = ? WHERE id = ?').run(
    token,
    new Date().toISOString(),
    id,
  )
}

export function findByToken(token) {
  if (!token) return null
  return db.prepare('SELECT * FROM users WHERE session_token = ?').get(token)
}

export function clearSession(id) {
  db.prepare('UPDATE users SET session_token = NULL WHERE id = ?').run(id)
}

export function setActive(id, active) {
  db.prepare(
    `UPDATE users
     SET active = ?,
         session_token = CASE WHEN ? = 0 THEN NULL ELSE session_token END
     WHERE id = ?`,
  ).run(active ? 1 : 0, active ? 1 : 0, id)
}

export function addLog({ userId = null, username = null, action, detail = null }) {
  db.prepare(
    `INSERT INTO logs (user_id, username, action, detail, created_at)
     VALUES (?, ?, ?, ?, ?)`,
  ).run(userId, username, action, detail, new Date().toISOString())
}

export function listLogs(limit = 100) {
  return db
    .prepare('SELECT * FROM logs ORDER BY id DESC LIMIT ?')
    .all(Math.max(1, Math.min(500, limit)))
}

// Seed satu akun admin default kalau belum ada admin sama sekali
if (!db.prepare("SELECT id FROM users WHERE role = 'admin' LIMIT 1").get()) {
  createUser({
    username: 'admin',
    name: 'Administrator',
    email: 'admin@contoh.id',
    password: 'admin123',
    role: 'admin',
  })
  addLog({ username: 'system', action: 'seed', detail: 'Akun admin default dibuat' })
}
