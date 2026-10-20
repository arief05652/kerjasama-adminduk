import './ViewToggle.css'

function ViewIcon({ mode }) {
  if (mode === 'grid') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </svg>
    )
  }
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <line x1="4" y1="6" x2="20" y2="6" />
      <line x1="4" y1="12" x2="20" y2="12" />
      <line x1="4" y1="18" x2="20" y2="18" />
    </svg>
  )
}

function ViewToggle({ view, onChange }) {
  return (
    <div className="fx-view" role="group" aria-label="Tampilan">
      <button
        type="button"
        className={`fx-view-btn ${view === 'grid' ? 'active' : ''}`}
        onClick={() => onChange('grid')}
        aria-label="Tampilan kisi"
        aria-pressed={view === 'grid'}
      >
        <ViewIcon mode="grid" />
      </button>
      <button
        type="button"
        className={`fx-view-btn ${view === 'list' ? 'active' : ''}`}
        onClick={() => onChange('list')}
        aria-label="Tampilan daftar"
        aria-pressed={view === 'list'}
      >
        <ViewIcon mode="list" />
      </button>
    </div>
  )
}

export default ViewToggle
