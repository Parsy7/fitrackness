import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// La URL de la API se configura por entorno con VITE_API_URL
// (.env.development / .env.production). No se usa proxy.
export default defineConfig({
  plugins: [react()],
})
