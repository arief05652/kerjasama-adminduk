import { formatDate, formatSize, typeLabel, fileIcon } from '../../lib/format'
import { itemClass } from './explorerUtils'
import './FileList.css'

function FileList({ items, selectedId, clipboardId, onSelect, onOpen }) {
  return (
    <>
      <div className="fx-head">
        <span>Nama</span>
        <span>Tanggal diubah</span>
        <span>Jenis</span>
        <span>Ukuran</span>
      </div>
      <ul className="fx-list">
        {items.map((item) => (
          <li
            key={item.id}
            className={`fx-row${itemClass(item, selectedId, clipboardId)}`}
            onClick={() => onSelect(item.id)}
            onDoubleClick={() => onOpen(item)}
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter') onOpen(item)
            }}
          >
            <span className="fx-name">
              <span className="fx-icon">{fileIcon(item)}</span>
              {item.name}
            </span>
            <span className="fx-date">{formatDate(item.modified)}</span>
            <span className="fx-type">{typeLabel(item)}</span>
            <span className="fx-size">{formatSize(item)}</span>
          </li>
        ))}
      </ul>
    </>
  )
}

export default FileList
