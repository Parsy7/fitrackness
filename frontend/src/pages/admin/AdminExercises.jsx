import { useState } from 'react'
import { useFetch } from '../../hooks/useFetch'
import { api } from '../../utils/api'
import { Card, Pill, EmptyState, LoadingPage, Alert, Divider } from '../../components/ui/index'
import { Button } from '../../components/ui/Button'
import { Modal } from '../../components/ui/Modal'
import { FormGroup, Input, Textarea, Select } from '../../components/ui/Form'
import { Plus, Pencil, Trash2, Dumbbell, X, Camera } from 'lucide-react'

const MUSCLE_GROUPS = ['Piernas', 'Pecho', 'Espalda', 'Hombros', 'Brazos', 'Core', 'Cardio', 'Full Body']

const EMPTY_FORM = {
  canonical_name: '', description: '', muscle_group: '', equipment: '',
  adaptations: '', aliases: '',
}

export default function AdminExercises() {
  const { data, loading, refetch } = useFetch('/exercises?limit=100')
  const [modal, setModal]   = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm]     = useState(EMPTY_FORM)
  const [mediaModal, setMediaModal] = useState(null) // exercise id
  const [search, setSearch] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError]   = useState('')
  const [deleting, setDeleting] = useState(null)

  const handle = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }))

  const openCreate = () => {
    setEditing(null)
    setForm(EMPTY_FORM)
    setError('')
    setModal(true)
  }

  const openEdit = ex => {
    setEditing(ex)
    setForm({
      canonical_name: ex.canonical_name,
      description:    ex.description   || '',
      muscle_group:   ex.muscle_group  || '',
      equipment:      ex.equipment     || '',
      adaptations:    (ex.adaptations  || []).join('\n'),
      aliases:        (ex.aliases      || []).map(a => a.alias).join('\n'),
    })
    setError('')
    setModal(true)
  }

  const save = async () => {
    setError('')
    setSaving(true)
    try {
      const payload = {
        canonical_name: form.canonical_name.trim(),
        description:    form.description   || undefined,
        muscle_group:   form.muscle_group  || undefined,
        equipment:      form.equipment     || undefined,
        adaptations:    form.adaptations.split('\n').map(s => s.trim()).filter(Boolean),
        aliases:        form.aliases.split('\n').map(s => s.trim()).filter(Boolean),
      }
      if (!payload.canonical_name) { setError('El nombre es obligatorio'); setSaving(false); return }

      if (editing) await api.put(`/exercises/${editing.id}`, payload)
      else         await api.post('/exercises', payload)

      setModal(false)
      refetch()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const deleteEx = async id => {
    if (!confirm('¿Eliminar este ejercicio?')) return
    setDeleting(id)
    try { await api.delete(`/exercises/${id}`); refetch() }
    catch (err) { alert(err.message) }
    finally { setDeleting(null) }
  }

  const uploadMedia = async (exerciseId, file) => {
    const fd = new FormData()
    fd.append('file', file)
    fd.append('type', file.type.startsWith('video') ? 'video' : 'photo')
    await api.upload(`/exercises/${exerciseId}/media`, fd)
    refetch()
  }

  const deleteMedia = async (exerciseId, mediaId) => {
    await api.delete(`/exercises/${exerciseId}/media/${mediaId}`)
    refetch()
  }

  const filtered = (data?.data || []).filter(e =>
    !search || e.canonical_name.toLowerCase().includes(search.toLowerCase())
  )

  if (loading) return <LoadingPage />

  return (
    <div className="page">
      <div className="row row--between">
        <h1 className="title-page">Ejercicios</h1>
        <Button size="sm" onClick={openCreate}><Plus size={16} /> Nuevo</Button>
      </div>

      <Input
        placeholder="Buscar ejercicio..."
        value={search}
        onChange={e => setSearch(e.target.value)}
      />

      {filtered.length === 0 ? (
        <EmptyState
          icon={<Dumbbell size={40} />}
          title="Sin ejercicios"
          description="Crea el primer ejercicio de la biblioteca"
          action={<Button onClick={openCreate}><Plus size={16} /> Crear ejercicio</Button>}
        />
      ) : (
        <div className="col col--gap-md">
          {filtered.map(ex => (
            <Card key={ex.id}>
              <div className="row row--between">
                <div className="col" style={{ gap: 4, flex: 1 }}>
                  <p className="subtitle">{ex.canonical_name}</p>
                  <div className="row" style={{ flexWrap: 'wrap', gap: 'var(--gap-sm)' }}>
                    {ex.muscle_group && <Pill variant="muted">{ex.muscle_group}</Pill>}
                    {ex.equipment    && <Pill variant="muted">{ex.equipment}</Pill>}
                  </div>
                </div>
                <div className="row">
                  <Button variant="ghost" size="sm" onClick={() => openEdit(ex)}><Pencil size={16} /></Button>
                  <Button variant="ghost" size="sm" onClick={() => deleteEx(ex.id)} disabled={deleting === ex.id}><Trash2 size={16} style={{ color: 'var(--color-error)' }} /></Button>
                </div>
              </div>

              {ex.description && <p className="caption">{ex.description}</p>}

              {ex.aliases?.length > 0 && (
                <div className="row" style={{ flexWrap: 'wrap' }}>
                  <span className="caption">También: </span>
                  {ex.aliases.map(a => <Pill key={a.id} variant="muted">{a.alias}</Pill>)}
                </div>
              )}

              {/* Media */}
              <div className="row" style={{ flexWrap: 'wrap', gap: 'var(--gap-sm)' }}>
                {(ex.media || []).map(m => (
                  <div key={m.id} className="media-thumb">
                    {m.type === 'photo'
                      ? <img src={`/uploads/${m.url}`} alt={m.caption || ''} />
                      : <video src={`/uploads/${m.url}`} controls />
                    }
                    <button className="media-delete" onClick={() => deleteMedia(ex.id, m.id)}><X size={12} /></button>
                  </div>
                ))}
                <label className="btn btn-ghost btn--sm" style={{ cursor: 'pointer' }}>
                  <Camera size={16} /> Añadir
                  <input type="file" accept="image/*,video/*" style={{ display: 'none' }}
                    onChange={e => e.target.files[0] && uploadMedia(ex.id, e.target.files[0])} />
                </label>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Modal crear/editar */}
      <Modal
        open={modal}
        onClose={() => setModal(false)}
        title={editing ? 'Editar ejercicio' : 'Nuevo ejercicio'}
        footer={
          <>
            <Button variant="secondary" onClick={() => setModal(false)}>Cancelar</Button>
            <Button onClick={save} disabled={saving}>{saving ? 'Guardando...' : 'Guardar'}</Button>
          </>
        }
      >
        {error && <Alert type="error">{error}</Alert>}

        <FormGroup label="Nombre canónico *">
          <Input name="canonical_name" value={form.canonical_name} onChange={handle} placeholder="Ej: Sumo Deadlift" />
        </FormGroup>

        <FormGroup label="Grupo muscular">
          <Select name="muscle_group" value={form.muscle_group} onChange={handle}>
            <option value="">— Seleccionar —</option>
            {MUSCLE_GROUPS.map(g => <option key={g} value={g}>{g}</option>)}
          </Select>
        </FormGroup>

        <FormGroup label="Equipamiento">
          <Input name="equipment" value={form.equipment} onChange={handle} placeholder="Ej: Barra, Mancuernas, Máquina..." />
        </FormGroup>

        <FormGroup label="Descripción">
          <Textarea name="description" value={form.description} onChange={handle} placeholder="Cómo se ejecuta..." rows={3} />
        </FormGroup>

        <FormGroup label="Alias / variantes (uno por línea)">
          <Textarea name="aliases" value={form.aliases} onChange={handle}
            placeholder={"Sumo DL\nSUMO DL\nPeso muerto sumo"} rows={3} />
        </FormGroup>

        <FormGroup label="Adaptaciones posibles (una por línea)">
          <Textarea name="adaptations" value={form.adaptations} onChange={handle}
            placeholder={"Menor rango de movimiento\nCon mancuernas en lugar de barra"} rows={3} />
        </FormGroup>


      </Modal>

      <style>{`
        .media-thumb {
          position: relative;
          width: 72px;
          height: 72px;
          border-radius: var(--radius-sm);
          overflow: hidden;
          border: var(--border-card);
        }
        .media-thumb img, .media-thumb video {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .media-delete {
          position: absolute;
          top: 2px;
          right: 2px;
          background: var(--color-error);
          border: none;
          border-radius: 50%;
          width: 20px;
          height: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          color: var(--color-text);
        }
      `}</style>
    </div>
  )
}
