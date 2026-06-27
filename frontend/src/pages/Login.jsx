import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Button } from '../components/ui/Button'
import { FormGroup, Input } from '../components/ui/Form'
import { Alert } from '../components/ui/index'
import './Login.css'

export default function Login() {
  const { login }    = useAuth()
  const navigate     = useNavigate()
  const [form, setForm]   = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handle = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }))

  const submit = async e => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(form.email, form.password)
      navigate('/')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-page">
      <div className="login-header">
        <h1 className="title-page">FITRACKNESS</h1>
        <p className="caption">Tu progreso, tu historia</p>
      </div>

      <form className="login-form col" onSubmit={submit}>
        {error && <Alert type="error">{error}</Alert>}

        <FormGroup label="Email">
          <Input
            type="email"
            name="email"
            value={form.email}
            onChange={handle}
            placeholder="tu@email.com"
            autoComplete="email"
            required
          />
        </FormGroup>

        <FormGroup label="Contraseña">
          <Input
            type="password"
            name="password"
            value={form.password}
            onChange={handle}
            placeholder="••••••••"
            autoComplete="current-password"
            required
          />
        </FormGroup>

        <Button type="submit" full disabled={loading}>
          {loading ? 'Entrando...' : 'Entrar'}
        </Button>
      </form>
    </div>
  )
}
