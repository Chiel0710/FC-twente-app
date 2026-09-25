import { useEffect, useState } from 'react'
import { useTegels } from '../featureVolgorde'
import { SegmentCijfer } from './WedstrijdTegel'

// Wedstrijdtegel op Home (mannen) met de achtergronden uit het ontwerp:
// public/home/tegels.json -> "wedstrijdtegel". Logo's, competitielogo en gras
// zitten in het plaatje; wat verandert zet de code erover in drie vlakken
// ("midden-groot", "midden-klein", "afteller", posities in % van de kaart).
//
//   voor         twente-psv met tijd  afteller uu:mm:ss "tot de aftrap"
//   live / rust  twente-psv leeg      stand, minuut met rood bolletje (of RUST), doelpunten
//   na           twente-psv leeg      eindstand, "Eindstand", knop "Twente in 60 seconden"
//   dagerna /    fortuna met tijd     afteller naar de aftrap uit tegels.json
//   geen demo
//
// De demodata komt uit useDemo() (zelfde data als <LiveScore />). Tussen de
// fases een crossfade van 400 ms. Alleen de knop is tikbaar, de tegel niet.

const CROSSFADE_MS = 400
const twee = (n) => String(n).padStart(2, '0')

// "Younes Taha" -> "Taha", "Guus Til" -> "Til"
const achternaam = (naam) => naam.split(' ').slice(1).join(' ') || naam

function soortVan(fase) {
  if (fase === 'voor') return 'voor'
  if (fase === 'live' || fase === 'rust') return 'live'
  if (fase === 'na') return 'na'
  return 'volgende' // dagerna, of geen demo
}

// Tikt elke 250 ms; geeft de rest in ms tot `doel` (nooit negatief)
function useRest(doel) {
  const [nu, setNu] = useState(() => Date.now())
  useEffect(() => {
    const t = setInterval(() => setNu(Date.now()), 250)
    return () => clearInterval(t)
  }, [])
  return Math.max(0, (doel ?? nu) - nu)
}

// Digitale klok: blokken van twee cijfers met een label eronder
function Klok({ blokken, onderschrift, label }) {
  return (
    <div className="wp-klok" role="timer" aria-label={label}>
      <div className="wp-klok__cijfers">
        {blokken.map(({ waarde }, i) => (
          <span className="wp-klok__blok" key={i}>
            {i > 0 && (
              <span className="wp-klok__dubbelepunt" aria-hidden="true">
                <i />
                <i />
              </span>
            )}
            {[...twee(waarde)].map((c, j) => (
              <SegmentCijfer cijfer={c} key={j} />
            ))}
          </span>
        ))}
      </div>
      {onderschrift ? (
        <span className="wp-klok__onder">{onderschrift}</span>
      ) : (
        <span className="wp-klok__labels" aria-hidden="true">
          {blokken.map(({ naam }, i) => (
            <span key={i}>{naam}</span>
          ))}
        </span>
      )}
    </div>
  )
}

// Afteller naar de aftrap: boven 24 uur DAGEN · UUR · MIN, daaronder uu:mm:ss
function Afteller({ doel, altijdSeconden }) {
  const rest = useRest(doel)
  const sec = Math.ceil(rest / 1000) // 20 s blijft 20 tot hij echt verstrijkt
  const dagen = Math.floor(sec / 86400)
  const uren = Math.floor(sec / 3600) % 24
  const minuten = Math.floor(sec / 60) % 60
  const seconden = sec % 60
  if (!altijdSeconden && sec >= 86400) {
    return (
      <Klok
        blokken={[
          { waarde: Math.min(dagen, 99), naam: 'Dagen' },
          { waarde: uren, naam: 'Uur' },
          { waarde: minuten, naam: 'Min' },
        ]}
        label={`Nog ${dagen} dagen, ${uren} uur en ${minuten} minuten tot de aftrap`}
      />
    )
  }
  return (
    <Klok
      blokken={[
        { waarde: Math.floor(sec / 3600), naam: 'Uur' },
        { waarde: minuten, naam: 'Min' },
        { waarde: seconden, naam: 'Sec' },
      ]}
      onderschrift={altijdSeconden ? 'tot de aftrap' : null}
      label={`Nog ${Math.floor(sec / 3600)} uur, ${minuten} minuten en ${seconden} seconden tot de aftrap`}
    />
  )
}

// Zelfde kloktijd als de aftrap uit tegels.json ("2026-09-20T16:45"), maar vandaag
function vandaagOm(aftrap) {
  const [u, m] = aftrap.split('T')[1].split(':').map(Number)
  const d = new Date()
  d.setHours(u, m, 0, 0)
  return d.getTime()
}

function Vlak({ wt, naam, children, className = '' }) {
  const v = wt.vlakken[naam]
  return (
    <div
      className={`wp__vlak wp__vlak--${naam} ${className}`}
      style={{ left: `${v['x%']}%`, top: `${v['y%']}%`, width: `${v['breedte%']}%`, height: `${v['hoogte%']}%` }}
    >
      {children}
    </div>
  )
}

// Eén laag van de tegel: achtergrond + tekst in de vlakken voor deze soort
function Laag({ wt, soort, demo, onOpenRecap, actief }) {
  const psv = wt.achtergronden['twente-psv']
  const volgende = wt.achtergronden['fortuna-twente']
  const achtergrond = { voor: psv.metTijd, live: psv.leeg, na: psv.leeg, volgende: volgende.metTijd }[soort]

  return (
    <div className={`wp__laag${actief ? ' is-actief' : ''}`} aria-hidden={!actief}>
      <img
        className="wp__beeld"
        src={achtergrond}
        alt=""
        style={{ width: `${wt.img['breedte%']}%`, left: `${wt.img['links%']}%`, top: `${wt.img['boven%']}%` }}
      />

      {soort === 'voor' && (
        <Vlak wt={wt} naam="afteller">
          {/* pitch: afteller van de server; anders vandaag op de aftraptijd */}
          <Afteller doel={demo?.aftrapLokaal ?? vandaagOm(psv.aftrap)} altijdSeconden />
        </Vlak>
      )}

      {(soort === 'live' || soort === 'na') && demo && (
        <>
          <Vlak wt={wt} naam="midden-groot">
            <strong className="wp__stand">
              {demo.stand.thuis}
              <span aria-hidden="true">-</span>
              {demo.stand.uit}
            </strong>
          </Vlak>
          <Vlak wt={wt} naam="midden-klein">
            <span className="wp__minuut">
              {soort === 'live' && demo.fase !== 'rust' && <i className="wt__stip" aria-hidden="true" />}
              {soort === 'na' ? 'Eindstand' : demo.fase === 'rust' ? 'RUST' : `${demo.minuut}'`}
            </span>
          </Vlak>
        </>
      )}

      {soort === 'live' && demo && (
        <Vlak wt={wt} naam="afteller">
          <div className="wp__doelpunten">
            {[demo.wedstrijd.thuis, demo.wedstrijd.uit].map((team) => (
              <ul key={team} className={team === demo.wedstrijd.thuis ? 'is-thuis' : 'is-uit'} aria-label={`Doelpunten ${team}`}>
                {demo.gebeurtenissen
                  .filter((g) => g.team === team)
                  .map((g) => (
                    <li key={g.minuut}>
                      <b>{g.minuut}'</b> {achternaam(g.speler)}
                    </li>
                  ))}
              </ul>
            ))}
          </div>
        </Vlak>
      )}

      {soort === 'na' && (
        <Vlak wt={wt} naam="afteller">
          <button type="button" className="wp__recap" onClick={onOpenRecap} tabIndex={actief ? 0 : -1}>
            Twente in 60 seconden
          </button>
        </Vlak>
      )}

      {soort === 'volgende' && (
        <Vlak wt={wt} naam="afteller">
          <Afteller doel={new Date(volgende.aftrap).getTime()} />
        </Vlak>
      )}
    </div>
  )
}

/**
 * props:
 *  demo        — state uit useDemo(), of null zonder demo (dan: volgende wedstrijd)
 *  onOpenRecap — knop "Twente in 60 seconden" (→ /highlights/2026-09-20)
 */
export default function WedstrijdPlaatje({ demo, onOpenRecap }) {
  const wt = useTegels()?.wedstrijdtegel
  const soort = soortVan(demo?.fase ?? null)
  // Crossfade: de nieuwe laag komt over de vorige heen; daarna blijft alleen hij
  const [lagen, setLagen] = useState([soort])

  useEffect(() => {
    setLagen((l) => (l.at(-1) === soort ? l : [l.at(-1), soort]))
    const t = setTimeout(() => setLagen([soort]), CROSSFADE_MS + 50)
    return () => clearTimeout(t)
  }, [soort])

  // Alle achtergronden alvast laden, zodat de crossfade nooit een lege tegel toont
  useEffect(() => {
    if (!wt) return
    Object.values(wt.achtergronden).forEach(({ metTijd, leeg }) => {
      new Image().src = metTijd
      new Image().src = leeg
    })
  }, [wt])

  if (!wt) return <div className="wp wp--laden" aria-hidden="true" />

  const titel =
    soort === 'volgende' ? 'Volgende wedstrijd: Fortuna Sittard – FC Twente' : 'FC Twente – PSV'

  return (
    <article
      className="wp"
      style={{ '--verhouding': wt.kaartVerhouding, '--crossfade': `${CROSSFADE_MS}ms` }}
      aria-label={titel}
      aria-live={soort === 'live' ? 'polite' : undefined}
    >
      {lagen.map((s, i) => (
        <Laag key={s} wt={wt} soort={s} demo={demo} onOpenRecap={onOpenRecap} actief={i === lagen.length - 1} />
      ))}
    </article>
  )
}
