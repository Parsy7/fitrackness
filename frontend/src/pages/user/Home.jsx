import { useAuth } from '../../context/AuthContext'
import { useFetch } from '../../hooks/useFetch'
import { Card, StatBox, Pill, LoadingPage, EmptyState } from '../../components/ui/index'
import { Button } from '../../components/ui/Button'
import { useNavigate } from 'react-router-dom'
import { Dumbbell, TrendingUp, Calendar } from 'lucide-react'
import './Home.css'

export default function Home() {
  const { user }  = useAuth()
  const navigate  = useNavigate()
  const { data: stats,    loading: loadingStats }    = useFetch('/stats/overview')
  const { data: sessions, loading: loadingSessions } = useFetch('/sessions?page=1')
  const { data: block,    loading: loadingBlock }    = useFetch('/blocks/active')

  if (loadingStats || loadingSessions || loadingBlock) return <LoadingPage />

  return (
    <div className="page">
      {/* Cabecera */}
      <div className="col" style={{ gap: 'var(--space-title-subtitle)' }}>
        <p className="caption">Bienvenida de vuelta</p>
        <h1 className="title-page">{user?.name}</h1>
      </div>

      {/* Stats rápidas */}
      {stats && (
        <Card>
          <div className="stats-row">
            <StatBox value={stats.total_sessions}      label="Sesiones totales" />
            <StatBox value={stats.sessions_this_month} label="Este mes" />
            <StatBox value={stats.total_prs}           label="Récords" />
          </div>
        </Card>
      )}

      {/* Bloque activo */}
      <div className="col" style={{ gap: 'var(--space-title-subtitle)' }}>
        <h2 className="title-section">Bloque activo</h2>
      </div>

      {block ? (
        <Card>
          <div className="row row--between">
            <div className="col" style={{ gap: 4 }}>
              <p className="pretitle">{block.name}</p>
              <p className="caption">Desde {new Date(block.start_date).toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })}</p>
            </div>
            <Pill variant="primary">{block.exercises?.length} ejercicios</Pill>
          </div>
          <Button full onClick={() => navigate('/session/new')}>
            <Dumbbell size={18} /> Registrar sesión
          </Button>
        </Card>
      ) : (
        <EmptyState
          icon={<Dumbbell size={40} />}
          title="Sin bloque activo"
          description="El admin aún no ha publicado un bloque"
        />
      )}

      {/* Últimas sesiones */}
      <div className="row row--between">
        <h2 className="title-section">Últimas sesiones</h2>
        <Button variant="ghost" size="sm" onClick={() => navigate('/sessions')}>Ver todas</Button>
      </div>

      {sessions?.data?.length > 0 ? (
        <div className="col col--gap-md">
          {sessions.data.slice(0, 5).map(s => (
            <Card key={s.id} onClick={() => navigate(`/session/${s.id}`)}>
              <div className="row row--between">
                <div className="row">
                  <Calendar size={16} style={{ color: 'var(--color-primary)' }} />
                  <span className="label">{new Date(s.session_date).toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' })}</span>
                </div>
                <Pill variant={s.type === 'group' ? 'warning' : 'muted'}>
                  {s.type === 'group' ? 'Grupal' : s.block_name || 'Bloque'}
                </Pill>
              </div>
              {s.general_notes && <p className="caption">{s.general_notes}</p>}
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={<TrendingUp size={40} />}
          title="Sin sesiones aún"
          description="Registra tu primera sesión para ver tu progreso"
          action={<Button onClick={() => navigate('/session/new')}>Empezar</Button>}
        />
      )}
    </div>
  )
}
