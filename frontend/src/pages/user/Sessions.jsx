import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useFetch } from '../../hooks/useFetch'
import { Card, Pill, EmptyState, LoadingPage } from '../../components/ui/index'
import { Button } from '../../components/ui/Button'
import { Calendar, Dumbbell, ChevronRight, Plus } from 'lucide-react'

export default function Sessions() {
  const navigate = useNavigate()
  const [page, setPage] = useState(1)
  const { data, loading } = useFetch(`/sessions?page=${page}`, [page])

  if (loading) return <LoadingPage />

  const sessions   = data?.data || []
  const lastPage   = data?.last_page || 1

  return (
    <div className="page">
      <div className="row row--between">
        <h1 className="title-page">Sesiones</h1>
        <Button size="sm" onClick={() => navigate('/session/new')}>
          <Plus size={16} /> Nueva
        </Button>
      </div>

      {sessions.length === 0 ? (
        <EmptyState
          icon={<Dumbbell size={40} />}
          title="Sin sesiones"
          description="Aún no has registrado ninguna sesión"
          action={<Button onClick={() => navigate('/session/new')}>Registrar primera sesión</Button>}
        />
      ) : (
        <div className="col col--gap-md">
          {sessions.map(s => (
            <Card key={s.id} onClick={() => navigate(`/session/${s.id}`)}>
              <div className="row row--between">
                <div className="row" style={{ gap: 'var(--gap-sm)', flex: 1 }}>
                  <Calendar size={16} style={{ color: 'var(--color-primary)', flexShrink: 0 }} />
                  <div className="col" style={{ gap: 4 }}>
                    <p className="label">
                      {new Date(s.session_date).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
                    </p>
                    {s.general_notes && <p className="caption text-muted">{s.general_notes}</p>}
                  </div>
                </div>
                <div className="row" style={{ gap: 'var(--gap-sm)', flexShrink: 0 }}>
                  <Pill variant={s.type === 'group' ? 'warning' : 'muted'}>
                    {s.type === 'group' ? 'Grupal' : s.block_name || 'Bloque'}
                  </Pill>
                  <ChevronRight size={16} style={{ color: 'var(--color-text-muted)' }} />
                </div>
              </div>
            </Card>
          ))}

          {/* Paginación */}
          {lastPage > 1 && (
            <div className="row" style={{ justifyContent: 'center', gap: 'var(--gap-sm)' }}>
              <Button variant="secondary" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Anterior</Button>
              <span className="caption">{page} / {lastPage}</span>
              <Button variant="secondary" size="sm" disabled={page === lastPage} onClick={() => setPage(p => p + 1)}>Siguiente</Button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
