import { useParams, useNavigate } from 'react-router-dom'
import { useFetch } from '../../hooks/useFetch'
import { Card, Pill, LoadingPage, StatBox, Divider } from '../../components/ui/index'
import { Button } from '../../components/ui/Button'
import { ChevronLeft, Activity, Calendar, AlertTriangle } from 'lucide-react'

export default function AdminUserDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { data: user, loading } = useFetch(`/admin/users/${id}`)

  if (loading) return <LoadingPage />
  if (!user)   return null

  return (
    <div className="page">
      <Button variant="ghost" size="sm" onClick={() => navigate('/admin/users')}>
        <ChevronLeft size={18} /> Usuarios
      </Button>

      <div className="col" style={{ gap: 'var(--space-title-subtitle)' }}>
        <h1 className="title-page">{user.name}</h1>
        <div className="row" style={{ gap: 'var(--gap-sm)' }}>
          <p className="caption text-muted">{user.email}</p>
          {user.role === 'admin' && <Pill variant="warning">Admin</Pill>}
        </div>
      </div>

      {/* Datos físicos */}
      <Card>
        <p className="label text-muted">Datos personales</p>
        <Divider />
        <div className="row" style={{ gap: 'var(--gap-md)', flexWrap: 'wrap' }}>
          {user.age        && <StatBox value={`${user.age} años`}    label="Edad" />}
          {user.height_cm  && <StatBox value={`${user.height_cm} cm`} label="Altura" />}
          {user.weight_kg  && <StatBox value={`${user.weight_kg} kg`} label="Peso" />}
        </div>
      </Card>

      {/* Condiciones */}
      {user.conditions?.length > 0 && (
        <Card>
          <div className="row" style={{ gap: 'var(--space-icon-text)' }}>
            <AlertTriangle size={16} style={{ color: 'var(--color-warning)' }} />
            <p className="label">Dolencias / condiciones</p>
          </div>
          <Divider />
          <div className="col" style={{ gap: 'var(--gap-sm)' }}>
            {user.conditions.map((c, i) => (
              <div key={i} className="row" style={{ gap: 'var(--space-icon-text)' }}>
                <span style={{ color: 'var(--color-warning)' }}>·</span>
                <p className="body-text">{c}</p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Últimas sesiones */}
      {user.recent_sessions?.length > 0 && (
        <>
          <div className="row" style={{ gap: 'var(--space-icon-text)' }}>
            <Activity size={18} style={{ color: 'var(--color-primary)' }} />
            <h2 className="title-section">Últimas sesiones</h2>
          </div>
          <div className="col col--gap-md">
            {user.recent_sessions.map(s => (
              <Card key={s.id}>
                <div className="row row--between">
                  <div className="row" style={{ gap: 'var(--gap-sm)' }}>
                    <Calendar size={16} style={{ color: 'var(--color-primary)' }} />
                    <p className="label">{new Date(s.session_date).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
                  </div>
                  <Pill variant={s.type === 'group' ? 'warning' : 'muted'}>
                    {s.type === 'group' ? 'Grupal' : s.block_name || 'Bloque'}
                  </Pill>
                </div>
              </Card>
            ))}
          </div>
        </>
      )}

      <p className="caption text-muted" style={{ textAlign: 'center' }}>
        Usuario desde {new Date(user.created_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
      </p>
    </div>
  )
}
