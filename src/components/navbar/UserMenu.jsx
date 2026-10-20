import { useEffect, useRef, useState } from 'react'
import './UserMenu.css'

function UserMenu({ user, theme, onToggleTheme, onLogout }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  return (
    <div className="user" ref={ref}>
      <button
        className="user-btn"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <span className="avatar">{user.name.charAt(0).toUpperCase()}</span>
        <span className="user-name">{user.name}</span>
        <span className="caret">▾</span>
      </button>

      {open && (
        <div className="dropdown" role="menu">
          <div className="dropdown-head">
            <strong>{user.name}</strong>
            <span>{user.email}</span>
          </div>
          <button
            className="dropdown-item"
            onClick={onToggleTheme}
            role="menuitem"
          >
            {theme === 'dark' ? '☀️ Mode Terang' : '🌙 Mode Gelap'}
          </button>
          <button
            className="dropdown-item danger"
            onClick={onLogout}
            role="menuitem"
          >
            ⏻ Logout
          </button>
        </div>
      )}
    </div>
  )
}

export default UserMenu
