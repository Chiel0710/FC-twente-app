import { useEffect, useState } from 'react'
import { ArrowLeft, ArrowLeftRight, Cross, Lock, MapPin } from 'lucide-react'
import { getPlayers } from '../api'
import '../analyse.css'

// /analyse — wedstrijdanalyse achter de tegel "Wedstrijdanalyse" op Home.
// De inhoud staat in public/analyse/<wedstrijd>.json (eigen samenvatting, zie
// "bron" in dat bestand); deze pagina zet alleen neer wat erin staat.
// "beschikbaarVanaf": "na" -> tijdens de demo pas zichtbaar na het eindsignaal.
const ANALYSE = '/analyse/2026-09-20-twente-psv.json'

// Logo op de rode kop: de transparante versie uit public/logos-transparant
const LOGOS = { 'FC Twente': '/logos-transparant/fc-twente.png', PSV: '/logos-transparant/psv.png' }

const FASE_VOLGORDE = ['voor', 'live', 'rust', 'na', 'dagerna']

const datumLang = new Intl.DateTimeFormat('nl-NL', { weekday: 'long', day: 'numeric', month: 'long' })

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

const ICOON = { doelpunt: BalIcoon, wissel: ArrowLeftRight, blessure: Cross }

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

// Tijdlijn 0'–90': thuis links, uit rechts (zoals op de wedstrijdtegel).
// Momenten zonder team (bv. een blessure bij de tegenstander) staan in het midden.
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
        return (
          <li key={i} className={`an-moment ${kant} an-moment--${m.type}`}>
            <span className="an-moment__stip" aria-hidden="true">
              <Icoon strokeWidth={2.2} />
            </span>
            <div className="an-moment__kaart">
              {/* minuut in het kaartje zelf: op de middenlijn is hij slecht leesbaar */}
              <span className="an-moment__club">
                <b>{m.minuut}'</b>
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

/**
 * props: demo + demoActief (App) — tijdens de demo is de analyse pas te lezen
 * vanaf de fase in "beschikbaarVanaf"; onTerug naar Home.
 */
export default function AnalysePagina({ demo, demoActief, onTerug }) {
  const [analyse, setAnalyse] = useState(undefined)
  const [foto, setFoto] = useState(null)

  useEffect(() => {
    let actief = true
    fetch(ANALYSE)
      .then((r) => (r.ok ? r.json() : null))
      .then((a) => actief && setAnalyse(a))
      .catch(() => actief && setAnalyse(null))
    return () => {
      actief = false
    }
  }, [])

  // Foto van de uitgelichte speler uit de selectie (als hij erin staat)
  const uitgelicht = analyse?.uitgelicht?.speler
  useEffect(() => {
    if (!uitgelicht) return
    let actief = true
    getPlayers('mannen')
      .then((spelers) => actief && setFoto(spelers.find((s) => s.naam === uitgelicht)?.foto ?? null))
      .catch(() => {})
    return () => {
      actief = false
    }
  }, [uitgelicht])

  // Nog niet beschikbaar tijdens de demo (voor/live/rust bij "beschikbaarVanaf": "na")
  const fase = demoActief ? demo?.fase : null
  const vergrendeld =
    analyse?.beschikbaarVanaf &&
    fase &&
    FASE_VOLGORDE.indexOf(fase) < FASE_VOLGORDE.indexOf(analyse.beschikbaarVanaf)

  const [thuisScore, uitScore] = analyse?.uitslag?.split('-') ?? []

  return (
    <div className="subpagina analyse">
      <button type="button" className="meer-terug" onClick={onTerug}>
        <ArrowLeft strokeWidth={2} size={16} />
        Home
      </button>

      {analyse === undefined && <div className="card">Analyse laden...</div>}
      {analyse === null && <div className="card">De analyse is nu niet te laden. Probeer het later nog eens.</div>}

      {analyse && (
        <>
          {/* Kop in de stijl van de tegel: rood doek, titel in Abril Fatface */}
          <header className="an-kop">
            <span className="an-kop__eyebrow">Wedstrijdanalyse · {analyse.competitie}</span>
            <div className="an-kop__uitslag" aria-label={`${analyse.thuis} ${analyse.uitslag} ${analyse.uit}`}>
              <span className="an-kop__club">
                <img src={LOGOS[analyse.thuis]} alt="" />
                {analyse.thuis}
              </span>
              <strong>
                {thuisScore}
                <span aria-hidden="true">–</span>
                {uitScore}
              </strong>
              <span className="an-kop__club">
                <img src={LOGOS[analyse.uit]} alt="" />
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
      )}
    </div>
  )
}
