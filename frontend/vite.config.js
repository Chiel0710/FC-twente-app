import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// Frontend draait op 5190. De app roept alleen nog /api/rossie aan (de rest
// staat in de browser, zie src/api.js). Lokaal stuurt de proxy dat door naar
// de Express-backend op 4000; live (Vercel) zijn het serverless functions in
// de map api/ in de hoofdmap — dezelfde code (api/_lib/rossie.js).
const proxy = {
  '/api': {
    target: 'http://localhost:4000',
    changeOrigin: true,
  },
}

export default defineConfig({
  plugins: [react()],
  server: { port: 5190, proxy },
  // vite preview (de productiebuild lokaal testen) gebruikt dezelfde proxy
  preview: { port: 5191, proxy },
})
