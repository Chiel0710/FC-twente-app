import { useEffect, useRef, useState } from 'react'
import { Minus, Plus, RotateCcw, Search } from 'lucide-react'
import { HUIDIGE_PERSONA, IS_BEZOEKER, VOORBEELD_HOUDER } from '../../profiel'
import '../../plattegrond.css'

// Meer → Plattegrond: De Grolsch Veste met de route van een ingang naar je vak.
// Alles komt uit public/plattegrond/vakken.json (demo-data, afgeleid uit de
// plattegrond — géén officiële routes van FC Twente). Posities staan in % van
// de afbeelding, dus pin, ingang en lijn kloppen op elk formaat en elke zoom.
const DATA = '/plattegrond/vakken.json'
const MIN_ZOOM = 1
const MAX_ZOOM = 3

const klem = (w, min, max) => Math.min(max, Math.max(min, w))

// Stappen "Zo kom je bij je plek", alleen uit de gegevens van het vak
function stappenVoor(vak, plek) {
  return [
    `Ga naar ingang ${vak.ingang} aan de ${vak.zijde === 'lang' ? 'lange' : 'korte'} zijde`,
    vak.ring === 'beneden' ? 'Blijf op de benedenring' : 'Neem de trap naar de bovenring',
    `Loop naar vak ${vak.vak}`,
    plek ? `Rij ${plek.rij}, stoel ${plek.stoel}` : 'Zoek je rij en stoel op je kaartje',
  ]
}

/* ---------- Zoomen en slepen: knoppen, knijpen, vinger/muis ---------- */
function useZoom(vakRef) {
  const [z, setZ] = useState({ s: 1, x: 0, y: 0 }) // schaal en verschuiving in px
  const wijzers = useRef(new Map())
  const start = useRef(null)
  const gesleept = useRef(false)
  const [bezig, setBezig] = useState(false) // vinger op de kaart: niet naijlen

  // Nooit buiten de rand schuiven (transform-origin linksboven)
  function begrens({ s, x, y }) {
    const el = vakRef.current
    if (!el) return { s, x, y }
    const b = el.clientWidth
    const h = el.clientHeight
    return { s, x: klem(x, b * (1 - s), 0), y: klem(y, h * (1 - s), 0) }
  }

  // Zoom rond een punt (px binnen het vak), bv. het midden of tussen twee vingers
  function zoomRond(nieuw, px, py, basis = z) {
    const s = klem(nieuw, MIN_ZOOM, MAX_ZOOM)
    const f = s / basis.s
    return begrens({ s, x: px - (px - basis.x) * f, y: py - (py - basis.y) * f })
  }

  // Knoppen + en −: zoom rond een punt in % van de afbeelding (je pin), anders het midden
  function knop(factor, punt) {
    const el = vakRef.current
    setZ((huidig) => {
      const px = punt ? huidig.x + (punt.x / 100) * el.clientWidth * huidig.s : el.clientWidth / 2
      const py = punt ? huidig.y + (punt.y / 100) * el.clientHeight * huidig.s : el.clientHeight / 2
      return zoomRond(huidig.s * factor, px, py, huidig)
    })
  }

  // Punt (in % van de afbeelding) in beeld brengen, bij de huidige zoom
  function centreer(xPct, yPct) {
    const el = vakRef.current
    if (!el) return
    setZ((huidig) => {
      if (huidig.s === 1) return huidig
      const b = el.clientWidth
      const h = el.clientHeight
      return begrens({ s: huidig.s, x: b / 2 - (xPct / 100) * b * huidig.s, y: h / 2 - (yPct / 100) * h * huidig.s })
    })
  }

  const positie = (e) => {
    const r = vakRef.current.getBoundingClientRect()
    return { x: e.clientX - r.left, y: e.clientY - r.top }
  }

  const handlers = {
    onPointerDown(e) {
      wijzers.current.set(e.pointerId, positie(e))
      gesleept.current = false
      start.current = { z, punten: new Map(wijzers.current) }
      setBezig(true)
    },
    onPointerMove(e) {
      if (!wijzers.current.has(e.pointerId)) return
      wijzers.current.set(e.pointerId, positie(e))
      const s0 = start.current
      if (!s0) return
      const nu = [...wijzers.current.values()]
      const toen = [...s0.punten.values()]
      if (nu.length >= 2 && toen.length >= 2) {
        // Knijpen: schaal naar de verhouding van de afstanden, rond het midden
        const afstand = (a, b) => Math.hypot(a.x - b.x, a.y - b.y)
        const midden = { x: (nu[0].x + nu[1].x) / 2, y: (nu[0].y + nu[1].y) / 2 }
        const nieuw = s0.z.s * (afstand(nu[0], nu[1]) / afstand(toen[0], toen[1]))
        gesleept.current = true
        setZ(zoomRond(nieuw, midden.x, midden.y, s0.z))
      } else if (nu.length === 1 && s0.z.s > 1) {
        // Slepen (alleen zinvol als er ingezoomd is)
        const dx = nu[0].x - toen[0].x
        const dy = nu[0].y - toen[0].y
        if (Math.hypot(dx, dy) > 6) gesleept.current = true
        setZ(begrens({ s: s0.z.s, x: s0.z.x + dx, y: s0.z.y + dy }))
      }
    },
    onPointerUp(e) {
      wijzers.current.delete(e.pointerId)
      start.current = wijzers.current.size ? { z, punten: new Map(wijzers.current) } : null
      if (!wijzers.current.size) setBezig(false)
    },
  }
  handlers.onPointerCancel = handlers.onPointerUp

  return { z, bezig, knop, centreer, reset: () => setZ({ s: 1, x: 0, y: 0 }), handlers, gesleept }
}

export default function Plattegrond() {
  const [data, setData] = useState(undefined)
  // Eigen seizoenskaart; de bezoeker krijgt (net als op Tickets) de
  // voorbeeldkaart, met het label "Voorbeeld". Daan heeft geen kaart: zoeken.
  const voorbeeld = !HUIDIGE_PERSONA.seizoenskaart && IS_BEZOEKER
  const eigenPlek = HUIDIGE_PERSONA.seizoenskaart ?? (voorbeeld ? VOORBEELD_HOUDER.seizoenskaart : null)
  const [vakNr, setVakNr] = useState(eigenPlek?.vak ?? null)
  const [zoek, setZoek] = useState('')
  const [melding, setMelding] = useState('')
  const kaartRef = useRef(null)
  const zoekRef = useRef(null)
  const { z, bezig, knop, centreer, reset, handlers, gesleept } = useZoom(kaartRef)

  useEffect(() => {
    let actief = true
    fetch(DATA)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => actief && setData(d))
      .catch(() => actief && setData(null))
    return () => {
      actief = false
    }
  }, [])

  const vak = data?.vakken.find((v) => v.vak === vakNr) ?? null
  const ingang = vak ? data.ingangen[vak.ingang] : null
  // Rij en stoel alleen bij je eigen vak
  const plek = eigenPlek && vakNr === eigenPlek.vak ? eigenPlek : null

  function kiesVak(nr) {
    setVakNr(nr)
    setMelding('')
    const v = data.vakken.find((x) => x.vak === nr)
    if (v) centreer(v.x, v.y)
  }

  function zoekVak(e) {
    e.preventDefault()
    const nr = zoek.trim()
    if (!nr) return
    if (data.vakken.some((v) => v.vak === nr)) {
      kiesVak(nr)
      setZoek('')
    } else {
      setMelding(`Vak ${nr} staat niet op de plattegrond. Kies een vak van 101 t/m 136 of 302 t/m 326.`)
      // alles selecteren: een nieuw nummer typen vervangt het foute meteen
      zoekRef.current?.select()
    }
  }

  if (data === undefined) return <div className="card">Plattegrond laden...</div>
  if (data === null) return <div className="card">De plattegrond is nu niet te laden. Probeer het later nog eens.</div>

  const tegen = 1 / z.s // pin en labels blijven even groot bij inzoomen

  return (
    <div className="pg">
      <div className="section-heading">
        <span className="eyebrow">De Grolsch Veste</span>
        <h2>Plattegrond</h2>
      </div>

      {/* Jouw plek (seizoenskaart), of zoeken */}
      <section className="pg-plek" aria-label="Jouw plek">
        {eigenPlek && (
          <>
            <span className="pg-plek__eyebrow">
              Jouw plek
              {voorbeeld && <span className="voorbeeld-label pg-plek__voorbeeld">Voorbeeld</span>}
            </span>
            <dl className="pg-plek__cijfers">
              {[
                ['Vak', eigenPlek.vak],
                ['Rij', eigenPlek.rij],
                ['Stoel', eigenPlek.stoel],
              ].map(([naam, waarde]) => (
                <div key={naam}>
                  <dt>{naam}</dt>
                  <dd>{waarde}</dd>
                </div>
              ))}
            </dl>
          </>
        )}
        <form className="pg-zoek" onSubmit={zoekVak} role="search">
          <label htmlFor="pg-zoekveld" className={eigenPlek ? 'pg-zoek__label is-klein' : 'pg-zoek__label'}>
            {eigenPlek ? 'Ander vak bekijken' : 'Zoek je vak'}
          </label>
          <div className="pg-zoek__rij">
            <input
              id="pg-zoekveld"
              ref={zoekRef}
              onFocus={(e) => e.target.select()}
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={3}
              placeholder="bv. 125"
              value={zoek}
              onChange={(e) => setZoek(e.target.value.replace(/\D/g, ''))}
              aria-describedby={melding ? 'pg-melding' : undefined}
            />
            <button type="submit" aria-label="Zoek vak">
              <Search size={18} strokeWidth={2.4} />
            </button>
          </div>
          {melding && (
            <p className="pg-zoek__melding" id="pg-melding" role="alert">
              {melding}
            </p>
          )}
          {eigenPlek && vakNr !== eigenPlek.vak && (
            <button type="button" className="pg-zoek__terug" onClick={() => kiesVak(eigenPlek.vak)}>
              Terug naar mijn plek (vak {eigenPlek.vak})
            </button>
          )}
        </form>
      </section>

      {/* Plattegrond met pin, ingang en route; tik op een vak om erheen te gaan */}
      <div
        className="pg-kaart"
        ref={kaartRef}
        // ingezoomd: slepen is van ons; anders mag de pagina gewoon scrollen
        style={{ aspectRatio: data.verhouding, touchAction: z.s > 1 ? 'none' : 'pan-y' }}
        {...handlers}
      >
        <div
          className="pg-kaart__laag"
          style={{
            transform: `translate(${z.x}px, ${z.y}px) scale(${z.s})`,
            transition: bezig ? 'none' : undefined,
            '--tegen': tegen,
          }}
        >
          <img src={data.afbeelding} alt="Plattegrond van De Grolsch Veste met alle vakken en ingangen A tot en met Q" draggable="false" />

          {vak && ingang && (
            <svg className="pg-route" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
              <line x1={ingang.x} y1={ingang.y} x2={vak.x} y2={vak.y} />
            </svg>
          )}

          {data.vakken.map((v) => (
            <button
              key={v.vak}
              type="button"
              className="pg-vak"
              style={{ left: `${v.x}%`, top: `${v.y}%` }}
              aria-label={`Vak ${v.vak}`}
              onClick={() => !gesleept.current && kiesVak(v.vak)}
            />
          ))}

          {ingang && (
            <span className="pg-ingang" style={{ left: `${ingang.x}%`, top: `${ingang.y}%` }} aria-hidden="true">
              {vak.ingang}
            </span>
          )}

          {vak && (
            <span className="pg-pin" key={vak.vak} style={{ left: `${vak.x}%`, top: `${vak.y}%` }} aria-hidden="true">
              <i />
            </span>
          )}
        </div>

        <div className="pg-zoomknoppen">
          <button type="button" onClick={() => knop(1.5, vak)} disabled={z.s >= MAX_ZOOM} aria-label="Inzoomen">
            <Plus size={18} strokeWidth={2.4} />
          </button>
          <button type="button" onClick={() => knop(1 / 1.5, vak)} disabled={z.s <= MIN_ZOOM} aria-label="Uitzoomen">
            <Minus size={18} strokeWidth={2.4} />
          </button>
          {z.s > 1 && (
            <button type="button" onClick={reset} aria-label="Hele plattegrond tonen">
              <RotateCcw size={16} strokeWidth={2.4} />
            </button>
          )}
        </div>
      </div>

      {/* Stappenkaart */}
      {vak ? (
        <section className="pg-stappen" aria-live="polite">
          <h3>Zo kom je bij je plek</h3>
          <ol>
            {stappenVoor(vak, plek).map((stap, i) => (
              <li key={i}>
                <span className="pg-stappen__nr" aria-hidden="true">
                  {i + 1}
                </span>
                {stap}
              </li>
            ))}
          </ol>
          <p className="pg-stappen__noot">Indicatie op basis van de plattegrond. Volg ter plekke de bewegwijzering.</p>
        </section>
      ) : (
        <p className="pg-leeg">Zoek je vak of tik op de plattegrond: dan zie je hier hoe je er komt.</p>
      )}
    </div>
  )
}
