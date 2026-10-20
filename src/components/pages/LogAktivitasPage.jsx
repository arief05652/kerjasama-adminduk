import { useCallback, useEffect, useState } from 'react'
import { fetchLogs } from '../../lib/adminApi'
import { subscribe } from '../../lib/api'
import { formatDateTime } from '../../lib/format'
import './pages.css'

const LABELS = {
  'folder.create': 'Buat folder',
  'file.create': 'Buat file',
  'file.rename': 'Ubah nama',
  'file.delete': 'Hapus',
  'file.move': 'Pindah',
  'file.copy': 'Salin',
  'file.upload': 'Upload',
  'user.create': 'Tambah user',
  'user.force-logout': 'Logout paksa',
  'user.activate': 'Aktifkan user',
  'user.deactivate': 'Nonaktifkan user',
  seed: 'Inisialisasi',
}

const label = (action) => LABELS[action] || action

function LogAktivitasPage() {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = useCallback(() => {
    setLoading(true)
    return fetchLogs(200)
      .then(setLogs)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    load()
  }, [load])

  // Sinkron realtime: muat ulang log saat ada aktivitas baru
  useEffect(() => subscribe((type) => type === 'logs' && load()), [load])

  return (
    <section className="page">
      <header className="page-head">
        <h2>Log Aktivitas</h2>
        <p>Riwayat tindakan yang dilakukan pengguna pada sistem.</p>
      </header>

      {error && <div className="page-error">{error}</div>}

      <div className="table">
        <div className="table-head log-grid">
          <span>Waktu</span>
          <span>Pengguna</span>
          <span>Aksi</span>
          <span>Detail</span>
        </div>
        <ul className="table-list">
          {loading ? (
            <li className="table-row log-grid">
              <span className="cell-muted">Memuat…</span>
            </li>
          ) : logs.length === 0 ? (
            <li className="table-row log-grid">
              <span className="cell-muted">Belum ada aktivitas.</span>
            </li>
          ) : (
            logs.map((log) => (
              <li key={log.id} className="table-row log-grid">
                <span className="cell-muted">{formatDateTime(log.created_at)}</span>
                <span className="cell-strong">{log.username || 'sistem'}</span>
                <span>{label(log.action)}</span>
                <span className="cell-muted">{log.detail || '—'}</span>
              </li>
            ))
          )}
        </ul>
      </div>
    </section>
  )
}

export default LogAktivitasPage
