import { useState } from 'react'
import { useFetch } from '../../hooks/useFetch'
import { api } from '../../utils/api'
import { Card, Pill, EmptyState, LoadingPage, Alert, Divider } from '../../components/ui/index'
import { Button } from '../../components/ui/Button'
import { Modal } from '../../components/ui/Modal'
import { FormGroup, Input, Textarea, Select } from '../../components/ui/Form'
import { Plus, Pencil, Trash2, Layers, ChevronDown, ChevronUp } from 'lucide-react'
import { ExerciseSelect } from '../../components/ui/ExerciseSelect'

const SUB_BLOCKS = ['A', 'B', 'C', 'D', 'E', 'General']
const EMPTY_FORM = { name: '', start_date: new Date().toISOString().split('T')[0], notes: '' }

export default function AdminBlocks() {
  const { data, loading, refetch } = useFetch('/blocks')
  const { data: exData, loading: loadingEx } = useFetch('/exercises?limit=1000')
  const exercises = exData?.data || []

  const [modal, setModal]     = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm]       = useState(EMPTY_FORM)
  const [blockExs, setBlockExs] = useState([]) // ejercicios del bloque en edición
  const [expanded, setExpanded] = useState({})
  const [saving, setSaving]   = useState(false)
  const [error, setError]     = useState('')

  const handle = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }))

  const openCreate = () => {
    setEditing(null)
    setForm(EMPTY_FORM)
    setBlockExs([])
    setError('')
    setModal(true)
  }

  const openEdit = block => {
    setEditing(block)
    setForm({ name: block.name, start_date: block.start_date, notes: block.notes || '' })
    setBlockExs((block.exercises || []).map(be => ({
      exercise_id:             be.exercise_id != null && be.exercise_id !== '' ? parseInt(be.exercise_id) : '',
      canonical_name:          be.canonical_name,
      sub_block:               be.sub_block || 'A',
      recommended_sets:        be.recommended_sets  || '',
      recommended_reps:        be.recommended_reps  || '',
      recommended_rest_seconds: be.recommended_rest_seconds || '',
      notes:                   be.notes || '',
    })))
    setError('')
    setModal(true)
  }

  const addExercise = () => {
    setBlockExs(prev => [...prev, {
      exercise_id: '', canonical_name: '', sub_block: 'A',
      recommended_sets: '', recommended_reps: '', recommended_rest_seconds: '', notes: '',
    }])
  }

  const updateBE = (idx, field, value) =>
    setBlockExs(prev => prev.map((e, i) => {
      if (i !== idx) return e
      if (field === 'exercise_id') {
        const ex = exercises.find(e => e.id === parseInt(value))
        return { ...e, exercise_id: parseInt(value), canonical_name: ex?.canonical_name || '' }
      }
      return { ...e, [field]: value }
    }))

  const removeBE = idx => setBlockExs(prev => prev.filter((_, i) => i !== idx))

  const save = async () => {
    setError('')
    setSaving(true)
    try {
      if (!form.name.trim()) { setError('El nombre es obligatorio'); setSaving(false); return }

      const payload = {
        name:       form.name.trim(),
        start_date: form.start_date,
        notes:      form.notes || undefined,
        exercises:  blockExs.filter(e => e.exercise_id).map(e => ({
          exercise_id:              e.exercise_id,
          sub_block:                e.sub_block,
          recommended_sets:         e.recommended_sets  ? parseInt(e.recommended_sets)  : undefined,
          recommended_reps:         e.recommended_reps  || undefined,
          recommended_rest_seconds: e.recommended_rest_seconds ? parseInt(e.recommended_rest_seconds) : undefined,
          notes:                    e.notes || undefined,
        })),
      }

      if (editing) await api.put(`/blocks/${editing.id}`, payload)
      else         await api.post('/blocks', payload)

      setModal(false)
      refetch()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const deleteBlock = async id => {
    if (!confirm('¿Eliminar este bloque?')) return
    try { await api.delete(`/blocks/${id}`); refetch() }
    catch (err) { alert(err.message) }
  }

  const blocks = data || []

  if (loading) return <LoadingPage />

  // Agrupar ejercicios del bloque editado por sub-bloque para previsualización
  const grouped = blockExs.reduce((acc, ex, idx) => {
    const key = ex.sub_block || 'General'
    if (!acc[key]) acc[key] = []
    acc[key].push({ ...ex, idx })
    return acc
  }, {})

  return (
    <div className="page">
      <div className="row row--between">
        <h1 className="title-page">Bloques</h1>
        <Button size="sm" onClick={openCreate}><Plus size={16} /> Nuevo</Button>
      </div>

      {blocks.length === 0 ? (
        <EmptyState
          icon={<Layers size={40} />}
          title="Sin bloques"
          description="Crea el primer bloque o impórtalo desde una imagen"
          action={<Button onClick={openCreate}><Plus size={16} /> Crear bloque</Button>}
        />
      ) : (
        <div className="col col--gap-md">
          {blocks.map(b => (
            <Card key={b.id}>
              <div className="row row--between">
                <div className="col" style={{ gap: 4 }}>
                  <p className="subtitle">{b.name}</p>
                  <p className="caption">Desde {new Date(b.start_date).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                </div>
                <div className="row">
                  <Pill variant="muted">{b.exercises?.length || 0} ej.</Pill>
                  <Button variant="ghost" size="sm" onClick={() => openEdit(b)} disabled={loadingEx}><Pencil size={16} /></Button>
                  <Button variant="ghost" size="sm" onClick={() => deleteBlock(b.id)}><Trash2 size={16} style={{ color: 'var(--color-error)' }} /></Button>
                </div>
              </div>

              {b.notes && <p className="caption text-muted">{b.notes}</p>}

              {/* Preview sub-bloques */}
              {b.exercises?.length > 0 && (
                <>
                  <button
                    className="btn btn-ghost btn--sm"
                    style={{ alignSelf: 'flex-start' }}
                    onClick={() => setExpanded(p => ({ ...p, [b.id]: !p[b.id] }))}
                  >
                    {expanded[b.id] ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    Ver ejercicios
                  </button>
                  {expanded[b.id] && (
                    <div className="col" style={{ gap: 'var(--gap-sm)' }}>
                      {['A','B','C','D'].map(sub => {
                        const exs = b.exercises.filter(e => e.sub_block === sub)
                        if (!exs.length) return null
                        return (
                          <div key={sub} className="col" style={{ gap: 6 }}>
                            <Pill variant="primary">Bloque {sub}</Pill>
                            {exs.map((e, i) => (
                              <div key={i} className="row" style={{ gap: 'var(--space-icon-text)' }}>
                                <span className="caption" style={{ width: 16, textAlign: 'right', color: 'var(--color-primary)' }}>{i + 1}</span>
                                <span className="label">{e.canonical_name}</span>
                                {e.recommended_sets && <span className="caption">{e.recommended_sets}×{e.recommended_reps}</span>}
                              </div>
                            ))}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Modal crear/editar bloque */}
      <Modal open={modal} onClose={() => setModal(false)} title={editing ? 'Editar bloque' : 'Nuevo bloque'}>
        {error && <Alert type="error">{error}</Alert>}

        <FormGroup label="Nombre del bloque *">
          <Input name="name" value={form.name} onChange={handle} placeholder="Ej: Bloque Junio 2026" />
        </FormGroup>

        <FormGroup label="Fecha de inicio">
          <Input name="start_date" type="date" value={form.start_date} onChange={handle} />
        </FormGroup>

        <FormGroup label="Notas">
          <Textarea name="notes" value={form.notes} onChange={handle} placeholder="Observaciones del bloque..." rows={2} />
        </FormGroup>

        <Divider />

        <div className="row row--between">
          <p className="label">Ejercicios ({blockExs.length})</p>
          <Button size="sm" variant="secondary" onClick={addExercise}><Plus size={14} /> Añadir</Button>
        </div>

        {blockExs.length > 0 && (
          <div className="col col--gap-md">
            {blockExs.map((be, idx) => (
              <Card key={idx} variant="elevated">
                <div className="row row--between">
                  <Select value={be.sub_block} onChange={e => updateBE(idx, 'sub_block', e.target.value)} style={{ maxWidth: 80 }}>
                    {SUB_BLOCKS.map(s => <option key={s} value={s}>{s}</option>)}
                  </Select>
                  <Button variant="ghost" size="sm" onClick={() => removeBE(idx)}><Trash2 size={14} style={{ color: 'var(--color-error)' }} /></Button>
                </div>

                <FormGroup label="Ejercicio">
                  <ExerciseSelect
                    exercises={exercises}
                    value={be.exercise_id}
                    onChange={(id) => updateBE(idx, 'exercise_id', id)}
                  />
                </FormGroup>

                <div className="row" style={{ gap: 'var(--gap-sm)' }}>
                  <FormGroup label="Series">
                    <Input type="number" value={be.recommended_sets} onChange={e => updateBE(idx, 'recommended_sets', e.target.value)} placeholder="4" min="1" />
                  </FormGroup>
                  <FormGroup label="Reps">
                    <Input value={be.recommended_reps} onChange={e => updateBE(idx, 'recommended_reps', e.target.value)} placeholder="8-10" />
                  </FormGroup>
                  <FormGroup label="Descanso (s)">
                    <Input type="number" value={be.recommended_rest_seconds} onChange={e => updateBE(idx, 'recommended_rest_seconds', e.target.value)} placeholder="120" />
                  </FormGroup>
                </div>

                <FormGroup label="Notas">
                  <Input value={be.notes} onChange={e => updateBE(idx, 'notes', e.target.value)} placeholder="Observaciones..." />
                </FormGroup>
              </Card>
            ))}
          </div>
        )}

        <div className="row" style={{ justifyContent: 'flex-end', gap: 'var(--gap-sm)' }}>
          <Button variant="secondary" onClick={() => setModal(false)}>Cancelar</Button>
          <Button onClick={save} disabled={saving}>{saving ? 'Guardando...' : 'Guardar bloque'}</Button>
        </div>
      </Modal>
    </div>
  )
}
