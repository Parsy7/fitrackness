import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { api } from '../../utils/api'
import { Card, Alert, Divider } from '../../components/ui/index'
import { Button } from '../../components/ui/Button'
import { FormGroup, Input, Textarea } from '../../components/ui/Form'
import { LogOut, User, Activity } from 'lucide-react'

export default function Profile() {
  const { user, logout } = useAuth()
  const [form, setForm]   = useState({ name: '', age: '', height_cm: '', weight_kg: '', conditions: '' })
  const [success, setSuccess] = useState('')
  const [error, setError]   = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    api.get('/auth/me').then(data => {
      setForm({
        name:       data.name       || '',
        age:        data.age        || '',
        height_cm:  data.height_cm  || '',
        weight_kg:  data.weight_kg  || '',
        conditions: data.conditions?.join('\n') || '',
      })
    })
  }, [])

  const handle = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }))

  const submit = async e => {
    e.preventDefault()
    setError(''); setSuccess('')
    setLoading(true)
    try {
      await api.put('/users/profile', {
        name:       form.name,
        age:        form.age       ? parseInt(form.age)       : undefined,
        height_cm:  form.height_cm ? parseFloat(form.height_cm) : undefined,
        weight_kg:  form.weight_kg ? parseFloat(form.weight_kg) : undefined,
        conditions: form.conditions.split('\n').map(s => s.trim()).filter(Boolean),
      })
      setSuccess('Perfil actualizado')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page">
      <div className="row" style={{ gap: 'var(--gap-sm)' }}>
        <User size={22} style={{ color: 'var(--color-primary)' }} />
        <h1 className="title-page">Perfil</h1>
      </div>

      <form className="col col--gap-md" onSubmit={submit}>
        {error   && <Alert type="error">{error}</Alert>}
        {success && <Alert type="success">{success}</Alert>}

        <Card>
          <p className="label text-muted">Datos personales</p>
          <Divider />
          <FormGroup label="Nombre">
            <Input name="name" value={form.name} onChange={handle} placeholder="Tu nombre" />
          </FormGroup>
          <div className="row col--gap-md" style={{ flexWrap: 'wrap' }}>
            <FormGroup label="Edad">
              <Input name="age" type="number" value={form.age} onChange={handle} placeholder="Años" min="10" max="100" />
            </FormGroup>
            <FormGroup label="Altura (cm)">
              <Input name="height_cm" type="number" value={form.height_cm} onChange={handle} placeholder="cm" />
            </FormGroup>
            <FormGroup label="Peso (kg)">
              <Input name="weight_kg" type="number" value={form.weight_kg} onChange={handle} placeholder="kg" step="0.1" />
            </FormGroup>
          </div>
        </Card>

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
