import { useEffect, useState } from 'react'
import { ArrowLeft, ArrowLeftRight, ChevronRight, Cross, Lock, MapPin } from 'lucide-react'
import { getPlayers } from '../api'
import { slugVan } from '../sportData'
import '../analyse.css'

// /analyse — wedstrijdanalyses achter de tegel "Wedstrijdanalyse" op Home.
// Elke analyse staat in public/analyse/<wedstrijdId>.json (eigen samenvatting,
// zie "bron" in dat bestand); public/analyse/index.json somt ze op.
//   /analyse/<wedstrijdId>  -> die analyse
//   /analyse                -> lijstje van alle analyses, nieuwste eerst
//   tegel op Home           -> de nieuwste analyse van het gekozen team
// "beschikbaarVanaf": "na" -> tijdens de demo pas zichtbaar na het eindsignaal
// (alleen de mannen; de demo is een mannenwedstrijd).
const INDEX = '/analyse/index.json'
const bestandVan = (id) => `/analyse/${id}.json`

// Logo op de rode kop: de transparante versie uit public/logos-transparant
const logoVan = (club) => `/logos-transparant/${slugVan(club)}.png`

const FASE_VOLGORDE = ['voor', 'live', 'rust', 'na', 'dagerna']
const TEAM_NAAM = { mannen: 'Mannen', vrouwen: 'Vrouwen' }

const datumLang = new Intl.DateTimeFormat('nl-NL', { weekday: 'long', day: 'numeric', month: 'long' })
const datumKort = new Intl.DateTimeFormat('nl-NL', { day: 'numeric', month: 'long' })

// Kleine voetbal voor doelpunten (zelfde tekening als de bal in de onderbalk)
function BalIcoon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" {...props}>
      <circle cx="12" cy="12" r="10" />
      <path d="M12 7.6l4.2 3-1.6 4.9H9.4L7.8 10.6z" fill="currentColor" />
      <path d="M12 7.6V2.2M16.2 10.6l5-1.6M14.6 15.5l3 4.3M9.4 15.5l-3 4.3M7.8 10.6l-5-1.6" />
    </svg>
  )
}

// Geel kaartje (type "kaart")
function KaartIcoon(props) {
  return (
    <svg viewBox="0 0 24 24" {...props}>
      <rect x="7" y="3.5" width="10" height="17" rx="1.8" fill="#f5c400" stroke="#8a6d00" strokeWidth="1" />
    </svg>
  )
}

// Doelpaal met een bal ertegenaan (type "paal")
function PaalIcoon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" {...props}>
      <path d="M4 21V4h16v17" />
      <circle cx="15.5" cy="10" r="3" strokeWidth="1.6" />
    </svg>
  )
}

const ICOON = { doelpunt: BalIcoon, wissel: ArrowLeftRight, blessure: Cross, kaart: KaartIcoon, paal: PaalIcoon }

// Omschrijving van één sleutelmoment, zonder iets toe te voegen aan de data
function MomentTekst({ m }) {
  if (m.type === 'doelpunt') {
    return (
      <>
        <strong>{m.speler}</strong>
        {m.assist && <span className="an-moment__sub">Assist {m.assist}</span>}
        {m.tekst && <span className="an-moment__sub">{m.tekst}</span>}
      </>
    )
  }
  return <span>{m.tekst}</span>
}

// Minuut ("8'"), of de periode als de minuut niet bekend is ("Voor rust")
function tijdVan(m) {
  if (m.minuut != null) return `${m.minuut}'`
  if (m.periode) return m.periode[0].toUpperCase() + m.periode.slice(1)
  return ''
}

// Tijdlijn aftrap–eindsignaal: thuis links, uit rechts (zoals op de wedstrijdtegel).
// Momenten zonder team (bv. een blessure bij de tegenstander) staan in het midden.
// De volgorde is die uit het bestand (ook als niet elke minuut bekend is).
function Tijdlijn({ momenten, thuis, uit }) {
  return (
    <ol className="an-tijdlijn" aria-label="Sleutelmomenten">
      <li className="an-tijdlijn__grens" aria-hidden="true">
        <span>Aftrap</span>
      </li>
      {momenten.map((m, i) => {
        const Icoon = ICOON[m.type] ?? Cross
        const kant = m.team === 'thuis' ? 'is-thuis' : m.team === 'uit' ? 'is-uit' : 'is-midden'
        const club = m.team === 'thuis' ? thuis : m.team === 'uit' ? uit : null
        // Twente rood, de tegenstander donker (ook als Twente uit speelt)
        const twente = club === 'FC Twente' ? ' is-twente' : ''
        return (
          <li key={i} className={`an-moment ${kant}${twente} an-moment--${m.type}`}>
            <span className="an-moment__stip" aria-hidden="true">
              <Icoon strokeWidth={2.2} />
            </span>
            <div className="an-moment__kaart">
              {/* minuut in het kaartje zelf: op de middenlijn is hij slecht leesbaar */}
              <span className="an-moment__club">
                <b>{tijdVan(m)}</b>
                {club && ` · ${club}`}
              </span>
              <MomentTekst m={m} />
              {m.stand && <span className="an-moment__stand">{m.stand.replace('-', ' – ')}</span>}
            </div>
          </li>
        )
      })}
      <li className="an-tijdlijn__grens" aria-hidden="true">
        <span>Eindsignaal</span>
      </li>
    </ol>
  )
}

// Alle analyses met hun kopgegevens, nieuwste eerst
function useAlleAnalyses() {
  const [lijst, setLijst] = useState(undefined)
  useEffect(() => {
    let actief = true
    fetch(INDEX)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((index) =>
        Promise.all(
          index.analyses.map(({ wedstrijdId }) =>
            fetch(bestandVan(wedstrijdId)).then((r) => (r.ok ? r.json() : null)),
          ),
        ),
      )
      .then((analyses) => {
        if (!actief) return
        setLijst(analyses.filter(Boolean).sort((a, b) => b.datum.localeCompare(a.datum)))
      })
      .catch(() => actief && setLijst(null))
    return () => {
      actief = false
    }
  }, [])
  return lijst
}

// Is de analyse tijdens de demo nog dicht? (voor/live/rust bij "beschikbaarVanaf": "na")
function isVergrendeld(analyse, fase) {
  if (!fase || analyse.team === 'vrouwen') return false
  const vanaf = analyse.beschikbaarVanaf
  if (!vanaf || vanaf === 'altijd') return false
  return FASE_VOLGORDE.indexOf(fase) < FASE_VOLGORDE.indexOf(vanaf)
}

// Lijstje van alle analyses (mannen en vrouwen)
function Overzicht({ lijst, fase, onKies }) {
  return (
    <section className="an-lijst" aria-labelledby="an-lijst-titel">
      <h2 className="an-lijst__titel" id="an-lijst-titel">
        Wedstrijdanalyses
      </h2>
      <ul>
        {lijst.map((a) => {
          const dicht = isVergrendeld(a, fase)
          return (
            <li key={a.wedstrijdId}>
              <button type="button" className="an-lijst__item" onClick={() => onKies(a.wedstrijdId)}>
                <span className="an-lijst__logos" aria-hidden="true">
                  <img src={logoVan(a.thuis)} alt="" />
                  <img src={logoVan(a.uit)} alt="" />
                </span>
                <span className="an-lijst__tekst">
                  <span className="an-lijst__meta">
                    <span className={`an-lijst__team is-${a.team ?? 'mannen'}`}>{TEAM_NAAM[a.team ?? 'mannen']}</span>
                    {datumKort.format(new Date(a.datum))}
                  </span>
                  <strong>
                    {a.thuis} – {a.uit} {dicht ? '' : a.uitslag}
                  </strong>
                  <span className="an-lijst__kop">{dicht ? 'Te lezen na het eindsignaal' : a.titel}</span>
                </span>
                {dicht ? <Lock size={18} aria-label="Nog dicht" /> : <ChevronRight size={20} aria-hidden="true" />}
              </button>
            </li>
          )
        })}
      </ul>
    </section>
  )
}

// Eén analyse: kop, tijdlijn, hoofdstukken, uitgelicht, bron
function Analyse({ analyse, fase }) {
  const [foto, setFoto] = useState(null)
  const team = analyse.team ?? 'mannen'

  // Foto van de uitgelichte speler uit de selectie van dit team (als ze erin staat)
  const uitgelicht = analyse.uitgelicht?.speler
  useEffect(() => {
    if (!uitgelicht) return
    let actief = true
    getPlayers(team)
      .then((spelers) => actief && setFoto(spelers.find((s) => s.naam === uitgelicht)?.foto ?? null))
      .catch(() => {})
    return () => {
      actief = false
    }
  }, [uitgelicht, team])

  const vergrendeld = isVergrendeld(analyse, fase)
  const [thuisScore, uitScore] = analyse.uitslag?.split('-') ?? []

  return (
    <>
      {/* Kop in de stijl van de tegel: rood doek, titel in Abril Fatface */}
      <header className="an-kop">
        <span className="an-kop__eyebrow">
          Wedstrijdanalyse · {analyse.competitie}
        </span>
        <div className="an-kop__uitslag" aria-label={`${analyse.thuis} ${analyse.uitslag} ${analyse.uit}`}>
          <span className="an-kop__club">
            <img src={logoVan(analyse.thuis)} alt="" />
            {analyse.thuis}
          </span>
          <strong>
            {thuisScore}
            <span aria-hidden="true">–</span>
            {uitScore}
          </strong>
          <span className="an-kop__club">
            <img src={logoVan(analyse.uit)} alt="" />
            {analyse.uit}
          </span>
        </div>
        <p className="an-kop__meta">
          <MapPin size={14} strokeWidth={2.2} aria-hidden="true" />
          {analyse.stadion} · {datumLang.format(new Date(analyse.datum))}
        </p>
      </header>

      {vergrendeld ? (
        <div className="card an-slot">
          <Lock strokeWidth={2} aria-hidden="true" />
          <h3>Na het eindsignaal</h3>
          <p>De analyse van deze wedstrijd lees je hier zodra de wedstrijd voorbij is.</p>
        </div>
      ) : (
        <article className="an-artikel">
          <h2 className="an-titel">{analyse.titel}</h2>
          <p className="an-intro">{analyse.intro}</p>

          <section className="an-blok">
            <h3 className="an-blok__kop">Sleutelmomenten</h3>
            <Tijdlijn momenten={analyse.sleutelmomenten} thuis={analyse.thuis} uit={analyse.uit} />
          </section>

          {analyse.hoofdstukken.map((h) => (
            <section className="an-hoofdstuk" key={h.kop}>
              <h3>{h.kop}</h3>
              <p>{h.tekst}</p>
            </section>
          ))}

          {analyse.uitgelicht && (
            <aside className="an-uitgelicht">
              {foto && <img src={foto} alt="" />}
              <div>
                <span className="an-uitgelicht__eyebrow">Uitgelicht</span>
                <strong>{analyse.uitgelicht.speler}</strong>
                <p>{analyse.uitgelicht.reden}</p>
              </div>
            </aside>
          )}

          {analyse.context && <p className="an-context">{analyse.context}</p>}
          {analyse.bron && <p className="an-bron">{analyse.bron}</p>}
        </article>
      )}
    </>
  )
}

/**
 * props:
 *  keuze      — wedstrijdId (één analyse), { team } (nieuwste van dat team,
 *               vanaf de tegel op Home) of null (lijstje van alle analyses)
 *  demo + demoActief (App) — de mannenanalyse is tijdens de demo pas te lezen
 *               vanaf de fase in "beschikbaarVanaf"
 *  onTerug    — naar Home
 */
export default function AnalysePagina({ keuze = null, demo, demoActief, onTerug }) {
  const lijst = useAlleAnalyses()
  // Gekozen vanuit het lijstje op deze pagina (dan gaat "terug" naar het lijstje)
  const [gekozen, setGekozen] = useState(null)
  const fase = demoActief ? demo?.fase : null

  const id =
    gekozen ??
    (typeof keuze === 'string' ? keuze : keuze?.team ? lijst?.find((a) => (a.team ?? 'mannen') === keuze.team)?.wedstrijdId : null)
  const analyse = id ? lijst?.find((a) => a.wedstrijdId === id) : null
  const toonLijst = !id

  function kies(nieuw) {
    setGekozen(nieuw)
    window.scrollTo(0, 0)
  }

  return (
    <div className="subpagina analyse">
      {gekozen ? (
        <button type="button" className="meer-terug" onClick={() => kies(null)}>
          <ArrowLeft strokeWidth={2} size={16} />
          Alle analyses
        </button>
      ) : (
        <button type="button" className="meer-terug" onClick={onTerug}>
          <ArrowLeft strokeWidth={2} size={16} />
          Home
        </button>
      )}

      {lijst === undefined && <div className="card">Analyse laden...</div>}
      {(lijst === null || (lijst && id && !analyse)) && (
        <div className="card">De analyse is nu niet te laden. Probeer het later nog eens.</div>
      )}

      {lijst && toonLijst && <Overzicht lijst={lijst} fase={fase} onKies={kies} />}
      {analyse && <Analyse key={analyse.wedstrijdId} analyse={analyse} fase={fase} />}
    </div>
  )
}
