import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useFetch } from '../../hooks/useFetch'
import { api } from '../../utils/api'
import { Card, Alert, Pill, Divider, LoadingPage } from '../../components/ui/index'
import { Button } from '../../components/ui/Button'
import { FormGroup, Input, Textarea, Select } from '../../components/ui/Form'
import { Plus, Minus, Camera, ChevronDown, ChevronUp } from 'lucide-react'
import './NewSession.css'

export default function NewSession() {
  const navigate  = useNavigate()
  const { data: block, loading } = useFetch('/blocks/active')

  const [type, setType]       = useState('block')
  const [date, setDate]       = useState(new Date().toISOString().split('T')[0])
  const [notes, setNotes]     = useState('')
  const [exercises, setEx]    = useState([])
  const [saving, setSaving]   = useState(false)
  const [error, setError]     = useState('')
  const [expanded, setExpanded] = useState({})

  if (loading) return <LoadingPage />

  // Pre-cargar ejercicios del bloque
  const initExercises = () => {
    if (!block || exercises.length) return
    setEx(block.exercises.map(be => ({
      exercise_id:      be.exercise_id,
      block_exercise_id: be.id,
      canonical_name:   be.canonical_name,
      recommended_sets: be.recommended_sets,
      recommended_reps: be.recommended_reps,
      recommended_rest: be.recommended_rest_seconds,
      sub_block:        be.sub_block,
      sets_done:        be.recommended_sets || '',
      reps_done:        be.recommended_reps || '',
      weight_kg:        '',
      adaptation:       '',
      notes:            '',
      media:            [],
    })))
  }

  if (type === 'block' && block && !exercises.length) initExercises()

  const updateEx = (idx, field, value) =>
    setEx(prev => prev.map((e, i) => i === idx ? { ...e, [field]: value } : e))

  const addMedia = (idx, file) =>
    setEx(prev => prev.map((e, i) => i === idx ? { ...e, media: [...e.media, file] } : e))

  const submit = async () => {
    setError('')
    setSaving(true)
    try {
      // Crear sesión
      const session = await api.post('/sessions', {
        session_date:   date,
        type,
        block_id:       type === 'block' ? block?.id : undefined,
        general_notes:  notes || undefined,
      })

      // Registrar ejercicios
      for (const ex of exercises) {
        if (!ex.weight_kg && !ex.sets_done) continue
        const se = await api.post(`/sessions/${session.id}/exercises`, {
          exercise_id:       ex.exercise_id,
          block_exercise_id: ex.block_exercise_id,
          sets_done:         ex.sets_done    ? parseInt(ex.sets_done)    : undefined,
          reps_done:         ex.reps_done    || undefined,
          weight_kg:         ex.weight_kg    ? parseFloat(ex.weight_kg)  : undefined,
          adaptation:        ex.adaptation   || undefined,
          notes:             ex.notes        || undefined,
        })

        // Subir media si hay
        for (const file of ex.media) {
          const fd = new FormData()
          fd.append('file', file)
          fd.append('type', file.type.startsWith('video') ? 'video' : 'photo')
          await api.upload(`/sessions/${session.id}/exercises/${se.id}/media`, fd)
        }
      }

      navigate(`/session/${session.id}`)
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  // Agrupar por sub-bloque
  const grouped = exercises.reduce((acc, ex, idx) => {
    const key = ex.sub_block || 'General'
    if (!acc[key]) acc[key] = []
    acc[key].push({ ...ex, idx })
    return acc
  }, {})

  return (
    <div className="page">
      <h1 className="title-page">Nueva sesión</h1>

      {error && <Alert type="error">{error}</Alert>}

      <Card>
        <FormGroup label="Fecha">
          <Input type="date" value={date} onChange={e => setDate(e.target.value)} />
        </FormGroup>
        <FormGroup label="Tipo">
          <Select value={type} onChange={e => { setType(e.target.value); setEx([]) }}>
            <option value="block">Bloque de entrenamiento</option>
            <option value="group">Sesión grupal</option>
          </Select>
        </FormGroup>
        <FormGroup label="Notas generales">
          <Textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Cómo te has sentido, observaciones..." rows={2} />
        </FormGroup>
      </Card>

      {type === 'block' && (
        <>
          {!block && <Alert type="warning">No hay bloque activo</Alert>}
          {block && Object.entries(grouped).map(([subBlock, exs]) => (
            <div key={subBlock} className="col col--gap-md">
              <Pill variant="primary">Bloque {subBlock}</Pill>
              {exs.map(({ idx, ...ex }) => (
                <Card key={ex.exercise_id}>
                  <div className="row row--between" onClick={() => setExpanded(p => ({ ...p, [idx]: !p[idx] }))}>
                    <div className="col" style={{ gap: 4 }}>
                      <p className="label">{ex.canonical_name}</p>
                      {ex.recommended_sets && (
                        <p className="caption">{ex.recommended_sets}×{ex.recommended_reps} · {ex.recommended_rest ? `R:${ex.recommended_rest}s` : ''}</p>
                      )}
                    </div>
                    {expanded[idx] ? <ChevronUp size={18} style={{ color: 'var(--color-text-muted)' }} /> : <ChevronDown size={18} style={{ color: 'var(--color-text-muted)' }} />}
                  </div>

                  {expanded[idx] && (
                    <>
                      <Divider />
                      <div className="exercise-inputs">
                        <FormGroup label="Series">
                          <Input type="number" value={ex.sets_done} onChange={e => updateEx(idx, 'sets_done', e.target.value)} placeholder={ex.recommended_sets} min="1" />
                        </FormGroup>
                        <FormGroup label="Reps">
                          <Input value={ex.reps_done} onChange={e => updateEx(idx, 'reps_done', e.target.value)} placeholder={ex.recommended_reps || 'ej: 10,9,8'} />
                        </FormGroup>
                        <FormGroup label="Peso (kg)">
                          <Input type="number" value={ex.weight_kg} onChange={e => updateEx(idx, 'weight_kg', e.target.value)} placeholder="0" step="0.5" />
                        </FormGroup>
                      </div>
                      <FormGroup label="Adaptación del día">
                        <Input value={ex.adaptation} onChange={e => updateEx(idx, 'adaptation', e.target.value)} placeholder="Ej: Menor rango de movimiento" />
                      </FormGroup>
                      <FormGroup label="Notas">
                        <Input value={ex.notes} onChange={e => updateEx(idx, 'notes', e.target.value)} placeholder="Sensaciones, observaciones..." />
                      </FormGroup>
                      <div className="row">
                        <label className="btn btn-ghost btn--sm" style={{ cursor: 'pointer' }}>
                          <Camera size={16} /> Añadir foto/vídeo
                          <input type="file" accept="image/*,video/*" className="hidden-input" onChange={e => e.target.files[0] && addMedia(idx, e.target.files[0])} />
                        </label>
                        {ex.media.length > 0 && <Pill variant="muted">{ex.media.length} archivo{ex.media.length > 1 ? 's' : ''}</Pill>}
                      </div>
                    </>
                  )}
                </Card>
              ))}
            </div>
          ))}
        </>
      )}

      <Button full size="lg" onClick={submit} disabled={saving}>
        {saving ? 'Guardando...' : 'Guardar sesión'}
      </Button>
    </div>
  )
}
