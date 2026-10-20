import StorageUsage from './StorageUsage'
import './Sidebar.css'

function Sidebar({ items, open, onClose, active, onSelect, usage }) {
  return (
    <>
      <aside className={`sidebar ${open ? 'open' : ''}`}>
        <div className="sidebar-brand">kerjasama - adminduk</div>
        <nav>
          <ul>
            {items.map((item) => (
              <li key={item.label}>
                <a
                  href={item.href}
                  className={active === item.label ? 'active' : ''}
                  onClick={(e) => {
                    e.preventDefault()
                    onSelect?.(item.label)
                    onClose()
                  }}
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <StorageUsage usage={usage} />
      </aside>

      {open && (
        <div className="backdrop" onClick={onClose} aria-hidden="true" />
      )}
    </>
  )
}

export default Sidebar
