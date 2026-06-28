// La URL base de la API se inyecta por entorno (ver .env.development / .env.production)
// Dev: Apache de WAMP. Prod: mismo origen del subdominio, ruta relativa /backend
const BASE = import.meta.env.VITE_API_URL || '/backend'

async function request(method, path, body, isFormData = false) {
  const token = localStorage.getItem('ft_token')
  const headers = {}
  if (token) headers['Authorization'] = `Bearer ${token}`
  if (!isFormData) headers['Content-Type'] = 'application/json'

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: isFormData ? body : body ? JSON.stringify(body) : undefined,
  })

  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || `Error ${res.status}`)
  return data
}

export const api = {
  get:    (path)             => request('GET',    path),
  post:   (path, body)       => request('POST',   path, body),
  put:    (path, body)       => request('PUT',    path, body),
  delete: (path)             => request('DELETE', path),
  upload: (path, formData)   => request('POST',   path, formData, true),
}
