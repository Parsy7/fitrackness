import { useState } from 'react'
import { Button } from './Button'
import { FormGroup, Input, Select } from './Form'
import { Card } from './index'
import { ExerciseSelect } from './ExerciseSelect'
import { Plus, Trash2 } from 'lucide-react'

const METHODOLOGIES = ['EMOM', 'AMRAP', 'Circuito', 'Rounds for Time', '21-15-9', 'Tabata', 'For Time', 'Otro']
const SUB_BLOCKS = ['A', 'B', 'C', 'D', 'E', 'General']

export function ComplementForm({ initial = {}, exercises = [], onSave, onCancel, saving }) {
  const [form, setForm] = useState({
    sub_block:   initial.sub_block   || 'A',
    methodology: initial.methodology || '',
    parameter:   initial.parameter   || '',
    notes:       initial.notes       || '',
    exercises:   initial.exercises   || [],
  })

  const handle = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }))

  const addEx = () => setForm(f => ({ ...f, exercises: [...f.exercises, { exercise_id: '', canonical_name: '', reps: '', notes: '' }] }))
  const removeEx = idx => setForm(f => ({ ...f, exercises: f.exercises.filter((_, i) => i !== idx) }))
  const updateEx = (idx, field, value) =>
    setForm(f => ({ ...f, exercises: f.exercises.map((e, i) => i !== idx ? e : { ...e, [field]: value }) }))

  return (
    <div className="col col--gap-md">
      <div className="row" style={{ gap: 'var(--gap-sm)' }}>
        <FormGroup label="Sub-bloque" style={{ flex: '0 0 80px' }}>
          <Select name="sub_block" value={form.sub_block} onChange={handle}>
            {SUB_BLOCKS.map(s => <option key={s} value={s}>{s}</option>)}
          </Select>
        </FormGroup>
        <FormGroup label="Metodología *" style={{ flex: 1 }}>
          <Select name="methodology" value={form.methodology} onChange={handle}>
            <option value="">— Tipo —</option>
            {METHODOLOGIES.map(m => <option key={m} value={m}>{m}</option>)}
          </Select>
        </FormGroup>
      </div>

      <FormGroup label="Parámetro (tiempo, rondas...)">
        <Input name="parameter" value={form.parameter} onChange={handle} placeholder="Ej: 12 minutos, 3 rondas, 21-15-9" />
      </FormGroup>

      <FormGroup label="Notas adicionales">
        <Input name="notes" value={form.notes} onChange={handle} placeholder="Descripción libre..." />
      </FormGroup>

      <div className="row row--between">
        <p className="label">Ejercicios ({form.exercises.length})</p>
        <Button size="sm" variant="secondary" onClick={addEx} type="button"><Plus size={14} /> Añadir</Button>
      </div>

      {form.exercises.map((ex, idx) => (
        <Card key={idx} variant="elevated">
          <div className="row row--between">
            <p className="label text-muted">Ejercicio {idx + 1}</p>
            <Button variant="ghost" size="sm" onClick={() => removeEx(idx)} type="button">
              <Trash2 size={14} style={{ color: 'var(--color-error)' }} />
            </Button>
          </div>
          <ExerciseSelect
            exercises={exercises}
            value={ex.exercise_id}
            onChange={id => updateEx(idx, 'exercise_id', id)}
          />
          <div className="row" style={{ gap: 'var(--gap-sm)' }}>
            <FormGroup label="Reps / Dist." style={{ flex: 1 }}>
              <Input value={ex.reps} onChange={e => updateEx(idx, 'reps', e.target.value)} placeholder="10, 40M, 30seg..." />
            </FormGroup>
            <FormGroup label="Notas" style={{ flex: 1 }}>
              <Input value={ex.notes} onChange={e => updateEx(idx, 'notes', e.target.value)} placeholder="Opcional" />
            </FormGroup>
          </div>
        </Card>
      ))}

      <div className="row" style={{ justifyContent: 'flex-end', gap: 'var(--gap-sm)' }}>
        {onCancel && <Button variant="secondary" onClick={onCancel} type="button">Cancelar</Button>}
        <Button onClick={() => onSave(form)} disabled={saving || !form.methodology} type="button">
          {saving ? 'Guardando...' : 'Guardar complemento'}
        </Button>
      </div>
    </div>
  )
}
