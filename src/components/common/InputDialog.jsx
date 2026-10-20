import { useEffect, useState } from 'react'
import Button from './Button'
import './Modal.css'

function InputDialog({
  open,
  title,
  label,
  initialValue = '',
  confirmLabel = 'Simpan',
  onSubmit,
  onCancel,
}) {
  const [value, setValue] = useState(initialValue)

  useEffect(() => {
    if (open) setValue(initialValue)
  }, [open, initialValue])

  useEffect(() => {
    if (!open) return
    const onKey = (e) => e.key === 'Escape' && onCancel?.()
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onCancel])

  if (!open) return null

  const trimmed = value.trim()

  return (
    <div className="modal-backdrop" onClick={onCancel}>
      <form
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
        onSubmit={(e) => {
          e.preventDefault()
          if (trimmed) onSubmit(trimmed)
        }}
      >
        <h2 className="modal-title">{title}</h2>
        {label && (
          <label className="modal-label" htmlFor="dialog-input">
            {label}
          </label>
        )}
        <input
          id="dialog-input"
          className="modal-input"
          value={value}
          autoFocus
          onChange={(e) => setValue(e.target.value)}
        />
        <div className="modal-actions">
          <Button variant="ghost" type="button" onClick={onCancel}>
            Batal
          </Button>
          <Button variant="primary" type="submit" disabled={!trimmed}>
            {confirmLabel}
          </Button>
        </div>
      </form>
    </div>
  )
}

export default InputDialog
