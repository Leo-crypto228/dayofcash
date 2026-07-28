import { useEffect } from 'react'
import { Close } from './icons.jsx'

export default function Modal({ open, title, onClose, children }) {
  useEffect(() => {
    if (!open) return
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null
  return (
    <div className="modal-scrim" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-head">
          <h3>{title}</h3>
          <button className="icon-btn" aria-label="Fermer" onClick={onClose}>
            <Close />
          </button>
        </div>
        <div className="sheet-body">{children}</div>
      </div>
    </div>
  )
}
