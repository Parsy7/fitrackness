import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useFetch } from '../../hooks/useFetch'
import { api } from '../../utils/api'
import { Card, Pill, EmptyState, LoadingPage, Alert } from '../../components/ui/index'
import { Button } from '../../components/ui/Button'
import { Modal } from '../../components/ui/Modal'
import { FormGroup, Input, Select } from '../../components/ui/Form'
import { Users, Plus, Trash2, ChevronRight, Activity } from 'lucide-react'

const EMPTY_FORM = { name: '', email: '', password: '', role: 'user' }

export default function AdminUsers() {
  const { data, loading, refetch } = useFetch('/admin/users')
  const navigate = useNavigate()
  const [modal, setModal]   = useState(false)
  const [form, setForm]     = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [error, setError]   = useState('')

  const handle = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }))

  const create = async () => {
    setError('')
    setSaving(true)
    try {
      if (!form.name || !form.email || !form.password) {
        setError('Nombre, email y contraseña son obligatorios')
        setSaving(false)
        return
      }
      await api.post('/auth/register', form)
      setModal(false)
      setForm(EMPTY_FORM)
      refetch()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const deleteUser = async id => {
    if (!confirm('¿Eliminar este usuario y todos sus datos?')) return
    try { await api.delete(`/admin/users/${id}`); refetch() }
    catch (err) { alert(err.message) }
  }

  const users = data?.data || []
  if (loading) return <LoadingPage />

  return (
    <div className="page">
      <div className="row row--between">
        <h1 className="title-page">Usuarios</h1>
        <Button size="sm" onClick={() => { setModal(true); setForm(EMPTY_FORM); setError('') }}>
          <Plus size={16} /> Nuevo
        </Button>
      </div>

      {users.length === 0 ? (
        <EmptyState
          icon={<Users size={40} />}
          title="Sin usuarios"
          description="Crea el primer usuario"
          action={<Button onClick={() => setModal(true)}><Plus size={16} /> Crear usuario</Button>}
        />
      ) : (
        <div className="col col--gap-md">
          {users.map(u => (
            <Card key={u.id} onClick={() => navigate(`/admin/users/${u.id}`)}>
              <div className="row row--between">
                <div className="col" style={{ gap: 4, flex: 1 }}>
                  <div className="row" style={{ gap: 'var(--gap-sm)' }}>
                    <p className="subtitle">{u.name}</p>
                    {u.role === 'admin' && <Pill variant="warning">Admin</Pill>}
                  </div>
                  <p className="caption text-muted">{u.email}</p>
                </div>
                <div className="row">
                  {u.last_session && (
                    <p className="caption text-muted">
                      {new Date(u.last_session).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                    </p>
                  )}
                  <ChevronRight size={18} style={{ color: 'var(--color-text-muted)' }} />
                </div>
              </div>

              <div className="row" style={{ gap: 'var(--gap-sm)' }}>
                <Pill variant="muted"><Activity size={12} /> {u.total_sessions || 0} sesiones</Pill>
                {u.conditions?.length > 0 && (
                  <Pill variant="warning">{u.conditions.length} condición{u.conditions.length > 1 ? 'es' : ''}</Pill>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Modal nuevo usuario */}
      <Modal open={modal} onClose={() => setModal(false)} title="Nuevo usuario">
        {error && <Alert type="error">{error}</Alert>}

        <FormGroup label="Nombre *">
          <Input name="name" value={form.name} onChange={handle} placeholder="Nombre completo" />
        </FormGroup>
        <FormGroup label="Email *">
          <Input name="email" type="email" value={form.email} onChange={handle} placeholder="email@ejemplo.com" />
        </FormGroup>
        <FormGroup label="Contraseña *">
          <Input name="password" type="password" value={form.password} onChange={handle} placeholder="Contraseña inicial" />
        </FormGroup>
        <FormGroup label="Rol">
          <Select name="role" value={form.role} onChange={handle}>
            <option value="user">Usuario</option>
            <option value="admin">Admin</option>
          </Select>
        </FormGroup>

        <div className="row" style={{ justifyContent: 'flex-end', gap: 'var(--gap-sm)' }}>
          <Button variant="secondary" onClick={() => setModal(false)}>Cancelar</Button>
          <Button onClick={create} disabled={saving}>{saving ? 'Creando...' : 'Crear usuario'}</Button>
        </div>
      </Modal>
    </div>
  )
}
