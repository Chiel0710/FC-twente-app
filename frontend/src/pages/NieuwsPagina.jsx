import { useEffect, useState } from 'react'
import { ArrowLeft, ArrowUpRight } from 'lucide-react'
import { getPlayers } from '../api'
import '../nieuws.css'

// /nieuws en /nieuws/<id> — nieuws uit public/nieuws/nieuws.json. De teksten
// zijn eigen samenvattingen; het hele artikel staat bij de bron (knop onderaan
// een bericht). Er wordt niets van de bronsite opgehaald of overgenomen: geen
// artikeltekst, geen foto's. Beelden komen uit de app zelf (spelersfoto of
// clublogo). Nieuw bericht = alleen nieuws.json uitbreiden.
const NIEUWS = '/nieuws/nieuws.json'

// Volgorde van de filterchips; een categorie die hier niet staat komt achteraan
const CATEGORIE_VOLGORDE = ['Selectie', 'Club', 'Academie', 'Conference League']

const datumKort = new Intl.DateTimeFormat('nl-NL', { day: 'numeric', month: 'short' })
const datumLang = new Intl.DateTimeFormat('nl-NL', { weekday: 'long', day: 'numeric', month: 'long' })
const kort = (iso) => datumKort.format(new Date(iso)).replace('.', '')

// Eerste zin van de samenvatting, voor op de kaart
const eersteZin = (tekst) => tekst.match(/^.*?[.!?](\s|$)/)?.[0].trim() ?? tekst

const idUitPad = () => window.location.pathname.match(/^\/nieuws\/([^/]+)/)?.[1] ?? null

// Beeld van een bericht: foto van de eerste speler, anders het clublogo
function Beeld({ bericht, spelers, groot = false }) {
  const speler = spelers.get(bericht.spelers?.[0])
  return (
    <div className={`nw-beeld${speler ? ' is-speler' : ''}${groot ? ' is-groot' : ''}`} aria-hidden="true">
      {speler ? <img src={speler.foto} alt="" /> : <img className="nw-beeld__logo" src="/logo.png" alt="" />}
    </div>
  )
}

function Overzicht({ berichten, spelers, onOpen, filter, setFilter }) {
  const categorieen = [...new Set(berichten.map((b) => b.categorie))].sort(
    (a, b) =>
      (CATEGORIE_VOLGORDE.indexOf(a) + 1 || 99) - (CATEGORIE_VOLGORDE.indexOf(b) + 1 || 99),
  )
  const zichtbaar = filter === 'Alles' ? berichten : berichten.filter((b) => b.categorie === filter)

  return (
    <>
      <div className="section-heading">
        <span className="eyebrow">Actueel</span>
        <h2>Nieuws</h2>
      </div>

      <div className="nw-chips" role="group" aria-label="Filter op categorie">
        {['Alles', ...categorieen].map((c) => (
          <button
            key={c}
            type="button"
            className={`nw-chip${filter === c ? ' is-actief' : ''}`}
            aria-pressed={filter === c}
            onClick={() => setFilter(c)}
          >
            {c}
          </button>
        ))}
      </div>

      <ul className="nw-lijst">
        {zichtbaar.map((b) => (
          <li key={b.id}>
            <button type="button" className="nw-kaart" onClick={() => onOpen(b.id)}>
              <Beeld bericht={b} spelers={spelers} />
              <span className="nw-kaart__tekst">
                <span className="nw-kaart__meta">
                  <span className="nw-label">{b.categorie}</span>
                  <time dateTime={b.datum}>{kort(b.datum)}</time>
                </span>
                <strong className="nw-kaart__titel">{b.titel}</strong>
                <span className="nw-kaart__intro">{eersteZin(b.samenvatting)}</span>
              </span>
            </button>
          </li>
        ))}
      </ul>
    </>
  )
}

function Bericht({ bericht, spelers, onTerug, onOpenSpeler }) {
  const betrokken = (bericht.spelers ?? []).map((nr) => spelers.get(nr)).filter(Boolean)
  return (
    <article className="nw-bericht">
      <button type="button" className="meer-terug" onClick={onTerug}>
        <ArrowLeft strokeWidth={2} size={16} />
        Nieuws
      </button>

      <Beeld bericht={bericht} spelers={spelers} groot />

      <div className="nw-bericht__kaart">
        <span className="nw-kaart__meta">
          <span className="nw-label">{bericht.categorie}</span>
          <time dateTime={bericht.datum}>{datumLang.format(new Date(bericht.datum))}</time>
        </span>
        <h2 className="nw-bericht__titel">{bericht.titel}</h2>
        <p className="nw-bericht__tekst">{bericht.samenvatting}</p>

        {betrokken.length > 0 && (
          <section className="nw-spelers" aria-label="Spelers in dit bericht">
            {betrokken.map((s) => (
              <button type="button" className="nw-speler" key={s.id} onClick={() => onOpenSpeler(s.rugnummer)}>
                <img src={s.foto} alt="" />
                <span className="nw-speler__nr">#{s.rugnummer}</span>
                <span className="nw-speler__naam">{s.naam}</span>
              </button>
            ))}
          </section>
        )}

        <a className="nw-bron" href={bericht.url} target="_blank" rel="noopener noreferrer">
          Lees het hele artikel bij {bericht.bron}
          <ArrowUpRight size={18} strokeWidth={2.4} aria-hidden="true" />
        </a>
        <p className="nw-bron__noot">Bron: {bericht.bron}</p>
      </div>
    </article>
  )
}

/**
 * props: onTerug (naar Home), onOpenSpeler(rugnummer) → Meer → Selectie
 */
export default function NieuwsPagina({ onTerug, onOpenSpeler }) {
  const [data, setData] = useState(undefined)
  const [spelers, setSpelers] = useState(new Map()) // rugnummer -> speler (mannen)
  const [openId, setOpenId] = useState(idUitPad)
  // Hier (niet in Overzicht): terug uit een bericht houdt het filter vast
  const [filter, setFilter] = useState('Alles')

  useEffect(() => {
    let actief = true
    fetch(NIEUWS)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => actief && setData(d))
      .catch(() => actief && setData(null))
    getPlayers('mannen')
      .then((lijst) => actief && setSpelers(new Map(lijst.map((s) => [s.rugnummer, s]))))
      .catch(() => {})
    return () => {
      actief = false
    }
  }, [])

  // Terugknop van de telefoon: van een bericht terug naar de lijst
  useEffect(() => {
    const opPad = () => setOpenId(idUitPad())
    window.addEventListener('popstate', opPad)
    return () => {
      window.removeEventListener('popstate', opPad)
      // Pagina verlaten: /nieuws/<id> niet in de adresbalk laten staan
      if (idUitPad()) window.history.replaceState(null, '', '/')
    }
  }, [])

  function open(id) {
    window.history.pushState({ nieuws: id }, '', `/nieuws/${id}`)
    setOpenId(id)
    window.scrollTo(0, 0)
  }

  function sluit() {
    if (window.history.state?.nieuws) window.history.back()
    else {
      window.history.replaceState(null, '', '/')
      setOpenId(null)
    }
  }

  // Nieuwste eerst
  const berichten = [...(data?.berichten ?? [])].sort((a, b) => b.datum.localeCompare(a.datum))
  const bericht = openId ? berichten.find((b) => b.id === openId) : null

  return (
    <div className="subpagina nieuws">
      {!bericht && (
        <button type="button" className="meer-terug" onClick={onTerug}>
          <ArrowLeft strokeWidth={2} size={16} />
          Home
        </button>
      )}

      {data === undefined && <div className="card">Nieuws laden...</div>}
      {data === null && <div className="card">Het nieuws is nu niet te laden. Probeer het later nog eens.</div>}

      {data && bericht && (
        <Bericht bericht={bericht} spelers={spelers} onTerug={sluit} onOpenSpeler={onOpenSpeler} />
      )}
      {data && !bericht && <Overzicht berichten={berichten} spelers={spelers} onOpen={open} filter={filter} setFilter={setFilter} />}
    </div>
  )
}
