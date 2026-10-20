import './Breadcrumb.css'

function Breadcrumb({ items = [], onNavigate }) {
  return (
    <nav className="breadcrumb" aria-label="Breadcrumb">
      {items.map((label, i) => {
        const last = i === items.length - 1
        return (
          <span className="crumb" key={`${i}-${label}`}>
            {i > 0 && (
              <span className="sep" aria-hidden="true">
                ›
              </span>
            )}
            {last ? (
              <span className="crumb-current" aria-current="page">
                {label}
              </span>
            ) : (
              <button
                type="button"
                className="crumb-link"
                onClick={() => onNavigate?.(i)}
              >
                {label}
              </button>
            )}
          </span>
        )
      })}
    </nav>
  )
}

export default Breadcrumb
