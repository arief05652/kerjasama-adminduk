import { formatSize, fileIcon } from '../../lib/format'
import { itemClass } from './explorerUtils'
import './FileGrid.css'

function FileGrid({ items, selectedId, clipboardId, onSelect, onOpen }) {
  return (
    <div className="fx-grid">
      {items.map((item) => (
        <button
          type="button"
          key={item.id}
          className={`fx-card${itemClass(item, selectedId, clipboardId)}`}
          onClick={() => onSelect(item.id)}
          onDoubleClick={() => onOpen(item)}
        >
          <span className="fx-card-icon">{fileIcon(item)}</span>
          <span className="fx-card-name">{item.name}</span>
          <span className="fx-card-meta">
            {item.type === 'folder' ? 'Folder' : formatSize(item)}
          </span>
        </button>
      ))}
    </div>
  )
}

export default FileGrid
