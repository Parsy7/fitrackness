import { useParams, useNavigate } from 'react-router-dom'
import { useFetch } from '../../hooks/useFetch'
import { Card, Pill, LoadingPage, Divider, EmptyState } from '../../components/ui/index'
import { Button } from '../../components/ui/Button'
import { ChevronLeft, Calendar, Dumbbell, Weight } from 'lucide-react'

export default function SessionDetail() {
  const { id }   = useParams()
  const navigate = useNavigate()
  const { data: session, loading } = useFetch(`/sessions/${id}`)

  if (loading) return <LoadingPage />
  if (!session) return null

  const grouped = (session.exercises || []).reduce((acc, ex) => {
    const key = ex.sub_block || 'General'
    if (!acc[key]) acc[key] = []
    acc[key].push(ex)
    return acc
  }, {})

  return (
    <div className="page">
      <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
        <ChevronLeft size={18} /> Volver
      </Button>

      {/* Cabecera */}
      <div className="col" style={{ gap: 'var(--space-title-subtitle)' }}>
        <div className="row" style={{ gap: 'var(--gap-sm)' }}>
          <Calendar size={18} style={{ color: 'var(--color-primary)' }} />
          <h1 className="title-page">
            {new Date(session.session_date).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
          </h1>
        </div>
        <div className="row" style={{ gap: 'var(--gap-sm)' }}>
          <Pill variant={session.type === 'group' ? 'warning' : 'primary'}>
            {session.type === 'group' ? 'Sesión grupal' : session.block_name || 'Bloque'}
          </Pill>
        </div>
      </div>

      {session.general_notes && (
        <Card variant="flat">
          <p className="caption text-muted">{session.general_notes}</p>
        </Card>
      )}

      {session.type === 'group' ? (
        <EmptyState
          icon={<Dumbbell size={40} />}
          title="Sesión grupal"
          description="Esta sesión no tiene ejercicios individuales registrados"
        />
      ) : (
        Object.entries(grouped).map(([subBlock, exercises]) => (
          <div key={subBlock} className="col col--gap-md">
            {subBlock !== 'General' && <Pill variant="primary" style={{ alignSelf: 'flex-start' }}>Bloque {subBlock}</Pill>}

            {exercises.map(ex => (
              <Card key={ex.id}>
                <div className="row row--between">
                  <p className="subtitle">{ex.canonical_name}</p>
                  {ex.muscle_group && <Pill variant="muted">{ex.muscle_group}</Pill>}
                </div>

                {/* Resultado real */}
                <div className="row" style={{ gap: 'var(--gap-md)', flexWrap: 'wrap' }}>
                  {ex.sets_done && (
                    <div className="stat-box">
                      <span className="stat-value">{ex.sets_done}</span>
                      <span className="stat-label">Series</span>
                    </div>
                  )}
                  {ex.reps_done && (
                    <div className="stat-box">
                      <span className="stat-value">{ex.reps_done}</span>
                      <span className="stat-label">Reps</span>
                    </div>
                  )}
                  {ex.weight_kg && (
                    <div className="stat-box">
                      <span className="stat-value">{ex.weight_kg} kg</span>
                      <span className="stat-label">Peso</span>
                    </div>
                  )}
                  {ex.rpe && (
                    <div className="stat-box">
                      <span className="stat-value">{ex.rpe}/10</span>
                      <span className="stat-label">Esfuerzo</span>
                    </div>
                  )}
                </div>

                {ex.adaptation && (
                  <div className="row" style={{ gap: 'var(--space-icon-text)' }}>
                    <Pill variant="warning">Adaptación</Pill>
                    <p className="caption">{ex.adaptation}</p>
                  </div>
                )}

                {ex.notes && <p className="caption text-muted">{ex.notes}</p>}

                {/* Media del ejercicio */}
                {ex.media?.length > 0 && (
                  <div className="row" style={{ gap: 'var(--gap-sm)', flexWrap: 'wrap' }}>
                    {ex.media.map(m => (
                      <div key={m.id} style={{ width: 80, height: 80, borderRadius: 'var(--radius-sm)', overflow: 'hidden', border: 'var(--border-card)' }}>
                        {m.type === 'photo'
                          ? <img src={`/uploads/${m.url}`} alt={m.caption || ''} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          : <video src={`/uploads/${m.url}`} controls style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        }
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            ))}
          </div>
        ))
      )}
    </div>
  )
}
