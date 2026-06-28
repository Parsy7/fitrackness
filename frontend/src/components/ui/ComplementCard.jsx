import { useState } from 'react'
import { Pill } from './index'
import { Input } from './Form'
import { Button } from './Button'
import { CheckCircle, Circle } from 'lucide-react'
import './ComplementCard.css'

export function ComplementCard({ complement, sessionId, onRegister, readOnly = false }) {
  const [done, setDone]           = useState(complement.session_done ?? false)
  const [observations, setObs]    = useState(complement.session_observations ?? '')
  const [saving, setSaving]       = useState(false)

  const toggle = async () => {
    if (readOnly) return
    const newDone = !done
    setDone(newDone)
    if (onRegister) {
      setSaving(true)
      await onRegister(complement.id, newDone, observations)
      setSaving(false)
    }
  }

  const saveObs = async () => {
    if (onRegister) {
      setSaving(true)
      await onRegister(complement.id, done, observations)
      setSaving(false)
    }
  }

  return (
    <div className={`complement-card ${done ? 'complement-card--done' : ''}`}>
      <div className="complement-header">
        <div className="col" style={{ gap: 4, flex: 1 }}>
          <div className="row" style={{ gap: 'var(--gap-sm)', flexWrap: 'wrap' }}>
            <Pill variant="warning">{complement.methodology}</Pill>
            {complement.parameter && <span className="label">{complement.parameter}</span>}
          </div>
          {complement.notes && <p className="caption text-muted">{complement.notes}</p>}
        </div>
        {!readOnly && (
          <button className="complement-toggle" onClick={toggle} disabled={saving}>
            {done
              ? <CheckCircle size={28} style={{ color: 'var(--color-success)' }} />
              : <Circle size={28} style={{ color: 'var(--color-text-muted)' }} />
            }
          </button>
        )}
        {readOnly && (
          done
            ? <CheckCircle size={22} style={{ color: 'var(--color-success)' }} />
            : <Circle size={22} style={{ color: 'var(--color-text-muted)' }} />
        )}
      </div>

      {/* Ejercicios del complemento */}
      {complement.exercises?.length > 0 && (
        <div className="complement-exercises">
          {complement.exercises.map((ex, i) => (
            <div key={i} className="complement-ex-row">
              <span className="caption" style={{ color: 'var(--color-warning)', flexShrink: 0 }}>{ex.reps || '—'}</span>
              <span className="label">{ex.canonical_name}</span>
              {ex.notes && <span className="caption text-muted">{ex.notes}</span>}
            </div>
          ))}
        </div>
      )}

      {/* Observaciones — solo si está en sesión activa */}
      {!readOnly && sessionId && (
        <div className="complement-obs">
          <Input
            value={observations}
            onChange={e => setObs(e.target.value)}
            placeholder="Observaciones... ej: No pude acabar, llegué a 2 rondas"
            onBlur={saveObs}
          />
        </div>
      )}

      {/* Observaciones en modo lectura */}
      {readOnly && complement.session_observations && (
        <p className="caption text-muted" style={{ fontStyle: 'italic' }}>"{complement.session_observations}"</p>
      )}
    </div>
  )
}
