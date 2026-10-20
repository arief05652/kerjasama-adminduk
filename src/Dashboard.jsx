import { useEffect, useState } from 'react'
import Sidebar from './components/layout/Sidebar'
import Navbar from './components/layout/Navbar'
import ConfirmDialog from './components/common/ConfirmDialog'
import InputDialog from './components/common/InputDialog'
import FileExplorer from './components/explorer/FileExplorer'
import FileViewer from './components/explorer/FileViewer'
import ActiveUserPage from './components/pages/ActiveUserPage'
import NotifikasiPage from './components/pages/NotifikasiPage'
import LogAktivitasPage from './components/pages/LogAktivitasPage'
import { useTheme } from './hooks/useTheme'
import { useLocalStorage } from './hooks/useLocalStorage'
import { useFileSystem } from './hooks/useFileSystem'
import { useStorageUsage } from './hooks/useStorageUsage'
import { buildPeriodOptions, filterByPeriod, sortItems } from './lib/sort'
import './styles/layout.css'

const MENU = [
  { label: 'Beranda', href: '#' },
  { label: 'Active User', href: '#' },
  { label: 'Notifikasi', href: '#' },
  { label: 'Log Aktivitas', href: '#' },
]

function Dashboard({ user, onLogout }) {
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState('Beranda')
  const [query, setQuery] = useState('')
  const [confirmLogout, setConfirmLogout] = useState(false)
  const [input, setInput] = useState(null)
  const [preview, setPreview] = useState(null)

  const { theme, toggle } = useTheme()
  const [view, setView] = useLocalStorage('fx-view', 'grid')
  const [sort, setSort] = useLocalStorage('fx-sort', 'date-desc')
  const [period, setPeriod] = useState('')
  const fs = useFileSystem()
  const { usage, refresh: refreshUsage } = useStorageUsage()

  useEffect(() => {
    refreshUsage()
  }, [fs.tree, refreshUsage])

  const periodOptions = buildPeriodOptions(fs.items)
  const items = sortItems(
    filterByPeriod(fs.items, period).filter((c) =>
      c.name.toLowerCase().includes(query.toLowerCase()),
    ),
    sort,
  )

  const breadcrumb = active === 'Beranda' ? fs.breadcrumb : [active]

  function openItem(node) {
    if (node.type === 'folder') {
      fs.enter(node.id)
      setQuery('')
      setPeriod('')
    } else {
      setPreview(node)
    }
  }

  function navigateTo(index) {
    fs.navigateTo(index)
    setPeriod('')
  }

  function createFolder() {
    setInput({
      title: 'Folder Baru',
      label: 'Nama folder',
      initialValue: 'Folder Baru',
      confirmLabel: 'Buat',
      onSubmit: fs.addFolder,
    })
  }

  function createFile() {
    setInput({
      title: 'File Baru',
      label: 'Nama file',
      initialValue: 'Dokumen Baru.txt',
      confirmLabel: 'Buat',
      onSubmit: fs.addFile,
    })
  }

  function rename() {
    const node = fs.selectedNode
    if (!node) return
    setInput({
      title: 'Ubah Nama',
      label: 'Nama baru',
      initialValue: node.name,
      confirmLabel: 'Simpan',
      onSubmit: (name) => name !== node.name && fs.renameSelected(name),
    })
  }

  function selectMenu(label) {
    setActive(label)
    fs.goRoot()
    setQuery('')
    setPeriod('')
  }

  const actions = {
    createFolder,
    createFile,
    upload: fs.uploadFiles,
    rename,
    delete: fs.requestDelete,
    copy: fs.copy,
    cut: fs.cut,
    paste: fs.paste,
  }

  return (
    <div className="layout">
      <Sidebar
        items={MENU}
        open={open}
        onClose={() => setOpen(false)}
        active={active}
        onSelect={selectMenu}
        usage={usage}
      />

      <div className="content">
        <Navbar
          user={user}
          theme={theme}
          onToggleTheme={toggle}
          onLogout={() => setConfirmLogout(true)}
          onMenu={() => setOpen(true)}
          breadcrumb={breadcrumb}
          onNavigate={navigateTo}
          query={query}
          onQueryChange={setQuery}
          showSearch={active === 'Beranda'}
        />

        <main className="main">
          {active === 'Beranda' ? (
            fs.loading && !fs.tree ? (
              <p className="main-status">Memuat storage…</p>
            ) : (
              <FileExplorer
                items={items}
                view={view}
                selectedId={fs.selected}
                clipboardId={fs.clipboard?.id}
                hasSelection={!!fs.selected}
                canPaste={!!fs.clipboard}
                onViewChange={setView}
                sort={sort}
                onSortChange={setSort}
                period={period}
                onPeriodChange={setPeriod}
                periodOptions={periodOptions}
                onSelect={fs.setSelected}
                onOpen={openItem}
                actions={actions}
              />
            )
          ) : active === 'Active User' ? (
            <ActiveUserPage />
          ) : active === 'Log Aktivitas' ? (
            <LogAktivitasPage />
          ) : (
            <NotifikasiPage />
          )}
        </main>
      </div>

      <InputDialog
        open={!!input}
        title={input?.title}
        label={input?.label}
        initialValue={input?.initialValue}
        confirmLabel={input?.confirmLabel}
        onSubmit={(name) => {
          input.onSubmit(name)
          setInput(null)
        }}
        onCancel={() => setInput(null)}
      />

      <FileViewer file={preview} onClose={() => setPreview(null)} />

      <ConfirmDialog
        open={!!fs.error}
        title="Terjadi Kesalahan"
        message={fs.error}
        confirmLabel="Tutup"
        hideCancel
        onConfirm={fs.clearError}
        onCancel={fs.clearError}
      />

      <ConfirmDialog
        open={confirmLogout}
        title="Konfirmasi Logout"
        message="Yakin ingin keluar dari akun ini?"
        confirmLabel="Logout"
        danger
        onConfirm={() => {
          setConfirmLogout(false)
          onLogout()
        }}
        onCancel={() => setConfirmLogout(false)}
      />

      <ConfirmDialog
        open={!!fs.pendingNode}
        title="Hapus item"
        message={`Yakin ingin menghapus "${fs.pendingNode?.name ?? ''}"?`}
        confirmLabel="Hapus"
        danger
        onConfirm={fs.confirmDelete}
        onCancel={fs.cancelDelete}
      />
    </div>
  )
}

export default Dashboard
