import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import Admin from './pages/Admin.jsx'
import PlakboekPagina from './pages/PlakboekPagina.jsx'

// Simpele padcheck i.p.v. een routerbibliotheek — een paar losse routes naast
// de tab-app zijn hiermee genoeg (geen geneste routes nodig).
function kiesPagina() {
  const pad = window.location.pathname
  if (pad.startsWith('/admin')) return Admin
  if (pad.startsWith('/plakboek')) return PlakboekPagina
  return App
}
const Pagina = kiesPagina()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Pagina />
  </StrictMode>,
)
