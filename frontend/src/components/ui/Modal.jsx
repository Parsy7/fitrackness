import { useEffect } from 'react'
import { X } from 'lucide-react'
import { Button } from './Button'

export function Modal({ open, onClose, title, children }) {
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  if (!open) return null

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="row row--between">
          {title && <h2 className="title-section">{title}</h2>}
          <Button variant="ghost" size="sm" onClick={onClose} style={{ marginLeft: 'auto' }}>
            <X size={20} />
          </Button>
        </div>
        {children}
      </div>
    </div>
  )
}
