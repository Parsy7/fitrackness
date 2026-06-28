import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useFetch } from '../../hooks/useFetch'
import { Card, StatBox, Pill, LoadingPage, EmptyState, Divider } from '../../components/ui/index'
import { Button } from '../../components/ui/Button'
import { useNavigate } from 'react-router-dom'
import { Dumbbell, TrendingUp, Calendar, ChevronDown, ChevronUp } from 'lucide-react'
import './Home.css'

export default function Home() {
  const { user }  = useAuth()
  const navigate  = useNavigate()
  const { data: stats,    loading: loadingStats }    = useFetch('/stats/overview')
  const { data: sessions, loading: loadingSessions } = useFetch('/sessions?page=1')
  const { data: block,    loading: loadingBlock }    = useFetch('/blocks/active')

  const [expandedSub, setExpandedSub] = useState(null) // sub-bloque expandido

  if (loadingStats || loadingSessions || loadingBlock) return <LoadingPage />

  // Agrupar ejercicios del bloque por sub-bloque
  const subBlocks = block?.exercises
    ? Object.entries(
        block.exercises.reduce((acc, ex) => {
          const key = ex.sub_block || 'General'
          if (!acc[key]) acc[key] = []
          acc[key].push(ex)
          return acc
        }, {})
      ).sort(([a], [b]) => a.localeCompare(b))
    : []

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
      <h2 className="title-section">Bloque activo</h2>

      {block ? (
        <Card>
          {/* Cabecera del bloque */}
          <div className="row row--between">
            <div className="col" style={{ gap: 4 }}>
              <p className="pretitle">{block.name}</p>
              <p className="caption">Desde {new Date(block.start_date).toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })}</p>
            </div>
            <Pill variant="primary">{subBlocks.length} bloques</Pill>
          </div>

          <Divider />

          {/* Sub-bloques expandibles */}
          <div className="col" style={{ gap: 'var(--gap-sm)' }}>
            {subBlocks.map(([sub, exercises]) => (
              <div key={sub} className="subblock-item">
                {/* Header del sub-bloque */}
                <div
                  className="subblock-header"
                  onClick={() => setExpandedSub(expandedSub === sub ? null : sub)}
                >
                  <div className="row" style={{ gap: 'var(--gap-sm)' }}>
                    <span className="subblock-letter">{sub}</span>
                    <span className="label">{exercises.length} ejercicios</span>
                  </div>
                  <div className="row" style={{ gap: 'var(--gap-sm)' }}>
                    <Button
                      size="sm"
                      onClick={e => { e.stopPropagation(); navigate('/session/new') }}
                    >
                      <Dumbbell size={14} /> Hacer
                    </Button>
                    {expandedSub === sub
                      ? <ChevronUp size={16} style={{ color: 'var(--color-text-muted)' }} />
                      : <ChevronDown size={16} style={{ color: 'var(--color-text-muted)' }} />
                    }
                  </div>
                </div>

                {/* Lista de ejercicios del sub-bloque */}
                {expandedSub === sub && (
                  <div className="subblock-exercises">
                    {exercises.map((ex, i) => (
                      <div key={ex.id || i} className="subblock-exercise-row">
                        <span className="subblock-num">{i + 1}</span>
                        <div className="col" style={{ gap: 2, flex: 1 }}>
                          <span className="label">{ex.canonical_name}</span>
                          {(ex.recommended_sets || ex.recommended_reps) && (
                            <span className="caption">
                              {ex.recommended_sets && `${ex.recommended_sets}×`}{ex.recommended_reps}
                              {ex.recommended_rest_seconds ? ` · R:${ex.recommended_rest_seconds}s` : ''}
                            </span>
                          )}
                          {ex.notes && <span className="caption text-muted">{ex.notes}</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          <Divider />

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
                  {s.type === 'group' ? 'Grupal' : s.sub_block ? `Bloque ${s.sub_block}` : s.block_name || 'Bloque'}
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
