import { useEffect } from 'react'
import { X } from 'lucide-react'
import { Button } from './Button'
import './Modal.css'

export function Modal({ open, onClose, title, footer, children }) {
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  if (!open) return null

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        {/* Header fijo */}
        <div className="modal-header">
          {title && <h2 className="title-section">{title}</h2>}
          <Button variant="ghost" size="sm" onClick={onClose} style={{ marginLeft: 'auto', flexShrink: 0 }}>
            <X size={20} />
          </Button>
        </div>

        {/* Contenido scrollable */}
        <div className="modal-body">
          {children}
        </div>

        {/* Footer fijo — solo si se pasa */}
        {footer && (
          <div className="modal-footer">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}
