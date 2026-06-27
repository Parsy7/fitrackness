import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../../utils/api'
import { Card, Pill, Alert, Divider } from '../../components/ui/index'
import { Button } from '../../components/ui/Button'
import { FormGroup, Input, Select } from '../../components/ui/Form'
import { Upload, Check, AlertTriangle, Plus, RefreshCw } from 'lucide-react'
import './AdminImport.css'

const STATUS_CONFIG = {
  found:    { label: 'Encontrado',          variant: 'success',  icon: <Check size={14} /> },
  possible: { label: 'Posible coincidencia', variant: 'warning',  icon: <AlertTriangle size={14} /> },
  new:      { label: 'Nuevo ejercicio',      variant: 'muted',    icon: <Plus size={14} /> },
}

export default function AdminImport() {
  const navigate = useNavigate()
  const [step, setStep]         = useState(1) // 1: subir, 2: revisar, 3: confirmar
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [extracted, setExtracted] = useState(null)
  const [blockName, setBlockName] = useState('')
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0])
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')

  const handleImage = e => {
    const file = e.target.files[0]
    if (!file) return
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
    setError('')
  }

  const analyze = async () => {
    if (!imageFile) { setError('Selecciona una imagen'); return }
    setLoading(true)
    setError('')
    try {
      const fd = new FormData()
      fd.append('image', imageFile)
      const result = await api.upload('/blocks/import-image', fd)
      setExtracted(result)
      setStep(2)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Actualizar estado de un ejercicio en la revisión
  const updateExercise = (subIdx, exIdx, field, value) => {
    setExtracted(prev => ({
      ...prev,
      sub_blocks: prev.sub_blocks.map((sb, si) =>
        si !== subIdx ? sb : {
          ...sb,
          exercises: sb.exercises.map((ex, ei) =>
            ei !== exIdx ? ex : { ...ex, [field]: value }
          )
        }
      )
    }))
  }

  // Aceptar posible coincidencia
  const acceptMatch = (subIdx, exIdx) =>
    updateExercise(subIdx, exIdx, 'status', 'found')

  // Rechazar posible coincidencia (pasa a nuevo)
  const rejectMatch = (subIdx, exIdx) => {
    setExtracted(prev => ({
      ...prev,
      sub_blocks: prev.sub_blocks.map((sb, si) =>
        si !== subIdx ? sb : {
          ...sb,
          exercises: sb.exercises.map((ex, ei) =>
            ei !== exIdx ? ex : { ...ex, status: 'new', exercise_id: null }
          )
        }
      )
    }))
  }

  const confirm = async () => {
    if (!blockName.trim()) { setError('Ponle un nombre al bloque'); return }
    setLoading(true)
    setError('')
    try {
      await api.post('/blocks/import-confirm', {
        name:       blockName.trim(),
        start_date: startDate,
        sub_blocks: extracted.sub_blocks,
      })
      navigate('/admin/blocks')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page">
      <h1 className="title-page">Importar bloque</h1>
      <p className="caption text-muted">Sube la foto del panel del gym y la IA extrae los ejercicios automáticamente</p>

      {/* Step 1 — Subir imagen */}
      {step === 1 && (
        <div className="col col--gap-md">
          {error && <Alert type="error">{error}</Alert>}

          <label className="import-dropzone">
            {imagePreview
              ? <img src={imagePreview} alt="Preview" className="import-preview" />
              : (
                <div className="col" style={{ alignItems: 'center', gap: 'var(--gap-sm)' }}>
                  <Upload size={40} style={{ color: 'var(--color-primary)' }} />
                  <p className="label">Toca para seleccionar la foto</p>
                  <p className="caption">JPG, PNG o WEBP</p>
                </div>
              )
            }
            <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImage} />
          </label>

          {imagePreview && (
            <Button variant="secondary" onClick={() => { setImageFile(null); setImagePreview(null) }}>
              <RefreshCw size={16} /> Cambiar imagen
            </Button>
          )}

          <Button full size="lg" onClick={analyze} disabled={!imageFile || loading}>
            {loading ? 'Analizando...' : 'Analizar con IA'}
          </Button>
        </div>
      )}

      {/* Step 2 — Revisar mapeo */}
      {step === 2 && extracted && (
        <div className="col col--gap-md">
          {error && <Alert type="error">{error}</Alert>}

          <Card>
            <p className="label">Revisa el mapeo de ejercicios</p>
            <p className="caption">
              ✅ Encontrado — mapeado a ejercicio existente<br />
              ⚠️ Posible — confirma si es el mismo<br />
              🆕 Nuevo — se creará en la biblioteca
            </p>
          </Card>

          {extracted.sub_blocks.map((sb, si) => (
            <div key={si} className="col col--gap-md">
              <Pill variant="primary">Bloque {sb.name}</Pill>

              {sb.exercises.map((ex, ei) => {
                const cfg = STATUS_CONFIG[ex.status] || STATUS_CONFIG.new
                return (
                  <Card key={ei} variant={ex.status === 'possible' ? 'elevated' : undefined}>
                    <div className="row row--between">
                      <p className="label">{ex.original_name}</p>
                      <Pill variant={cfg.variant}>{cfg.icon}{cfg.label}</Pill>
                    </div>

                    {ex.status === 'found' && (
                      <p className="caption text-muted">→ {ex.canonical_name}</p>
                    )}

                    {ex.status === 'possible' && (
                      <div className="col" style={{ gap: 'var(--gap-sm)' }}>
                        <p className="caption">¿Es el mismo que <strong>{ex.canonical_name}</strong>?</p>
                        <div className="row" style={{ gap: 'var(--gap-sm)' }}>
                          <Button size="sm" variant="success" onClick={() => acceptMatch(si, ei)}><Check size={14} /> Sí, es el mismo</Button>
                          <Button size="sm" variant="secondary" onClick={() => rejectMatch(si, ei)}>No, crear nuevo</Button>
                        </div>
                      </div>
                    )}

                    {ex.status === 'new' && (
                      <FormGroup label="Nombre canónico para la biblioteca">
                        <Input
                          value={ex.canonical_name}
                          onChange={e => updateExercise(si, ei, 'canonical_name', e.target.value)}
                          placeholder={ex.original_name}
                        />
                      </FormGroup>
                    )}

                    <div className="row" style={{ gap: 'var(--gap-sm)', flexWrap: 'wrap' }}>
                      {ex.sets && <Pill variant="muted">{ex.sets} series</Pill>}
                      {ex.reps && <Pill variant="muted">{ex.reps} reps</Pill>}
                      {ex.rest_seconds && <Pill variant="muted">R:{ex.rest_seconds}s</Pill>}
                    </div>

                    {ex.notes && <p className="caption text-muted">{ex.notes}</p>}
                  </Card>
                )
              })}

              {sb.complementos && (
                <Card variant="flat">
                  <p className="caption text-muted"><strong>Complementos:</strong> {sb.complementos}</p>
                </Card>
              )}
            </div>
          ))}

          <Divider />

          <FormGroup label="Nombre del bloque">
            <Input value={blockName} onChange={e => setBlockName(e.target.value)} placeholder="Ej: Bloque Julio 2026" />
          </FormGroup>

          <FormGroup label="Fecha de inicio">
            <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
          </FormGroup>

          <div className="row" style={{ gap: 'var(--gap-sm)', justifyContent: 'flex-end' }}>
            <Button variant="secondary" onClick={() => setStep(1)}>Volver</Button>
            <Button onClick={confirm} disabled={loading}>
              {loading ? 'Creando...' : 'Crear bloque'}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
