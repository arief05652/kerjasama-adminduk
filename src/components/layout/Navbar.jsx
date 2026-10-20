import Breadcrumb from '../navbar/Breadcrumb'
import SearchBar from '../navbar/SearchBar'
import UserMenu from '../navbar/UserMenu'
import './Navbar.css'

function Navbar({
  user,
  theme,
  onToggleTheme,
  onLogout,
  onMenu,
  breadcrumb,
  onNavigate,
  query,
  onQueryChange,
  showSearch = true,
}) {
  return (
    <header className="topbar">
      <div className="topbar-left">
        <button
          className="hamburger"
          aria-label="Buka menu"
          onClick={onMenu}
        >
          ☰
        </button>
        <Breadcrumb items={breadcrumb} onNavigate={onNavigate} />
      </div>

      {showSearch && <SearchBar value={query} onChange={onQueryChange} />}

      <UserMenu
        user={user}
        theme={theme}
        onToggleTheme={onToggleTheme}
        onLogout={onLogout}
      />
    </header>
  )
}

export default Navbar
