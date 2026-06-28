import { useState, useEffect, useRef, useCallback } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { api } from '../../utils/api'
import { Button } from '../../components/ui/Button'
import { Card, Pill, Alert, Divider } from '../../components/ui/index'
import { Input } from '../../components/ui/Form'
import {
  CheckCircle2, XCircle, Circle, ChevronRight, ArrowLeft,
  Timer, Pause, Play, RotateCcw, Dumbbell, Trophy, X
} from 'lucide-react'
import './ActiveSession.css'

import './ActiveSession.css'

// ─── Constantes de estado ────────────────────────────────────────────────────
const STATUS = { PENDING: 'pending', ACTIVE: 'active', DONE: 'done' }
const VIEW   = { LIST: 'list', EXERCISE: 'exercise', SUMMARY: 'summary' }

// ─── Hook: cronómetro general ─────────────────────────────────────────────────
function useStopwatch(active = true) {
  const [seconds, setSeconds] = useState(0)
  const ref = useRef(null)

  useEffect(() => {
    if (!active) return
    ref.current = setInterval(() => setSeconds(s => s + 1), 1000)
    return () => clearInterval(ref.current)
  }, [active])

  const fmt = (s) => {
    const h = Math.floor(s / 3600)
    const m = Math.floor((s % 3600) / 60)
    const ss = s % 60
    if (h > 0) return `${h}:${String(m).padStart(2,'0')}:${String(ss).padStart(2,'0')}`
    return `${String(m).padStart(2,'0')}:${String(ss).padStart(2,'0')}`
  }

  return { seconds, display: fmt(seconds) }
}

// ─── Hook: contador de descanso manual ───────────────────────────────────────
function useRestTimer() {
  const [active, setActive]   = useState(false)
  const [seconds, setSeconds] = useState(0)
  const ref = useRef(null)

  const start = useCallback((initial = 0) => {
    setSeconds(initial)
    setActive(true)
  }, [])

  const pause = useCallback(() => setActive(false), [])
  const resume = useCallback(() => setActive(true), [])
  const reset = useCallback(() => { setActive(false); setSeconds(0) }, [])

  useEffect(() => {
    if (!active) { clearInterval(ref.current); return }
    ref.current = setInterval(() => setSeconds(s => s + 1), 1000)
    return () => clearInterval(ref.current)
  }, [active])

  const fmt = (s) => {
    const m = Math.floor(s / 60)
    const ss = s % 60
    return `${String(m).padStart(2,'0')}:${String(ss).padStart(2,'0')}`
  }

  return { active, seconds, display: fmt(seconds), start, pause, resume, reset }
}

// ─── Componente: fila de ejercicio en la lista ────────────────────────────────
function ExerciseRow({ ex, index, onClick }) {
  const icon = ex.status === STATUS.DONE
    ? <CheckCircle2 size={22} className="ex-icon ex-icon--done" />
    : ex.status === STATUS.ACTIVE
      ? <Circle size={22} className="ex-icon ex-icon--active" />
      : <Circle size={22} className="ex-icon ex-icon--pending" />

  return (
    <button className={`ex-row ${ex.status === STATUS.DONE ? 'ex-row--done' : ''}`} onClick={onClick}>
      <div className="row" style={{ gap: 'var(--gap-md)' }}>
        {icon}
        <div className="col" style={{ gap: 2, flex: 1, alignItems: 'flex-start' }}>
          <span className="ex-row__name">{ex.canonical_name}</span>
          {ex.recommended_sets && (
            <span className="caption">
              {ex.recommended_sets} series · {ex.recommended_reps} reps
              {ex.recommended_rest ? ` · ${ex.recommended_rest}s descanso` : ''}
            </span>
          )}
        </div>
        {ex.status !== STATUS.DONE && (
          <ChevronRight size={18} className="text-muted" />
        )}
      </div>
      {ex.status === STATUS.DONE && ex.sets.length > 0 && (
        <div className="ex-row__summary">
          {ex.sets.map((s, i) => (
            s.weight_kg
              ? <span key={i} className="pill pill-muted">S{i+1}: {s.weight_kg}kg × {s.reps}</span>
              : null
          ))}
        </div>
      )}
    </button>
  )
}

// ─── Vista: ejercicio activo ──────────────────────────────────────────────────
function ExerciseView({ ex, onBack, onDone, rest }) {
  const numSets = parseInt(ex.recommended_sets) || 3
  const [sets, setSets] = useState(() =>
    Array.from({ length: numSets }, (_, i) => ({
      reps:      ex.recommended_reps || '',
      weight_kg: ex.lastWeight ?? '',
      done:      false,
    }))
  )
  const [restingAfter, setRestingAfter] = useState(null)
  const [infoOpen,     setInfoOpen]     = useState(false)
  const [detail,       setDetail]       = useState(null)

  // Carga el detalle completo del ejercicio (descripción, grupo muscular, media…)
  useEffect(() => {
    api.get(`/exercises/${ex.exercise_id}`)
      .then(data => setDetail(data))
      .catch(() => {})
  }, [ex.exercise_id])

  const updateSet = (i, field, val) =>
    setSets(prev => prev.map((s, idx) => idx === i ? { ...s, [field]: val } : s))

  const markSetDone = (i) => {
    updateSet(i, 'done', true)
    setRestingAfter(i)
    rest.start(0)
  }

  const handleDone = () => {
    rest.reset()
    onDone(sets)
  }

  const doneSets  = sets.filter(s => s.done).length
  const allDone   = doneSets === sets.length

  return (
    <div className="active-view slide-in">
      {/* Cabecera: volver | título + ? */}
      <button className="btn btn-ghost btn--sm" style={{ alignSelf: 'flex-start' }} onClick={onBack}>
        <ArrowLeft size={18} /> Volver
      </button>

      <div className="exercise-titlebar">
        <div className="col" style={{ gap: 2, flex: 1 }}>
          <h2 className="title-section">{ex.canonical_name}</h2>
          {ex.recommended_sets && (
            <p className="caption">
              Plan: {ex.recommended_sets}×{ex.recommended_reps}
              {ex.recommended_rest ? ` · ${ex.recommended_rest}s descanso` : ''}
            </p>
          )}
        </div>
        {detail && (detail.description || detail.muscle_group || detail.equipment || detail.media?.length > 0) && (
          <button className="ex-help-btn" onClick={() => setInfoOpen(true)} type="button">
            Ayuda
          </button>
        )}
      </div>

      {/* Último peso */}
      {ex.lastWeight != null && (
        <div className="last-weight-banner">
          <Dumbbell size={16} />
          <span>Última vez: <strong>{ex.lastWeight} kg</strong>
            {ex.lastDate ? ` · ${new Date(ex.lastDate).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}` : ''}
          </span>
        </div>
      )}

      {/* Series */}
      <div className="sets-list">
        {sets.map((s, i) => (
          <div key={i} className={`set-row ${s.done ? 'set-row--done' : ''}`}>
            <span className="set-num">S{i + 1}</span>
            <div className="set-inputs">
              <div className="set-field">
                <label className="form-label">Peso (kg)</label>
                <Input
                  type="number"
                  value={s.weight_kg}
                  onChange={e => updateSet(i, 'weight_kg', e.target.value)}
                  placeholder="0"
                  step="0.5"
                />
              </div>
              <div className="set-field">
                <label className="form-label">Reps</label>
                <Input
                  value={s.reps}
                  onChange={e => updateSet(i, 'reps', e.target.value)}
                  placeholder={ex.recommended_reps || '—'}
                />
              </div>
            </div>
            <button
              className={`set-done-icon ${s.done ? 'set-done-icon--done' : ''}`}
              onClick={() => s.done ? updateSet(i, 'done', false) : markSetDone(i)}
              type="button"
              aria-label={s.done ? 'Desmarcar serie' : 'Marcar serie hecha'}
            >
              <CheckCircle2 size={26} />
            </button>
          </div>
        ))}
      </div>

      {/* Modal: cómo se hace */}
      {infoOpen && detail && (
        <div className="ex-help-overlay" onClick={() => setInfoOpen(false)}>
          <div className="ex-help-modal" onClick={e => e.stopPropagation()}>
            <div className="ex-help-modal__header">
              <h3 className="title-section">{ex.canonical_name}</h3>
              <button className="btn btn-ghost btn--sm" onClick={() => setInfoOpen(false)} type="button">
                <X size={20} />
              </button>
            </div>
            {(detail.muscle_group || detail.equipment) && (
              <div className="row" style={{ flexWrap: 'wrap', gap: 'var(--gap-sm)' }}>
                {detail.muscle_group && <span className="pill pill-muted">{detail.muscle_group}</span>}
                {detail.equipment    && <span className="pill pill-muted">{detail.equipment}</span>}
              </div>
            )}
            {detail.description && (
              <p className="body-text">{detail.description}</p>
            )}
            {detail.media?.length > 0 && (
              <div className="ex-media-grid">
                {detail.media.map((m, i) =>
                  m.type === 'photo' ? (
                    <img key={i} src={m.url} alt={m.caption || ex.canonical_name} className="ex-media-img" />
                  ) : (
                    <video key={i} src={m.url} controls playsInline className="ex-media-img" />
                  )
                )}
              </div>
            )}
            <button className="btn btn-secondary btn--full" onClick={() => setInfoOpen(false)} type="button">
              Cerrar
            </button>
          </div>
        </div>
      )}

      {/* Contador de descanso */}
      {restingAfter !== null && (
        <div className="rest-panel">
          <div className="rest-panel__top">
            <Timer size={16} className="text-primary" />
            <span className="label text-primary">Descanso</span>
            <span className="rest-display">{rest.display}</span>
          </div>
          <div className="row" style={{ justifyContent: 'center', gap: 'var(--gap-md)' }}>
            {rest.active
              ? <button className="btn btn-ghost btn--sm" onClick={rest.pause}><Pause size={16} /> Pausar</button>
              : <button className="btn btn-ghost btn--sm" onClick={rest.resume}><Play size={16} /> Reanudar</button>
            }
            <button className="btn btn-ghost btn--sm" onClick={() => { rest.reset(); setRestingAfter(null) }}>
              <RotateCcw size={16} /> Resetear
            </button>
          </div>
        </div>
      )}

      <p className="caption text-muted" style={{ textAlign: 'center' }}>
        {doneSets} de {sets.length} series completadas
      </p>

      <Button full size="lg" onClick={handleDone} variant={allDone ? 'success' : 'secondary'}>
        {allDone ? '✅ Ejercicio completado' : 'Marcar como terminado'}
      </Button>
    </div>
  )
}

// ─── Vista: complementos ──────────────────────────────────────────────────────
function ComplementsView({ complements, onDone }) {
  const [states, setStates] = useState(() =>
    complements.map(c => ({ id: c.id, done: null, observations: '' }))
  )

  const setComp = (i, field, val) =>
    setStates(prev => prev.map((s, idx) => idx === i ? { ...s, [field]: val } : s))

  return (
    <div className="active-view slide-in">
      <h2 className="title-section">Complementos</h2>
      <p className="caption text-muted">Marca los complementos del entreno de hoy</p>

      <div className="col col--gap-md">
        {complements.map((c, i) => (
          <Card key={c.id}>
            <p className="label">{c.name}</p>
            {c.description && <p className="caption">{c.description}</p>}
            <div className="row" style={{ gap: 'var(--gap-sm)' }}>
              <button
                className={`btn btn--sm ${states[i].done === true ? 'btn-success' : 'btn-ghost'}`}
                onClick={() => setComp(i, 'done', true)}
              >
                ✓ Hecho
              </button>
              <button
                className={`btn btn--sm ${states[i].done === false ? 'btn-danger' : 'btn-ghost'}`}
                onClick={() => setComp(i, 'done', false)}
              >
                ✗ No hecho
              </button>
            </div>
            {states[i].done != null && (
              <Input
                placeholder="Observaciones opcionales…"
                value={states[i].observations}
                onChange={e => setComp(i, 'observations', e.target.value)}
              />
            )}
          </Card>
        ))}
      </div>

      <Button full size="lg" onClick={() => onDone(states)}>
        Finalizar entrenamiento →
      </Button>
    </div>
  )
}

// ─── Vista: resumen ───────────────────────────────────────────────────────────
function SummaryView({ exercises, totalTime, onClose }) {
  const done     = exercises.filter(e => e.status === STATUS.DONE)
  const skipped  = exercises.filter(e => e.status !== STATUS.DONE)
  const totalSets = done.reduce((acc, e) => acc + e.sets.filter(s => s.done).length, 0)

  return (
    <div className="active-view slide-in">
      <div className="summary-trophy">
        <Trophy size={48} className="text-primary" />
      </div>
      <h1 className="title-page" style={{ textAlign: 'center' }}>¡Entreno completado!</h1>
      <p className="caption text-muted" style={{ textAlign: 'center' }}>
        {new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
      </p>

      <div className="summary-stats">
        <div className="stat-box">
          <span className="stat-value">{totalTime}</span>
          <span className="stat-label">Tiempo total</span>
        </div>
        <div className="stat-box">
          <span className="stat-value">{done.length}</span>
          <span className="stat-label">Ejercicios</span>
        </div>
        <div className="stat-box">
          <span className="stat-value">{totalSets}</span>
          <span className="stat-label">Series</span>
        </div>
      </div>

      <Divider />

      <div className="col col--gap-md">
        {done.map((ex, i) => (
          <div key={i} className="summary-ex">
            <div className="row row--between">
              <span className="label">{ex.canonical_name}</span>
              <CheckCircle2 size={16} className="text-success" />
            </div>
            <div className="row" style={{ flexWrap: 'wrap' }}>
              {ex.sets.filter(s => s.done && s.weight_kg).map((s, j) => (
                <span key={j} className="pill pill-muted">
                  {s.weight_kg}kg × {s.reps}
                </span>
              ))}
            </div>
          </div>
        ))}
        {skipped.length > 0 && (
          <>
            <Divider />
            <p className="caption text-muted">Ejercicios omitidos: {skipped.map(e => e.canonical_name).join(', ')}</p>
          </>
        )}
      </div>

      <Button full size="lg" onClick={onClose}>Cerrar</Button>
    </div>
  )
}

// ─── Componente principal ─────────────────────────────────────────────────────
export default function ActiveSession() {
  const { state } = useLocation()
  const navigate  = useNavigate()

  const hasSession = !!state?.sessionId

  const stopwatch = useStopwatch(hasSession)
  const rest      = useRestTimer()

  const [sessionId]   = useState(state?.sessionId)
  const [complements] = useState(state?.complements ?? [])

  const [exercises, setExercises] = useState(() =>
    (state?.exercises ?? []).map(ex => ({
      ...ex,
      status:     STATUS.PENDING,
      sets:       [],
      lastWeight: null,
      lastDate:   null,
    }))
  )

  const [complementStates, setComplementStates] = useState(() =>
    (state?.complements ?? []).map(c => ({ id: c.id, done: null, observations: '' }))
  )

  const [view,          setView]          = useState(VIEW.LIST)
  const [activeIdx,     setActiveIdx]     = useState(null)
  const [saving,        setSaving]        = useState(false)
  const [error,         setError]         = useState('')
  const [confirmExit,   setConfirmExit]   = useState(false)

  // Redirigir si no hay state (acceso directo a la URL)
  useEffect(() => {
    if (!hasSession) navigate('/', { replace: true })
  }, [hasSession])

  // Cargar último peso de cada ejercicio en paralelo
  useEffect(() => {
    if (!exercises.length) return
    exercises.forEach((ex, i) => {
      api.get(`/exercises/${ex.exercise_id}/last-weight`)
        .then(data => {
          if (data.weight_kg != null) {
            setExercises(prev => prev.map((e, idx) =>
              idx === i ? { ...e, lastWeight: data.weight_kg, lastDate: data.session_date } : e
            ))
          }
        })
        .catch(() => {})
    })
  }, [])

  // ── Abrir ejercicio ──────────────────────────────────────────────────────
  const openExercise = (idx) => {
    setActiveIdx(idx)
    setExercises(prev => prev.map((e, i) =>
      i === idx && e.status === STATUS.PENDING ? { ...e, status: STATUS.ACTIVE } : e
    ))
    setView(VIEW.EXERCISE)
  }

  // ── Guardar ejercicio completado ────────────────────────────────────────
  const finishExercise = async (sets) => {
    const ex      = exercises[activeIdx]
    const doneSets = sets.filter(s => s.done)

    setExercises(prev => prev.map((e, i) =>
      i === activeIdx ? { ...e, status: STATUS.DONE, sets } : e
    ))

    // Guardar en BD en background (no bloqueamos la UI)
    if (doneSets.length > 0) {
      const weight = doneSets.find(s => s.weight_kg)?.weight_kg
      const reps   = doneSets.map(s => s.reps).filter(Boolean).join(',')
      api.post(`/sessions/${sessionId}/exercises`, {
        exercise_id:       ex.exercise_id,
        block_exercise_id: ex.block_exercise_id ?? undefined,
        sets_done:         doneSets.length,
        reps_done:         reps   || undefined,
        weight_kg:         weight ? parseFloat(weight) : undefined,
      }).catch(() => {})
    }

    rest.reset()
    setView(VIEW.LIST)
    setActiveIdx(null)
  }

  // ── Finalizar sesión ────────────────────────────────────────────────────
  const finishSession = async () => {
    setSaving(true)
    setError('')
    try {
      for (const cs of complementStates) {
        if (cs.done !== null) {
          await api.post(`/sessions/${sessionId}/complements`, {
            complement_id: cs.id,
            done:          cs.done,
            observations:  cs.observations || undefined,
          }).catch(() => {})
        }
      }
      setView(VIEW.SUMMARY)
    } catch (e) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  // ── Salir sin guardar ───────────────────────────────────────────────────
  const exitWithoutSaving = () => {
    api.delete(`/sessions/${sessionId}`).catch(() => {})
    navigate('/', { replace: true })
  }

  // ── Actualizar estado de un complemento ────────────────────────────────
  const setComp = (i, field, val) =>
    setComplementStates(prev => prev.map((s, idx) => idx === i ? { ...s, [field]: val } : s))

  // ── Cerrar y navegar al detalle de sesión ───────────────────────────────
  const closeSession = () => navigate(`/session/${sessionId}`, { replace: true })

  const doneCount = exercises.filter(e => e.status === STATUS.DONE).length

  if (!state?.sessionId) return null

  return (
    <div className="active-session">
      {/* Barra superior fija: tiempo + progreso */}
      {(view === VIEW.LIST || view === VIEW.EXERCISE) && (
        <div className="active-topbar">
          <div className="row" style={{ gap: 'var(--gap-sm)' }}>
            <Timer size={16} className="text-primary" />
            <span className="active-timer">{stopwatch.display}</span>
          </div>
          <Pill variant="muted">{doneCount}/{exercises.length} ejercicios</Pill>
          {view === VIEW.LIST && (
            <span className="caption text-muted">Bloque {state?.subBlock}</span>
          )}
        </div>
      )}

      {/* ── VISTA: LISTA ─────────────────────────────────────────── */}
      {view === VIEW.LIST && (
        <div className="active-view">
          <h1 className="title-page">Entreno activo</h1>

          {error && <Alert type="error">{error}</Alert>}

          {/* Ejercicios */}
          <div className="col col--gap-md">
            {exercises.map((ex, i) => (
              <ExerciseRow
                key={i}
                ex={ex}
                index={i}
                onClick={() => openExercise(i)}
              />
            ))}
          </div>

          {/* Complementos integrados */}
          {complements.length > 0 && (
            <div className="complements-section">
              <p className="complements-section__title">Complementos</p>
              <div className="col" style={{ gap: 'var(--gap-sm)' }}>
                {complements.map((c, i) => (
                  <div key={c.id} className="complement-row">
                    <div className="col" style={{ gap: 2, flex: 1 }}>
                      <span className="label">{c.name}</span>
                      {c.description && <span className="caption">{c.description}</span>}
                      {complementStates[i]?.done != null && (
                        <Input
                          placeholder="Observaciones opcionales…"
                          value={complementStates[i].observations}
                          onChange={e => setComp(i, 'observations', e.target.value)}
                          style={{ marginTop: 'var(--gap-sm)' }}
                        />
                      )}
                    </div>
                    <div className="complement-row__actions">
                      <button
                        className={`complement-btn ${complementStates[i]?.done === true ? 'complement-btn--yes' : ''}`}
                        onClick={() => setComp(i, 'done', complementStates[i]?.done === true ? null : true)}
                        type="button"
                      >
                        <CheckCircle2 size={20} />
                      </button>
                      <button
                        className={`complement-btn ${complementStates[i]?.done === false ? 'complement-btn--no' : ''}`}
                        onClick={() => setComp(i, 'done', complementStates[i]?.done === false ? null : false)}
                        type="button"
                      >
                        <XCircle size={20} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Botón finalizar — siempre visible */}
          <Button full size="lg" disabled={saving} onClick={finishSession}>
            {saving ? 'Guardando…' : 'Finalizar entrenamiento'}
          </Button>

          {/* Salir sin guardar */}
          {!confirmExit ? (
            <button className="btn btn-ghost btn--sm" style={{ alignSelf: 'center' }} onClick={() => setConfirmExit(true)}>
              Salir sin guardar
            </button>
          ) : (
            <div className="exit-confirm">
              <p className="caption text-muted">¿Segura? Se borrará la sesión y no se guardará nada.</p>
              <div className="row" style={{ justifyContent: 'center', gap: 'var(--gap-md)' }}>
                <button className="btn btn-danger btn--sm" onClick={exitWithoutSaving}>Sí, salir</button>
                <button className="btn btn-ghost btn--sm" onClick={() => setConfirmExit(false)}>Cancelar</button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── VISTA: EJERCICIO ─────────────────────────────────────── */}
      {view === VIEW.EXERCISE && activeIdx !== null && (
        <ExerciseView
          ex={exercises[activeIdx]}
          onBack={() => { rest.reset(); setView(VIEW.LIST) }}
          onDone={finishExercise}
          rest={rest}
        />
      )}

      {/* ── VISTA: RESUMEN ───────────────────────────────────────── */}
      {view === VIEW.SUMMARY && (
        <SummaryView
          exercises={exercises}
          totalTime={stopwatch.display}
          onClose={closeSession}
        />
      )}
    </div>
  )
}
