import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../../context/AuthContext'
import { api } from '../../utils/api'
import { Card, Alert, Divider } from '../../components/ui/index'
import { Button } from '../../components/ui/Button'
import { FormGroup, Input, Textarea, Select } from '../../components/ui/Form'
import { Avatar } from '../../components/ui/Avatar'
import { LogOut, Activity, Trash2 } from 'lucide-react'
import './Profile.css'

const SEX_OPTIONS = [
  { value: '',            label: '— Seleccionar —' },
  { value: 'male',        label: 'Hombre' },
  { value: 'female',      label: 'Mujer' },
  { value: 'undisclosed', label: 'Prefiero no responder' },
]

function calcAge(birthDate) {
  if (!birthDate) return ''
  const birth = new Date(birthDate)
  const today = new Date()
  let age = today.getFullYear() - birth.getFullYear()
  const m = today.getMonth() - birth.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--
  return age
}

export default function Profile() {
  const { user, logout } = useAuth()
  const fileRef = useRef()

  const [form, setForm] = useState({
    name: '', last_name: '', birth_date: '', age: '', sex: '',
    height_cm: '', weight_kg: '', conditions: '',
  })
  const [avatarUrl, setAvatarUrl] = useState(null)
  const [hasBirthDate, setHasBirthDate] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError]     = useState('')
  const [loading, setLoading] = useState(false)
  const [avatarLoading, setAvatarLoading] = useState(false)

  useEffect(() => {
    api.get('/auth/me').then(data => {
      const hasDob = !!data.birth_date
      setHasBirthDate(hasDob)
      setAvatarUrl(data.avatar_url || null)
      setForm({
        name:       data.name       || '',
        last_name:  data.last_name  || '',
        birth_date: data.birth_date || '',
        age:        hasDob ? calcAge(data.birth_date) : (data.age || ''),
        sex:        data.sex        || '',
        height_cm:  data.height_cm  || '',
        weight_kg:  data.weight_kg  || '',
        conditions: data.conditions?.join('\n') || '',
      })
    })
  }, [])

  const handle = e => {
    const { name, value } = e.target
    setForm(f => {
      const next = { ...f, [name]: value }
      // Si cambia birth_date, recalcular edad
      if (name === 'birth_date') {
        const hasDob = !!value
        setHasBirthDate(hasDob)
        next.age = hasDob ? calcAge(value) : ''
      }
      return next
    })
  }

  const submit = async e => {
    e.preventDefault()
    setError(''); setSuccess('')
    setLoading(true)
    try {
      const payload = {
        name:       form.name,
        last_name:  form.last_name  || undefined,
        sex:        form.sex        || undefined,
        height_cm:  form.height_cm  ? parseFloat(form.height_cm)  : undefined,
        weight_kg:  form.weight_kg  ? parseFloat(form.weight_kg)  : undefined,
        conditions: form.conditions.split('\n').map(s => s.trim()).filter(Boolean),
      }
      if (form.birth_date) {
        payload.birth_date = form.birth_date
      } else if (form.age) {
        payload.age = parseInt(form.age)
      }
      await api.put('/users/profile', payload)
      setSuccess('Perfil actualizado')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleAvatarClick = () => fileRef.current?.click()

  const handleAvatarChange = async e => {
    const file = e.target.files[0]
    if (!file) return
    setAvatarLoading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await api.upload('/users/avatar', fd)
      setAvatarUrl(res.avatar_url)
    } catch (err) {
      setError(err.message)
    } finally {
      setAvatarLoading(false)
    }
  }

  const deleteAvatar = async () => {
    setAvatarLoading(true)
    try {
      await api.delete('/users/avatar')
      setAvatarUrl(null)
    } catch (err) {
      setError(err.message)
    } finally {
      setAvatarLoading(false)
    }
  }

  return (
    <div className="page">
      <h1 className="title-page">Perfil</h1>

      {/* Avatar */}
      <div className="profile-avatar-section">
        <div className="profile-avatar-wrap">
          <Avatar
            src={avatarUrl}
            sex={form.sex}
            size={96}
            editable={!avatarLoading}
            onClick={handleAvatarClick}
          />
          {avatarLoading && <div className="spinner" style={{ position: 'absolute' }} />}
        </div>
        <div className="col" style={{ gap: 'var(--gap-sm)' }}>
          <p className="label">{[form.name, form.last_name].filter(Boolean).join(' ') || 'Tu nombre'}</p>
          <p className="caption text-muted">Toca la foto para cambiarla</p>
          {avatarUrl && (
            <Button variant="ghost" size="sm" onClick={deleteAvatar}>
              <Trash2 size={14} style={{ color: 'var(--color-error)' }} /> Eliminar foto
            </Button>
          )}
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={handleAvatarChange}
        />
      </div>

      <form className="col col--gap-md" onSubmit={submit}>
        {error   && <Alert type="error">{error}</Alert>}
        {success && <Alert type="success">{success}</Alert>}

        {/* Datos personales */}
        <Card>
          <p className="label text-muted">Datos personales</p>
          <Divider />

          <div className="profile-row-3">
            <FormGroup label="Nombre">
              <Input name="name" value={form.name} onChange={handle} placeholder="Nombre" />
            </FormGroup>
            <FormGroup label="Apellidos">
              <Input name="last_name" value={form.last_name} onChange={handle} placeholder="Apellidos" />
            </FormGroup>
          </div>

          <FormGroup label="Sexo">
            <Select name="sex" value={form.sex} onChange={handle}>
              {SEX_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </Select>
          </FormGroup>

          <FormGroup label="Fecha de nacimiento (opcional)">
            <Input
              name="birth_date"
              type="date"
              value={form.birth_date}
              onChange={handle}
              max={new Date().toISOString().split('T')[0]}
            />
          </FormGroup>

          <FormGroup label={hasBirthDate ? 'Edad (calculada automáticamente)' : 'Edad (opcional)'}>
            <Input
              name="age"
              type="number"
              value={form.age}
              onChange={handle}
              placeholder="Años"
              min="10"
              max="100"
              disabled={hasBirthDate}
              style={hasBirthDate ? { opacity: 0.5 } : {}}
            />
          </FormGroup>

          <div className="profile-row-3">
            <FormGroup label="Altura (cm)">
              <Input name="height_cm" type="number" value={form.height_cm} onChange={handle} placeholder="cm" />
            </FormGroup>
            <FormGroup label="Peso (kg)">
              <Input name="weight_kg" type="number" value={form.weight_kg} onChange={handle} placeholder="kg" step="0.1" />
            </FormGroup>
          </div>
        </Card>

        {/* Condiciones */}
        <Card>
          <div className="row" style={{ gap: 'var(--space-icon-text)' }}>
            <Activity size={16} style={{ color: 'var(--color-warning)' }} />
            <p className="label">Dolencias, lesiones o condiciones especiales</p>
          </div>
          <Textarea
            name="conditions"
            value={form.conditions}
            onChange={handle}
            placeholder={"Escribe una por línea\nEj: Dolor lumbar crónico\nEj: Rodilla derecha operada"}
            rows={4}
          />
          <p className="caption">Esta información ayuda al admin a adaptar los ejercicios</p>
        </Card>

        <Button type="submit" full disabled={loading}>
          {loading ? 'Guardando...' : 'Guardar cambios'}
        </Button>
      </form>

      <Divider />

      <Button variant="danger" full onClick={logout}>
        <LogOut size={18} /> Cerrar sesión
      </Button>
    </div>
  )
}
