import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// Frontend draait op 5190, backend op 4000 — bewust andere poorten dan de
// gebruikelijke 5173/3000 om conflicten met andere lokale projecten te voorkomen.
// De proxy zorgt dat de frontend alleen relatieve /api/... calls hoeft te doen.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5190,
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      },
    },
  },
})
