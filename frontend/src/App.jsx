import { useCallback, useEffect, useState } from 'react'
import { X } from 'lucide-react'
import BottomNav from './components/BottomNav'
import Home from './pages/Home'
import Wedstrijden from './pages/Wedstrijden'
import Fan from './pages/Fan'
import Tickets from './pages/Tickets'
import Meer from './pages/Meer'
import { Inbox, MeldingToast, useDemo } from './components/LiveDemo'
import HighlightsScherm from './components/HighlightsScherm'
import RossiePagina from './pages/RossiePagina'
import Splash from './components/Splash'
import ProfielMenu from './components/ProfielMenu'
import Kopbalk from './components/Kopbalk'
import NieuwsPagina from './pages/NieuwsPagina'
import BinnenkortPagina from './pages/BinnenkortPagina'
import AanbiedingenPagina from './pages/AanbiedingenPagina'
import AnalysePagina from './pages/AnalysePagina'
import TicketPagina from './pages/TicketPagina'
import VerkopenPagina from './pages/VerkopenPagina'
import { isDemoActief, useDemoModus } from './demoModus'
import { IS_PITCH, PITCH_START, startPitch } from './pitchModus'
import { startNu } from './demoKlok'
import { leesTeamKeuze } from './lib/demoDb'
import { getProfiles, setTeamKeuze } from './api'
import { HUIDIGE_PERSONA, HUIDIG_PROFIEL_ID, leesAanwezigheid } from './profiel'
import { useKaartWedstrijd } from './kaartWedstrijd'
import { TeamKeuzeContext } from './teamKeuze'
import { NavigatieContext } from './navigatie'
import './livedemo.css'
import './splash-profiel-tegels.css'
import './home.css'
import './highlights.css'

// Tabwissel via React-state — voor deze stap volstaat dit, geen routerbibliotheek nodig.
const PAGINAS = {
  home: Home,
  wedstrijden: Wedstrijden,
  fan: Fan,
  tickets: Tickets,
  meer: Meer,
}

// ?demo=wedstrijd start de demo-wedstrijd. Module-vlag, zodat StrictMode
// (effects draaien in dev twee keer) hem niet dubbel start. Daarna halen we
// de parameter uit de URL, zodat herladen de wedstrijd niet opnieuw begint.
let demoUrlAfgehandeld = false

// Laatste teamkeuze (bewaard in de demoDb)
function leesLokaleTeamKeuze() {
  return leesTeamKeuze() === 'vrouwen' ? 'vrouwen' : 'mannen'
}
// Opstartscherm alleen bij het eerste bezoek per sessie
const SPLASH_SLEUTEL = 'fctwente_splash_gezien'
function splashAlGezien() {
  try {
    return sessionStorage.getItem(SPLASH_SLEUTEL) === 'ja'
  } catch {
    return false
  }
}

// /highlights/<datum> uit het adres (ook direct te openen)
function highlightsDatumUitPad() {
  const m = window.location.pathname.match(/^\/highlights\/(\d{4}-\d{2}-\d{2})/)
  return m ? m[1] : null
}

function startDemoViaUrl() {
  if (demoUrlAfgehandeld) return
  demoUrlAfgehandeld = true
  const params = new URLSearchParams(window.location.search)
  if (params.get('demo') !== 'wedstrijd') return
  startNu() // wedstrijd meteen laten beginnen (demoKlok.js)
  params.delete('demo')
  const rest = params.toString()
  window.history.replaceState(null, '', `${window.location.pathname}${rest ? `?${rest}` : ''}${window.location.hash}`)
}

export default function App() {
  const [tab, setTab] = useState('home')
  // Waar een pagina moet openen na een deeplink, bv. { fan: 'motm' }
  const [startIn, setStartIn] = useState({})
  // Verhogen = pagina opnieuw mounten, zodat de startwaarde opnieuw geldt
  const [navTeller, setNavTeller] = useState(0)
  const [inboxOpen, setInboxOpen] = useState(false)
  const [profielMenuOpen, setProfielMenuOpen] = useState(false)
  // Pitch: bij (her)laden altijd de splash, want de pitch begint opnieuw
  const [splashTonen, setSplashTonen] = useState(() => !splashAlGezien() || PITCH_START)
  // Highlights-scherm (/highlights/<datum>): datum van de wedstrijd, of null
  const [highlightsDatum, setHighlightsDatum] = useState(highlightsDatumUitPad)
  // Pagina achter een tegel zonder eigen tab: 'nieuws', 'aanbiedingen', 'analyse',
  // 'ticket' of 'verkopen'
  // /nieuws/<id> direct geopend (of herladen): meteen de nieuwspagina
  const [subpagina, setSubpagina] = useState(() => (window.location.pathname.startsWith('/nieuws') ? 'nieuws' : null))
  // Welke analyse: wedstrijdId (/analyse/<id>), { team } (tegel op Home) of null (lijstje)
  const [analyseKeuze, setAnalyseKeuze] = useState(null)
  const [gelezen, setGelezen] = useState(() => new Set())
  // Welk team de fan volgt (mannen/vrouwen); geldt voor Home, Wedstrijden en Selectie
  const [team, setTeam] = useState(leesLokaleTeamKeuze)
  // /rossie is een laag over de app (geen router): ook direct te openen via de URL
  const [rossieOpen, setRossieOpen] = useState(() => window.location.pathname.startsWith('/rossie'))

  const { state: demo, nieuweMelding, sluitMelding } = useDemo()
  // In pitchmodus (standaard op localhost) is de demo altijd actief
  const demoActief = isDemoActief(demo, useDemoModus() || IS_PITCH)
  const meldingen = demo?.meldingen ?? []
  // Fantype komt van de gekozen persona (bezoeker = "standaard")
  const fantype = HUIDIGE_PERSONA.fantype
  // Wedstrijd van "Ben je erbij?" (tijdens de demo Twente – PSV), voor de stickermelding
  const kaartWedstrijd = useKaartWedstrijd(demo, demoActief)

  // Titel van een melding voor deze fan. De stickermelding heeft drie titels;
  // aanwezigheid staat in de browser, dus kiezen we hier:
  //   groen bij "Ben je erbij?" -> erbij, anders fantype afstand -> afstand
  function voorDezeFan(melding) {
    if (!melding?.titels) return melding
    const erbij = kaartWedstrijd && leesAanwezigheid(kaartWedstrijd.id) === 'ja'
    const titel = erbij ? melding.titels.erbij : fantype === 'afstand' ? melding.titels.afstand : melding.titels.standaard
    return { ...melding, titel }
  }
  // Waar een melding heen gaat voor dit fantype (zelfde keuze als MeldingToast)
  const routeVan = (melding) =>
    melding.varianten[fantype === 'afstand' ? 'afstand' : 'standaard']?.route ?? melding.link

  // useDemo geeft elke render een nieuwe sluitMelding terug; MeldingToast
  // zou daardoor zijn sluit-timer elke seconde opnieuw starten. sluitMelding
  // roept alleen een (stabiele) state-setter aan, dus één vaste versie volstaat.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const sluitToast = useCallback(() => sluitMelding(), [])

  useEffect(() => {
    // Pitch (her)starten: fase "voor" met afteller, die na de splash begint
    startPitch()
    startDemoViaUrl()
    getProfiles()
      .then((lijst) => {
        // Uit het databaseprofiel van de persona halen we alleen de teamkeuze
        const eigen = lijst.find((p) => p.id === HUIDIG_PROFIEL_ID) ?? null
        if (eigen?.teamKeuze) setTeam(eigen.teamKeuze)
      })
      .catch(() => {})
  }, [])

  // Na een reset zijn de meldingen weg: dan ook "gelezen" vergeten, zodat het
  // bolletje bij de volgende demo-ronde weer verschijnt.
  if (meldingen.length === 0 && gelezen.size > 0) setGelezen(new Set())

  const ongelezen = meldingen.some((m) => !gelezen.has(m.id))
  const markeerGelezen = (ids) => setGelezen((oud) => new Set([...oud, ...ids]))

  // Nieuwe teamkeuze: meteen tonen, lokaal onthouden en in het profiel opslaan
  function kiesTeam(nieuwTeam) {
    setTeam(nieuwTeam)
    setTeamKeuze(HUIDIG_PROFIEL_ID, nieuwTeam).catch(() => {})
  }

  function wissel(nieuweTab, start = {}) {
    setSubpagina(null)
    setStartIn(start)
    setTab(nieuweTab)
    setNavTeller((n) => n + 1)
    // Nieuwe tab begint bovenaan, niet op de scrollpositie van de vorige
    window.scrollTo(0, 0)
  }

  // Vertaalt de links uit meldingen ("/fan?open=motm", "/highlights/2026-09-20",
  // "/plakboek?claim=...", "/?recap=1") naar tabs, lagen of pagina's — de app
  // heeft geen router.
  function ga(route) {
    const url = new URL(route, window.location.origin)
    if (url.pathname.startsWith('/highlights/')) {
      openHighlights(url.pathname.split('/')[2])
    } else if (url.pathname.startsWith('/plakboek')) {
      window.location.href = route // het plakboek is een eigen pagina
    } else if (url.pathname.startsWith('/fan')) {
      wissel('fan', { fan: url.searchParams.get('open') })
    } else {
      wissel('home')
      // oude recap-link: nu het highlights-scherm van de demowedstrijd
      if (url.searchParams.get('recap') && demo?.wedstrijd?.datum) openHighlights(demo.wedstrijd.datum)
    }
  }

  // Tik op de toast zelf (niet op het kruisje of de knop): naar de link
  function tikOpToast(e) {
    if (!nieuweMelding || e.target.closest('.toast-x, .toast-knop')) return
    markeerGelezen([nieuweMelding.id])
    sluitToast()
    ga(routeVan(nieuweMelding))
  }

  // Tik op een melding in de inbox (niet op de knop, die doet dit al)
  function tikInInbox(e) {
    const item = e.target.closest('.inbox li')
    if (!item || e.target.closest('button')) return
    const melding = meldingen[[...item.parentElement.children].indexOf(item)]
    if (!melding) return
    sluitInbox()
    ga(routeVan(melding))
  }

  function openInbox() {
    // de toast staat ook in de inbox; niet eroverheen laten hangen
    sluitToast()
    setInboxOpen(true)
    markeerGelezen(meldingen.map((m) => m.id))
  }

  function sluitInbox() {
    setInboxOpen(false)
    markeerGelezen(meldingen.map((m) => m.id))
  }

  // Terugknop van de browser/telefoon sluit Rossie en de highlights weer
  useEffect(() => {
    const opPad = () => {
      setRossieOpen(window.location.pathname.startsWith('/rossie'))
      setHighlightsDatum(highlightsDatumUitPad())
    }
    window.addEventListener('popstate', opPad)
    return () => window.removeEventListener('popstate', opPad)
  }, [])

  function openRossie() {
    window.history.pushState({ rossie: true }, '', '/rossie')
    setRossieOpen(true)
  }

  function sluitRossie() {
    // Via de app geopend -> gewoon een stap terug in de geschiedenis.
    // Direct op /rossie binnengekomen -> er is geen "terug", dus naar /.
    if (window.history.state?.rossie) {
      window.history.back()
    } else {
      window.history.replaceState(null, '', '/')
      setRossieOpen(false)
    }
  }

  function splashKlaar() {
    try {
      sessionStorage.setItem(SPLASH_SLEUTEL, 'ja')
    } catch {
      // sessionStorage niet beschikbaar — dan zie je hem bij herladen gewoon weer
    }
    setSplashTonen(false)
  }

  // Highlights-scherm openen (/highlights/<datum>), met eigen adres zodat de
  // terugknop van de telefoon hem weer sluit
  function openHighlights(datum) {
    window.history.pushState({ highlights: true }, '', `/highlights/${datum}`)
    setHighlightsDatum(datum)
  }

  function sluitHighlights() {
    if (window.history.state?.highlights) {
      window.history.back()
    } else {
      window.history.replaceState(null, '', '/')
      setHighlightsDatum(null)
    }
  }

  // Routes uit features.json vertalen naar tabs of lagen. Geeft false terug als
  // er (nog) geen scherm voor is; de tegel toont dan "Binnenkort".
  const FEATURE_ROUTES = {
    '/stemmen': () => wissel('fan', { fan: 'motm' }),
    '/plakboek': () => {
      window.location.href = '/plakboek'
    },
    '/rossie': () => openRossie(),
    '/plattegrond': () => wissel('meer', { meer: 'plattegrond' }),
    // Webshop-tegel (Daan): de bestaande fanshop onder Meer
    '/webshop': () => wissel('meer', { meer: 'fanshop' }),
    // Pagina's achter een tegel, zonder eigen tab in de onderbalk
    '/nieuws': () => openSubpagina('nieuws'),
    '/aanbiedingen': () => openSubpagina('aanbiedingen'),
    // Tegel op Home: de nieuwste analyse van het team dat de fan nu volgt
    '/analyse': () => {
      setAnalyseKeuze({ team })
      openSubpagina('analyse')
    },
    '/tickets/ticket': () => openSubpagina('ticket'),
    '/tickets/verkopen': () => openSubpagina('verkopen'),
  }
  function openSubpagina(naam) {
    setSubpagina(naam)
    window.scrollTo(0, 0)
  }

  // Directe links (ook na herladen, en op Vercel via de rewrite naar
  // index.html): /analyse/<id>, /plattegrond, /aanbiedingen, /webshop,
  // /tickets/ticket, /wedstrijden ... openen meteen de goede pagina.
  // /rossie, /highlights/<datum> en /nieuws/<id> regelen zichzelf al.
  useEffect(() => {
    const pad = window.location.pathname.replace(/\/+$/, '')
    if (pad.startsWith('/analyse')) {
      // /analyse/<wedstrijdId> -> die analyse; /analyse -> lijstje van alle analyses
      setAnalyseKeuze(pad.split('/')[2] || null)
      openSubpagina('analyse')
    }
    else if (pad.startsWith('/fan')) wissel('fan', { fan: new URLSearchParams(window.location.search).get('open') })
    else if (PAGINAS[pad.slice(1)]) wissel(pad.slice(1))
    else if (FEATURE_ROUTES[pad] && !['/rossie', '/plakboek', '/nieuws'].includes(pad)) FEATURE_ROUTES[pad]()
    // alleen bij het openen van de app
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  function kanOpenen(route) {
    return Boolean(route && (FEATURE_ROUTES[route] || route.startsWith('/highlights/')))
  }
  function openFeature(route) {
    if (!route) return false
    if (route.startsWith('/highlights/')) {
      openHighlights(route.split('/')[2])
      return true
    }
    const actie = FEATURE_ROUTES[route]
    if (!actie) return false
    actie()
    return true
  }

  // Esc sluit de inbox en het profielmenu
  useEffect(() => {
    if (!inboxOpen && !profielMenuOpen) return
    const toets = (e) => {
      if (e.key !== 'Escape') return
      setInboxOpen(false)
      setProfielMenuOpen(false)
    }
    window.addEventListener('keydown', toets)
    return () => window.removeEventListener('keydown', toets)
  }, [inboxOpen, profielMenuOpen])

  const Pagina = PAGINAS[tab]
  const paginaProps = {
    // "Twente in 60 seconden" op de wedstrijdtegel -> /highlights/<datum van de demo>
    home: { demo, demoActief, onOpenRecap: () => demo?.wedstrijd?.datum && openHighlights(demo.wedstrijd.datum) },
    tickets: { demo, demoActief },
    fan: { startTegel: startIn.fan },
    meer: { startOnderdeel: startIn.meer, startSpeler: startIn.speler, onOpenRossie: openRossie },
  }[tab]

  return (
    <TeamKeuzeContext.Provider value={{ team, kiesTeam }}>
    <NavigatieContext.Provider value={{ openFeature, kanOpenen }}>
      <div className="app-shell">
        {/* Laag om de toast: tikken op de hele melding gaat naar zijn link */}
        <div className="toast-tik" onClick={tikOpToast}>
          <MeldingToast
            melding={voorDezeFan(nieuweMelding)}
            fantype={fantype}
            onSluit={sluitToast}
            onGa={(route) => {
              markeerGelezen([nieuweMelding.id])
              sluitToast()
              ga(route)
            }}
          />
        </div>

        <Kopbalk
          fase={demo?.fase}
          ongelezen={ongelezen}
          inboxOpen={inboxOpen}
          onInbox={openInbox}
          profielOpen={profielMenuOpen}
          onProfiel={() => setProfielMenuOpen(true)}
        />

        <main className="app-main">
          {subpagina === 'nieuws' ? (
            <NieuwsPagina
              onTerug={() => wissel('home')}
              // spelerskaartje in een bericht -> Meer -> Selectie, naar die speler
              onOpenSpeler={(rugnummer) => wissel('meer', { meer: 'selectie', speler: rugnummer })}
            />
          ) : subpagina === 'ticket' ? (
            <TicketPagina demo={demo} demoActief={demoActief} onTerug={() => wissel('tickets')} />
          ) : subpagina === 'verkopen' ? (
            <VerkopenPagina demo={demo} demoActief={demoActief} onTerug={() => wissel('tickets')} />
          ) : subpagina === 'analyse' ? (
            <AnalysePagina keuze={analyseKeuze} demo={demo} demoActief={demoActief} onTerug={() => wissel('home')} />
          ) : subpagina === 'aanbiedingen' ? (
            <AanbiedingenPagina demo={demo} demoActief={demoActief} />
          ) : subpagina ? (
            <BinnenkortPagina soort={subpagina} onTerug={() => wissel('home')} />
          ) : (
            <Pagina key={navTeller} {...paginaProps} />
          )}
        </main>

        <BottomNav actief={tab} onWissel={(id) => wissel(id)} />

        {inboxOpen && (
          <div className="inbox-laag" onClick={sluitInbox}>
            <section
              className="inbox-paneel"
              role="dialog"
              aria-modal="true"
              aria-labelledby="inbox-kop"
              onClick={(e) => e.stopPropagation()}
            >
              <header className="inbox-paneel__kop">
                <h2 id="inbox-kop">Berichten</h2>
                <button type="button" className="inbox-paneel__sluit" onClick={sluitInbox} aria-label="Sluiten" autoFocus>
                  <X strokeWidth={2.2} size={20} />
                </button>
              </header>
              <div onClick={tikInInbox}>
                <Inbox
                  meldingen={meldingen.map(voorDezeFan)}
                  fantype={fantype}
                  onGa={(route) => {
                    sluitInbox()
                    ga(route)
                  }}
                />
              </div>
            </section>
          </div>
        )}

        {rossieOpen && <RossiePagina fantype={fantype} onTerug={sluitRossie} />}

        {profielMenuOpen && (
          <ProfielMenu
            onSluit={() => setProfielMenuOpen(false)}
            onMijnTwente={() => {
              setProfielMenuOpen(false)
              wissel('meer', { meer: 'mijntwente' })
            }}
          />
        )}

        {highlightsDatum && <HighlightsScherm datum={highlightsDatum} onSluit={sluitHighlights} />}

        {splashTonen && <Splash onKlaar={splashKlaar} />}
      </div>
    </NavigatieContext.Provider>
    </TeamKeuzeContext.Provider>
  )
}
