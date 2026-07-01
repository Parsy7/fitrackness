import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useFetch } from '../../hooks/useFetch'
import { api } from '../../utils/api'
import { Card, Pill, EmptyState, LoadingPage, Alert } from '../../components/ui/index'
import { Button } from '../../components/ui/Button'
import { Calendar, Dumbbell, ChevronRight, Trash2 } from 'lucide-react'
import './Sessions.css'

export default function Sessions() {
  const navigate = useNavigate()
  const [page, setPage]           = useState(1)
  const [confirmId, setConfirmId] = useState(null)
  const [deleting,  setDeleting]  = useState(false)
  const [error,     setError]     = useState('')
  const { data, loading, refetch } = useFetch(`/sessions?page=${page}`, [page])

  const sessions = data?.data      || []
  const lastPage = data?.last_page || 1

  const deleteSession = async (id) => {
    setDeleting(true)
    setError('')
    try {
      await api.delete(`/sessions/${id}`)
      setConfirmId(null)
      refetch()
    } catch (e) {
      setError(e.message)
    } finally {
      setDeleting(false)
    }
  }

  if (loading) return <LoadingPage />

  return (
    <div className="page">
      <h1 className="title-page">Mis entrenamientos</h1>

      {error && <Alert type="error">{error}</Alert>}

      {sessions.length === 0 ? (
        <EmptyState
          icon={<Dumbbell size={40} />}
          title="Sin entrenamientos"
          description="Aún no has registrado ningún entrenamiento"
          action={<Button onClick={() => navigate('/session/new')}>Empezar el primero</Button>}
        />
      ) : (
        <div className="col col--gap-md">
          {sessions.map(s => (
            <div key={s.id}>
              <Card>
                <div className="row row--between">
                  {/* Info — navega al detalle */}
                  <div
                    className="row"
                    style={{ gap: 'var(--gap-sm)', flex: 1, cursor: 'pointer' }}
                    onClick={() => confirmId !== s.id && navigate(`/session/${s.id}`)}
                  >
                    <Calendar size={16} style={{ color: 'var(--color-primary)', flexShrink: 0 }} />
                    <div className="col" style={{ gap: 4 }}>
                      <p className="label">
                        {new Date(s.session_date).toLocaleDateString('es-ES', {
                          weekday: 'long', day: 'numeric', month: 'long'
                        })}
                      </p>
                      {s.block_name && (
                        <p className="caption text-muted">
                          {s.block_name}{s.sub_block ? ` · Bloque ${s.sub_block}` : ''}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Acciones */}
                  <div className="row" style={{ gap: 'var(--gap-sm)', flexShrink: 0 }}>
                    <Pill variant={s.type === 'group' ? 'warning' : 'muted'}>
                      {s.type === 'group' ? 'Grupal' : s.sub_block || 'Bloque'}
                    </Pill>
                    {confirmId !== s.id ? (
                      <>
                        <ChevronRight
                          size={16}
                          style={{ color: 'var(--color-text-muted)', cursor: 'pointer' }}
                          onClick={() => navigate(`/session/${s.id}`)}
                        />
                        <button
                          className="btn btn-ghost btn--sm"
                          style={{ color: 'var(--color-error)', padding: '4px' }}
                          onClick={e => { e.stopPropagation(); setConfirmId(s.id) }}
                        >
                          <Trash2 size={16} />
                        </button>
                      </>
                    ) : null}
                  </div>
                </div>

                {/* Confirmación de borrado inline */}
                {confirmId === s.id && (
                  <div className="delete-confirm">
                    <p className="caption text-muted">¿Eliminar este entrenamiento? No se puede deshacer.</p>
                    <div className="row" style={{ gap: 'var(--gap-sm)', justifyContent: 'flex-end' }}>
                      <button className="btn btn-ghost btn--sm" onClick={() => setConfirmId(null)}>
                        Cancelar
                      </button>
                      <button
                        className="btn btn-danger btn--sm"
                        disabled={deleting}
                        onClick={() => deleteSession(s.id)}
                      >
                        {deleting ? 'Eliminando…' : 'Sí, eliminar'}
                      </button>
                    </div>
                  </div>
                )}
              </Card>
            </div>
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
