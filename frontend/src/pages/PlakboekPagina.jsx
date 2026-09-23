import { ArrowLeft } from 'lucide-react'
import Plakboek from '../components/Plakboek'

// Losse pagina (bereikbaar via /plakboek) — geen tab, dus zonder bottom nav.
// Vanuit Tickets (en Home) navigeer je hier met een gewone paginawissel.
export default function PlakboekPagina() {
  return (
    <div className="plakboek-pagina">
      <header className="plakboek-pagina__header">
        <a href="/" className="plakboek-pagina__terug" aria-label="Terug naar de app">
          <ArrowLeft strokeWidth={2} />
        </a>
        <img src="/logo.png" alt="" className="plakboek-pagina__logo" />
        <span>FC Twente</span>
      </header>

      <main className="plakboek-pagina__main">
        <Plakboek />
      </main>
    </div>
  )
}
