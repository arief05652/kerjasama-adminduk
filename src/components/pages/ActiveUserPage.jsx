import { useCallback, useEffect, useState } from 'react'
import Button from '../common/Button'
import UserFormDialog from './UserFormDialog'
import {
  createUser,
  fetchUsers,
  forceLogoutUser,
  setUserActive,
} from '../../lib/adminApi'
import { subscribe } from '../../lib/api'
import './pages.css'

function ActiveUserPage() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showForm, setShowForm] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      setUsers(await fetchUsers())
      setError(null)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  // Sinkron realtime: perbarui daftar saat ada perubahan user di device lain
  useEffect(() => subscribe((type) => type === 'users' && load()), [load])

  async function run(operation) {
    try {
      await operation()
      await load()
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <section className="page">
      <header className="page-head page-head-row">
        <div>
          <h2>Active User</h2>
          <p>Kelola pengguna, sesi login, dan status akses.</p>
        </div>
        <Button variant="primary" onClick={() => setShowForm(true)}>
          + Tambah User
        </Button>
      </header>

      {error && <div className="page-error">{error}</div>}

      <div className="table">
        <div className="table-head user-grid">
          <span>Nama</span>
          <span>Username</span>
          <span>Peran</span>
          <span>Status</span>
          <span>Sesi</span>
          <span>Aksi</span>
        </div>
        <ul className="table-list">
          {loading ? (
            <li className="table-row user-grid">
              <span className="cell-muted">Memuat…</span>
            </li>
          ) : (
            users.map((user) => (
              <li key={user.id} className="table-row user-grid">
                <span className="cell-strong">
                  {user.name}
                  <span className="cell-sub">{user.email || '—'}</span>
                </span>
                <span className="cell-muted">{user.username}</span>
                <span>{user.role === 'admin' ? 'Admin' : 'User'}</span>
                <span>
                  <span className={`badge ${user.active ? 'ok' : 'off'}`}>
                    {user.active ? 'Aktif' : 'Nonaktif'}
                  </span>
                </span>
                <span>
                  <span
                    className={`badge ${user.sessionActive ? 'online' : 'off'}`}
                  >
                    {user.sessionActive ? 'Online' : 'Offline'}
                  </span>
                </span>
                <span className="row-actions">
                  <Button
                    variant="toolbar"
                    disabled={!user.sessionActive}
                    onClick={() => run(() => forceLogoutUser(user.id))}
                  >
                    Logout paksa
                  </Button>
                  <Button
                    variant="toolbar"
                    onClick={() => run(() => setUserActive(user.id, !user.active))}
                  >
                    {user.active ? 'Nonaktifkan' : 'Aktifkan'}
                  </Button>
                </span>
              </li>
            ))
          )}
        </ul>
      </div>

      <UserFormDialog
        open={showForm}
        onCancel={() => setShowForm(false)}
        onSubmit={(form) => {
          setShowForm(false)
          run(() => createUser(form))
        }}
      />
    </section>
  )
}

export default ActiveUserPage
