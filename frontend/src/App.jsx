import { useState } from 'react'
import BottomNav from './components/BottomNav'
import Home from './pages/Home'
import Wedstrijden from './pages/Wedstrijden'
import Fan from './pages/Fan'
import Tickets from './pages/Tickets'
import Meer from './pages/Meer'

// Tabwissel via React-state — voor deze stap volstaat dit, geen routerbibliotheek nodig.
const PAGINAS = {
  home: Home,
  wedstrijden: Wedstrijden,
  fan: Fan,
  tickets: Tickets,
  meer: Meer,
}

export default function App() {
  const [tab, setTab] = useState('home')
  const Pagina = PAGINAS[tab]

  return (
    <div className="app-shell">
      <header className="app-topbar">
        <img src="/logo.png" alt="FC Twente" className="app-topbar__logo" />
        <span className="app-topbar__title">FC Twente</span>
      </header>

      <main className="app-main">
        <Pagina />
      </main>

      <BottomNav actief={tab} onWissel={setTab} />
    </div>
  )
}
