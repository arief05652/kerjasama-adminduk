import { useEffect, useState } from 'react'
import Button from '../common/Button'
import '../common/Modal.css'
import './pages.css'

const EMPTY = { username: '', name: '', email: '', password: '', role: 'user' }

function UserFormDialog({ open, onSubmit, onCancel }) {
  const [form, setForm] = useState(EMPTY)

  useEffect(() => {
    if (open) setForm(EMPTY)
  }, [open])

  useEffect(() => {
    if (!open) return
    const onKey = (e) => e.key === 'Escape' && onCancel()
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onCancel])

  if (!open) return null

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))
  const valid =
    form.username.trim() && form.name.trim() && form.password.trim()

  return (
    <div className="modal-backdrop" onClick={onCancel}>
      <form
        className="modal"
        onClick={(e) => e.stopPropagation()}
        onSubmit={(e) => {
          e.preventDefault()
          if (valid) onSubmit(form)
        }}
      >
        <h2 className="modal-title">Tambah User</h2>

        <label className="modal-label" htmlFor="uf-username">
          Username
        </label>
        <input
          id="uf-username"
          className="modal-input"
          value={form.username}
          onChange={set('username')}
          autoFocus
        />

        <label className="modal-label" htmlFor="uf-name">
          Nama
        </label>
        <input
          id="uf-name"
          className="modal-input"
          value={form.name}
          onChange={set('name')}
        />

        <label className="modal-label" htmlFor="uf-email">
          Email
        </label>
        <input
          id="uf-email"
          className="modal-input"
          type="email"
          value={form.email}
          onChange={set('email')}
        />

        <label className="modal-label" htmlFor="uf-password">
          Password
        </label>
        <input
          id="uf-password"
          className="modal-input"
          type="password"
          value={form.password}
          onChange={set('password')}
        />

        <label className="modal-label" htmlFor="uf-role">
          Peran
        </label>
        <select
          id="uf-role"
          className="modal-input"
          value={form.role}
          onChange={set('role')}
        >
          <option value="user">User</option>
          <option value="admin">Admin</option>
        </select>

        <div className="modal-actions">
          <Button variant="ghost" type="button" onClick={onCancel}>
            Batal
          </Button>
          <Button variant="primary" type="submit" disabled={!valid}>
            Simpan
          </Button>
        </div>
      </form>
    </div>
  )
}

export default UserFormDialog
