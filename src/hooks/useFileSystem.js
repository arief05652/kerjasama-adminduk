import { useCallback, useEffect, useMemo, useState } from 'react'
import { ROOT_ID, findNode, getPath } from '../lib/fileSystem'
import * as api from '../lib/api'

export function useFileSystem() {
  const [tree, setTree] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [pathIds, setPathIds] = useState([ROOT_ID])
  const [selected, setSelected] = useState(null)
  const [clipboard, setClipboard] = useState(null)
  const [pendingDelete, setPendingDelete] = useState(null)

  const reload = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setLoading(true)
    try {
      setTree(await api.fetchTree())
      setError(null)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    reload()
  }, [reload])

  // Sinkron realtime: muat ulang saat server mengirim event perubahan file
  useEffect(() => {
    return api.subscribe((type) => {
      if (type === 'fs') reload({ silent: true })
    })
  }, [reload])

  const pathNodes = useMemo(() => {
    if (!tree) return []
    return getPath(tree, pathIds[pathIds.length - 1]) ?? [tree]
  }, [tree, pathIds])

  const breadcrumb = pathNodes.map((n) => n.name)
  const current = pathNodes[pathNodes.length - 1]
  const items = current?.children ?? []

  // Jalankan operasi ke server lalu muat ulang tree
  async function run(operation, after) {
    try {
      await operation()
      if (after) after()
      await reload()
    } catch (err) {
      setError(err.message)
    }
  }

  function enter(id) {
    setPathIds((p) => [...p, id])
    setSelected(null)
  }

  function navigateTo(index) {
    setPathIds((p) => p.slice(0, index + 1))
    setSelected(null)
  }

  function goRoot() {
    setPathIds([ROOT_ID])
    setSelected(null)
  }

  const addFolder = (name) =>
    run(() => api.createEntry(current.id, name, 'folder'))

  const addFile = (name) => run(() => api.createEntry(current.id, name, 'file'))

  async function uploadFiles(fileList) {
    const files = Array.from(fileList ?? [])
    if (!files.length) return
    try {
      for (const file of files) await api.uploadFile(current.id, file)
      await reload()
    } catch (err) {
      setError(err.message)
    }
  }

  const renameSelected = (name) =>
    run(() => api.renameEntry(selected, name), () => setSelected(null))

  function requestDelete() {
    if (selected) setPendingDelete(selected)
  }

  function confirmDelete() {
    const target = pendingDelete
    setPendingDelete(null)
    if (!target) return
    run(() => api.deleteEntry(target), () => setSelected(null))
  }

  const paste = () => {
    if (!clipboard) return
    const action = clipboard.mode === 'cut' ? api.moveEntry : api.copyEntry
    run(
      () => action(clipboard.id, current.id),
      () => {
        if (clipboard.mode === 'cut') setClipboard(null)
      },
    )
  }

  return {
    tree,
    loading,
    error,
    clearError: () => setError(null),
    current,
    items,
    breadcrumb,
    selected,
    selectedNode: findNode(tree, selected),
    clipboard,
    pendingNode: findNode(tree, pendingDelete),
    setSelected,
    enter,
    navigateTo,
    goRoot,
    addFolder,
    addFile,
    uploadFiles,
    renameSelected,
    requestDelete,
    confirmDelete,
    cancelDelete: () => setPendingDelete(null),
    copy: () => selected && setClipboard({ mode: 'copy', id: selected }),
    cut: () => selected && setClipboard({ mode: 'cut', id: selected }),
    paste,
    reload,
  }
}
