import { useState } from 'react'
import { useFetch } from '../../hooks/useFetch'
import { Card, StatBox, LoadingPage, EmptyState } from '../../components/ui/index'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts'
import { TrendingUp, Award } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { api } from '../../utils/api'
import './Stats.css'

const CHART_COLORS = { primary: '#A27B5C', muted: '#5C7070' }

export default function Stats() {
  const { data: overview, loading } = useFetch('/stats/overview')
  const { data: prs }               = useFetch('/stats/prs')
  const [selectedExercise, setSelectedExercise] = useState(null)
  const [progress, setProgress]                 = useState(null)

  const loadProgress = async (exerciseId, name) => {
    const data = await api.get(`/stats/exercise/${exerciseId}`)
    setProgress({ ...data, name })
    setSelectedExercise(exerciseId)
  }

  if (loading) return <LoadingPage />

  return (
    <div className="page">
      <h1 className="title-page">Estadísticas</h1>

      {/* Overview */}
      {overview && (
        <Card>
          <div className="stats-grid">
            <StatBox value={overview.total_sessions}      label="Sesiones" />
            <StatBox value={overview.sessions_this_month} label="Este mes" />
            <StatBox value={overview.total_prs}           label="PRs" />
            <StatBox value={overview.total_exercises}     label="Ejercicios" />
          </div>
        </Card>
      )}

      {/* Actividad semanal */}
      {overview?.weekly_activity?.length > 0 && (
        <Card>
          <p className="label">Actividad — últimas 8 semanas</p>
          <div className="chart-wrap">
            <ResponsiveContainer width="100%" height={140}>
              <BarChart data={overview.weekly_activity} barSize={16}>
                <XAxis dataKey="week" hide />
                <YAxis hide />
                <Tooltip
                  contentStyle={{ background: 'var(--color-bg-card)', border: 'var(--border-card)', borderRadius: 'var(--radius-sm)', color: 'var(--color-text)', fontSize: 'var(--text-xs)' }}
                  cursor={{ fill: 'var(--color-bg-elevated)' }}
                />
                <Bar dataKey="sessions" fill={CHART_COLORS.primary} radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      )}

      {/* PRs */}
      {prs?.length > 0 && (
        <>
          <div className="row" style={{ gap: 'var(--space-icon-text)' }}>
            <Award size={20} style={{ color: 'var(--color-primary)' }} />
            <h2 className="title-section">Récords personales</h2>
          </div>
          <div className="col col--gap-md">
            {prs.map(pr => (
              <Card key={pr.exercise_id} onClick={() => loadProgress(pr.exercise_id, pr.canonical_name)}>
                <div className="row row--between">
                  <div className="col" style={{ gap: 4 }}>
                    <p className="label">{pr.canonical_name}</p>
                    <p className="caption">{new Date(pr.achieved_at).toLocaleDateString('es-ES')}</p>
                  </div>
                  <div className="stat-value">{pr.weight_kg} kg</div>
                </div>
              </Card>
            ))}
          </div>
        </>
      )}

      {/* Progreso de ejercicio seleccionado */}
      {progress && (
        <Card>
          <div className="row row--between">
            <div className="row" style={{ gap: 'var(--space-icon-text)' }}>
              <TrendingUp size={16} style={{ color: 'var(--color-primary)' }} />
              <p className="label">{progress.name}</p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setProgress(null)}>×</Button>
          </div>
          {progress.history?.length > 1 ? (
            <div className="chart-wrap">
              <ResponsiveContainer width="100%" height={160}>
                <LineChart data={progress.history}>
                  <XAxis dataKey="session_date" hide />
                  <YAxis hide domain={['auto', 'auto']} />
                  <Tooltip
                    contentStyle={{ background: 'var(--color-bg-card)', border: 'var(--border-card)', borderRadius: 'var(--radius-sm)', color: 'var(--color-text)', fontSize: 'var(--text-xs)' }}
                    formatter={v => [`${v} kg`, 'Peso']}
                  />
                  <Line type="monotone" dataKey="weight_kg" stroke={CHART_COLORS.primary} strokeWidth={2} dot={{ fill: CHART_COLORS.primary, r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="caption">Necesitas al menos 2 registros para ver la gráfica</p>
          )}
          {progress.personal_record && (
            <p className="caption text-success">PR: {progress.personal_record.weight_kg} kg — {new Date(progress.personal_record.achieved_at).toLocaleDateString('es-ES')}</p>
          )}
        </Card>
      )}

      {!prs?.length && !overview?.total_sessions && (
        <EmptyState
          icon={<TrendingUp size={40} />}
          title="Sin datos aún"
          description="Registra sesiones para ver tus estadísticas"
        />
      )}
    </div>
  )
}
