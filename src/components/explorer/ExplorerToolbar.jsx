import { useRef } from 'react'
import Button from '../common/Button'
import ViewToggle from './ViewToggle'
import './ExplorerToolbar.css'

function ExplorerToolbar({
  hasSelection,
  canPaste,
  view,
  onViewChange,
  actions,
}) {
  const fileInput = useRef(null)

  return (
    <div className="fx-toolbar">
      <Button variant="toolbar" onClick={actions.createFolder}>
        📁 Folder Baru
      </Button>
      <Button variant="toolbar" onClick={actions.createFile}>
        📄 File Baru
      </Button>
      <Button variant="toolbar" onClick={() => fileInput.current?.click()}>
        ⬆️ Upload
      </Button>
      <input
        ref={fileInput}
        type="file"
        multiple
        hidden
        onChange={(e) => {
          actions.upload(e.target.files)
          e.target.value = ''
        }}
      />
      <span className="fx-sep" />
      <Button
        variant="toolbar"
        onClick={actions.copy}
        disabled={!hasSelection}
      >
        Salin
      </Button>
      <Button variant="toolbar" onClick={actions.cut} disabled={!hasSelection}>
        Potong
      </Button>
      <Button variant="toolbar" onClick={actions.paste} disabled={!canPaste}>
        Tempel
      </Button>
      <span className="fx-sep" />
      <Button
        variant="toolbar"
        onClick={actions.rename}
        disabled={!hasSelection}
      >
        Ubah Nama
      </Button>
      <Button
        variant="toolbar-danger"
        onClick={actions.delete}
        disabled={!hasSelection}
      >
        Hapus
      </Button>

      <ViewToggle view={view} onChange={onViewChange} />
    </div>
  )
}

export default ExplorerToolbar
