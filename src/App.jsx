import LoginPage from './components/pages/LoginPage'
import Dashboard from './Dashboard'
import { useAuth } from './hooks/useAuth'

function App() {
  const { user, loading, login, logout } = useAuth()

  if (loading) {
    return <div className="app-loading">Memuat…</div>
  }

  if (!user) {
    return <LoginPage onLogin={login} />
  }

  return <Dashboard user={user} onLogout={logout} />
}

export default App
