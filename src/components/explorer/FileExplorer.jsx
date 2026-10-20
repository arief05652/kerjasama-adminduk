import { useState } from 'react'
import ExplorerToolbar from './ExplorerToolbar'
import FileList from './FileList'
import FileGrid from './FileGrid'
import './FileExplorer.css'

function FileExplorer({
  items,
  view,
  selectedId,
  clipboardId,
  hasSelection,
  canPaste,
  onViewChange,
  onSelect,
  onOpen,
  actions,
}) {
  const [dragging, setDragging] = useState(false)

  return (
    <div
      className={`fx ${dragging ? 'dragging' : ''}`}
      onDragOver={(e) => {
        e.preventDefault()
        setDragging(true)
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault()
        setDragging(false)
        actions.upload?.(e.dataTransfer.files)
      }}
    >
      <ExplorerToolbar
        hasSelection={hasSelection}
        canPaste={canPaste}
        view={view}
        onViewChange={onViewChange}
        actions={actions}
      />

      {items.length === 0 ? (
        <div className="fx-empty">Folder ini kosong.</div>
      ) : view === 'grid' ? (
        <FileGrid
          items={items}
          selectedId={selectedId}
          clipboardId={clipboardId}
          onSelect={onSelect}
          onOpen={onOpen}
        />
      ) : (
        <FileList
          items={items}
          selectedId={selectedId}
          clipboardId={clipboardId}
          onSelect={onSelect}
          onOpen={onOpen}
        />
      )}
    </div>
  )
}

export default FileExplorer
