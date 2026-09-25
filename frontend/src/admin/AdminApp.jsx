import { useEffect, useState } from 'react'
import {
  ArrowLeft,
  BarChart3,
  Bot,
  Clapperboard,
  LayoutDashboard,
  LogOut,
  Megaphone,
  Menu,
  Users,
  X,
} from 'lucide-react'
import { useDemoDb } from '../lib/demoDb'
import { openAgents } from '../lib/demoStats'
import { adminUitloggen, isAdmin, probeerAdmin } from '../lib/adminSlot'
import Dashboard from './Dashboard'
import Agents from './Agents'
import Publiceren from './Publiceren'
import Data from './Data'
import Gebruikers from './Gebruikers'
import DemoBediening from './DemoBediening'
import './admin.css'

// /admin — de admin-kant: dashboard, agents, publiceren, data, gebruikers en
// de demo-bediening. Iets heel anders dan de app: licht en zakelijk, over de
// volle breedte (niet in het telefoonvak), met clubrood als accent. Alle
// cijfers = startwaarden + wat er live in de app gebeurt (lib/demoDb.js), en
// wat hier gepubliceerd wordt, is meteen in de app te zien.
// Toegang: demo-slot met code 0000 (lib/adminSlot.js) — geen echte beveiliging.
const MENU = [
  { pad: '', label: 'Dashboard', Icon: LayoutDashboard, Scherm: Dashboard },
  { pad: 'agents', label: 'Agents', Icon: Bot, Scherm: Agents, badge: true },
  { pad: 'publiceren', label: 'Publiceren', Icon: Megaphone, Scherm: Publiceren },
  { pad: 'data', label: 'Data', Icon: BarChart3, Scherm: Data },
  { pad: 'gebruikers', label: 'Gebruikers', Icon: Users, Scherm: Gebruikers },
  { pad: 'demo', label: 'Demo', Icon: Clapperboard, Scherm: DemoBediening },
]

// "/admin/publiceren/nieuws" -> ["publiceren", "nieuws"]
const delenUitPad = () => window.location.pathname.replace(/^\/admin\/?/, '').split('/').filter(Boolean)

function Slot({ onBinnen }) {
  const [code, setCode] = useState('')
  const [fout, setFout] = useState('')
  return (
    <div className="adm-slot">
      <form
        className="adm-slot__kaart"
        onSubmit={(e) => {
          e.preventDefault()
          if (probeerAdmin(code)) onBinnen()
          else setFout('Onjuiste code')
        }}
      >
        <img src="/logo.png" alt="" />
        <h1>Admin FC Twente-app</h1>
        <p>Demo-omgeving. Vul de code in.</p>
        <input type="password" inputMode="numeric" placeholder="Code" aria-label="Admin-code" value={code} onChange={(e) => setCode(e.target.value)} autoFocus />
        {fout && <p className="adm-fout" role="alert">{fout}</p>}
        <button type="submit" className="adm-knop adm-knop--primair">Inloggen</button>
        <a className="adm-link" href="/">Terug naar de app</a>
      </form>
    </div>
  )
}

export default function AdminApp() {
  const w = useDemoDb() // alles live: ook wijzigingen uit de app in een ander tabblad
  const [binnen, setBinnen] = useState(isAdmin)
  const [delen, setDelen] = useState(delenUitPad)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const opPad = () => setDelen(delenUitPad())
    window.addEventListener('popstate', opPad)
    return () => window.removeEventListener('popstate', opPad)
  }, [])

  useEffect(() => {
    document.title = 'Admin · FC Twente-app'
  }, [])

  // Navigeren binnen de admin (eigen adres per scherm, terugknop werkt)
  function ga(pad) {
    window.history.pushState(null, '', `/admin${pad ? `/${pad}` : ''}`)
    setDelen(delenUitPad())
    setMenuOpen(false)
    window.scrollTo(0, 0)
  }

  function uitloggen() {
    adminUitloggen()
    window.location.href = '/'
  }

  if (!binnen) return <Slot onBinnen={() => setBinnen(true)} />

  const actief = MENU.find((m) => m.pad === (delen[0] ?? '')) ?? MENU[0]
  const { Scherm } = actief
  const open = openAgents(w)

  return (
    <div className={`adm${menuOpen ? ' menu-open' : ''}`}>
      <aside className="adm-zijbalk" aria-label="Admin-menu">
        <div className="adm-merk">
          <img src="/logo.png" alt="" />
          <div>
            <strong>FC Twente-app</strong>
            <span>Admin · demo</span>
          </div>
          <button type="button" className="adm-menuknop adm-menuknop--sluit" onClick={() => setMenuOpen(false)} aria-label="Menu sluiten">
            <X size={20} />
          </button>
        </div>
        <nav>
          {MENU.map(({ pad, label, Icon, badge }) => (
            <button
              key={label}
              type="button"
              className={`adm-menu__item${actief.pad === pad ? ' is-actief' : ''}`}
              aria-current={actief.pad === pad ? 'page' : undefined}
              onClick={() => ga(pad)}
            >
              <Icon size={18} strokeWidth={2} />
              <span>{label}</span>
              {badge && open > 0 && <span className="adm-badge" aria-label={`${open} open seintjes`}>{open}</span>}
            </button>
          ))}
        </nav>
        <div className="adm-zijbalk__onder">
          <a className="adm-knop adm-knop--licht" href="/">
            <ArrowLeft size={16} /> Terug naar de app
          </a>
          <button type="button" className="adm-knop adm-knop--licht" onClick={uitloggen}>
            <LogOut size={16} /> Uitloggen
          </button>
        </div>
      </aside>
      <div className="adm-schaduw" onClick={() => setMenuOpen(false)} aria-hidden="true" />

      <div className="adm-hoofd">
        <header className="adm-balk">
          <button type="button" className="adm-menuknop" onClick={() => setMenuOpen(true)} aria-label="Menu openen">
            <Menu size={22} />
          </button>
          <span className="adm-balk__titel">{actief.label}</span>
          <div className="adm-balk__rechts">
            <span className="adm-live" title="Cijfers = startwaarden + live uit de app">
              <i aria-hidden="true" /> Live
            </span>
            <a className="adm-knop adm-knop--licht adm-balk__terug" href="/">
              <ArrowLeft size={16} /> Terug naar de app
            </a>
            <button type="button" className="adm-knop adm-knop--licht adm-balk__uit" onClick={uitloggen}>
              <LogOut size={16} /> Uitloggen
            </button>
          </div>
        </header>
        <main className="adm-inhoud">
          <Scherm delen={delen.slice(1)} ga={ga} />
        </main>
      </div>
    </div>
  )
}
