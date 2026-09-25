import { StrictMode, Suspense, lazy } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import PlakboekPagina from './pages/PlakboekPagina.jsx'

// De admin is een eigen onderdeel en wordt pas geladen als je /admin opent,
// zodat de grafieken (recharts) de app zelf niet zwaarder maken.
const AdminApp = lazy(() => import('./admin/AdminApp.jsx'))

// Simpele padcheck i.p.v. een routerbibliotheek — een paar losse routes naast
// de tab-app zijn hiermee genoeg (geen geneste routes nodig).
function kiesPagina() {
  const pad = window.location.pathname
  if (pad.startsWith('/admin')) return AdminApp
  if (pad.startsWith('/plakboek')) return PlakboekPagina
  return App
}
const Pagina = kiesPagina()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Suspense fallback={null}>
      <Pagina />
    </Suspense>
  </StrictMode>,
)
