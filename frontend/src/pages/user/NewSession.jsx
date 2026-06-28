import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useFetch } from '../../hooks/useFetch'
import { api } from '../../utils/api'
import { Card, Alert, LoadingPage, EmptyState } from '../../components/ui/index'
import { Button } from '../../components/ui/Button'
import { Dumbbell } from 'lucide-react'
import './NewSession.css'

export default function NewSession() {
  const navigate  = useNavigate()
  const { state }  = useLocation()
  const { data: block, loading } = useFetch('/blocks/active')

  const [subBlock, setSubBlock] = useState(state?.preselectedSub ?? '')
  const [starting, setStarting] = useState(false)
  const [error,    setError]    = useState('')

  const availableSubBlocks = block
    ? [...new Set(block.exercises.map(e => e.sub_block).filter(Boolean))].sort()
    : []

  const startSession = async () => {
    if (!subBlock) { setError('Elige un sub-bloque'); return }
    setError('')
    setStarting(true)

    try {
      // Crear sesión en BD
      const session = await api.post('/sessions', {
        session_date: new Date().toISOString().split('T')[0],
        type:         'block',
        block_id:     block.id,
        sub_block:    subBlock,
      })

      // Filtrar ejercicios del sub-bloque elegido
      const exercises = block.exercises
        .filter(be => be.sub_block === subBlock)
        .map(be => ({
          exercise_id:       be.exercise_id,
          block_exercise_id: be.id,
          canonical_name:    be.canonical_name,
          recommended_sets:  be.recommended_sets,
          recommended_reps:  be.recommended_reps,
          recommended_rest:  be.recommended_rest_seconds,
          sub_block:         be.sub_block,
        }))

      // Navegar a la pantalla de entreno activo
      navigate('/session/active', {
        state: {
          sessionId:   session.id,
          subBlock,
          exercises,
          complements: block.complements ?? [],
        }
      })
    } catch (err) {
      setError(err.message)
      setStarting(false)
    }
  }

  if (loading) return <LoadingPage />

  return (
    <div className="page">
      <h1 className="title-page">Nuevo entreno</h1>

      {error && <Alert type="error">{error}</Alert>}

      {!block ? (
        <Alert type="warning">No hay bloque activo</Alert>
      ) : (
        <>
          <Card>
            <p className="pretitle">{block.name}</p>
            <p className="caption text-muted">
              Desde {new Date(block.start_date).toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })}
            </p>
          </Card>

          <Card>
            <p className="label">¿Qué bloque haces hoy?</p>
            <div className="subblock-selector">
              {availableSubBlocks.map(sb => (
                <button
                  key={sb}
                  className={`subblock-btn ${subBlock === sb ? 'subblock-btn--active' : ''}`}
                  onClick={() => setSubBlock(sb)}
                  type="button"
                >
                  {sb}
                </button>
              ))}
            </div>
          </Card>

          {subBlock ? (
            <div className="col">
              <p className="caption text-muted" style={{ textAlign: 'center' }}>
                {block.exercises.filter(e => e.sub_block === subBlock).length} ejercicios
                {block.complements?.length > 0 ? ` + ${block.complements.length} complementos` : ''}
              </p>
              <Button full size="lg" onClick={startSession} disabled={starting}>
                {starting ? 'Iniciando…' : '¡Empezar sesión!'}
              </Button>
            </div>
          ) : (
            <EmptyState
              icon={<Dumbbell size={36} />}
              title="Elige un bloque para empezar"
            />
          )}
        </>
      )}
    </div>
  )
}
