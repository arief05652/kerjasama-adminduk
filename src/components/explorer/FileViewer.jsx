import { useEffect, useState } from 'react'
import { rawUrl } from '../../lib/api'
import { formatBytes } from '../../lib/format'
import './FileViewer.css'

const TEXT = new Set([
  'txt', 'md', 'log', 'json', 'csv', 'xml', 'yml', 'yaml', 'ini', 'conf',
  'html', 'css', 'js', 'jsx', 'ts', 'tsx',
])
const IMAGE = new Set(['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp', 'ico', 'svg'])
const VIDEO = new Set(['mp4', 'webm', 'ogg'])
const AUDIO = new Set(['mp3', 'wav', 'ogg'])

function extension(name) {
  const i = name.lastIndexOf('.')
  return i < 0 ? '' : name.slice(i + 1).toLowerCase()
}

function kindOf(name) {
  const ext = extension(name)
  if (ext === 'pdf') return 'pdf'
  if (IMAGE.has(ext)) return 'image'
  if (VIDEO.has(ext)) return 'video'
  if (AUDIO.has(ext)) return 'audio'
  if (TEXT.has(ext)) return 'text'
  return 'other'
}

function FileViewer({ file, onClose }) {
  const [text, setText] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!file) return
    const onKey = (e) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [file, onClose])

  useEffect(() => {
    if (!file || kindOf(file.name) !== 'text') return
    let active = true
    setText(null)
    setError(null)
    setLoading(true)
    fetch(rawUrl(file.id))
      .then((res) => {
        if (!res.ok) throw new Error('Gagal memuat isi file')
        return res.text()
      })
      .then((body) => active && setText(body))
      .catch((err) => active && setError(err.message))
      .finally(() => active && setLoading(false))
    return () => {
      active = false
    }
  }, [file])

  if (!file) return null

  const kind = kindOf(file.name)
  const url = rawUrl(file.id)

  function renderBody() {
    if (kind === 'pdf') {
      return <iframe className="viewer-frame" src={url} title={file.name} />
    }
    if (kind === 'image') {
      return <img className="viewer-image" src={url} alt={file.name} />
    }
    if (kind === 'video') {
      return <video className="viewer-media" src={url} controls />
    }
    if (kind === 'audio') {
      return <audio className="viewer-audio" src={url} controls />
    }
    if (kind === 'text') {
      if (loading) return <div className="viewer-note">Memuat…</div>
      if (error) return <div className="viewer-note error">{error}</div>
      return <pre className="viewer-text">{text}</pre>
    }
    return (
      <div className="viewer-note">
        <p>Pratinjau tidak tersedia untuk tipe ini.</p>
        <a className="viewer-link" href={url} target="_blank" rel="noreferrer">
          Buka di tab baru
        </a>
      </div>
    )
  }

  return (
    <div className="viewer-backdrop" onClick={onClose}>
      <div
        className="viewer"
        role="dialog"
        aria-modal="true"
        aria-label={`Pratinjau ${file.name}`}
        onClick={(e) => e.stopPropagation()}
      >
        <header className="viewer-head">
          <div className="viewer-title">
            <strong>{file.name}</strong>
            <span>{formatBytes(file.size)}</span>
          </div>
          <a
            className="viewer-open"
            href={url}
            target="_blank"
            rel="noreferrer"
          >
            Buka tab baru
          </a>
          <button
            className="viewer-close"
            onClick={onClose}
            aria-label="Tutup pratinjau"
          >
            ×
          </button>
        </header>

        <div className={`viewer-body viewer-${kind}`}>{renderBody()}</div>
      </div>
    </div>
  )
}

export default FileViewer
