import { useState } from 'react'
import Button from '../common/Button'
import './LoginPage.css'

function LoginPage({ onLogin }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)

  async function submit(e) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      await onLogin(username, password)
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="login">
      <form className="login-card" onSubmit={submit}>
        <h1 className="login-brand">kerjasama - adminduk</h1>
        <p className="login-sub">Masuk untuk mengelola kerjasama</p>

        {error && <div className="login-error">{error}</div>}

        <label className="login-label" htmlFor="login-username">
          Username
        </label>
        <input
          id="login-username"
          className="login-input"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          autoFocus
          autoComplete="username"
        />

        <label className="login-label" htmlFor="login-password">
          Password
        </label>
        <input
          id="login-password"
          className="login-input"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
        />

        <Button
          variant="primary"
          type="submit"
          className="login-submit"
          disabled={busy || !username || !password}
        >
          {busy ? 'Memproses…' : 'Masuk'}
        </Button>

        <p className="login-hint">
          Admin default: <code>admin</code> / <code>admin123</code>
        </p>
      </form>
    </div>
  )
}

export default LoginPage
