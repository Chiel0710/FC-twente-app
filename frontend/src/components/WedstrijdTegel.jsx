import { useEffect, useState } from 'react'

// Wedstrijdtegel bovenaan Home, in de stijl van ref-komende-wedstrijd.png:
// donkerrode kaart, gras onderaan (SVG), thuislogo links, uitlogo rechts,
// competitielogo in het midden. De inhoud volgt het wedstrijdmoment:
//   geen demo       → eerstvolgende wedstrijd, aftrap + datum, afteller
//   "voor"          → FC Twente – PSV vanmiddag, "Te zien bij ...", afteller
//   "live" / "rust" → stand, minuut (of RUST) met pulserende stip, tijdlijn
//   "na" / "dagerna"→ eindstand, "Eindstand", knop "Twente in 60 seconden"
// De demodata komt uit useDemo() (zelfde data als <LiveScore />); alleen de
// vormgeving is anders.

/* ---------- Digitale cijfers (zeven segmenten, getekend in SVG) ---------- */

const T = 8 // dikte van een segment
// Horizontaal segment op hoogte y van x1 tot x2, verticaal op x van y1 tot y2
const h = (x1, x2, y) =>
  `${x1},${y} ${x1 + T / 2},${y - T / 2} ${x2 - T / 2},${y - T / 2} ${x2},${y} ${x2 - T / 2},${y + T / 2} ${x1 + T / 2},${y + T / 2}`
const v = (x, y1, y2) =>
  `${x},${y1} ${x + T / 2},${y1 + T / 2} ${x + T / 2},${y2 - T / 2} ${x},${y2} ${x - T / 2},${y2 - T / 2} ${x - T / 2},${y1 + T / 2}`

const SEGMENTEN = {
  a: h(9, 41, 6),
  b: v(44, 9, 42),
  c: v(44, 48, 81),
  d: h(9, 41, 84),
  e: v(6, 48, 81),
  f: v(6, 9, 42),
  g: h(9, 41, 45),
}

const CIJFER = {
  0: 'abcdef', 1: 'bc', 2: 'abged', 3: 'abgcd', 4: 'fgbc',
  5: 'afgcd', 6: 'afgedc', 7: 'abc', 8: 'abcdefg', 9: 'abcdfg',
}

export function SegmentCijfer({ cijfer }) {
  return (
    <svg className="segment" viewBox="0 0 50 90" aria-hidden="true">
      {[...CIJFER[cijfer]].map((s) => (
        <polygon key={s} points={SEGMENTEN[s]} />
      ))}
    </svg>
  )
}

function SegmentTijd({ tekst, label }) {
  return (
    <div className="segment-tijd" role="timer" aria-label={label}>
      {[...tekst].map((teken, i) =>
        teken === ':' ? (
          <span className="segment-dubbelepunt" key={i} aria-hidden="true">
            <i />
            <i />
          </span>
        ) : (
          <SegmentCijfer cijfer={teken} key={i} />
        ),
      )}
    </div>
  )
}

/* ---------- Afteller ---------- */

const tweeCijfers = (n) => String(n).padStart(2, '0')

// Boven de 24 uur: dagen:uren:minuten; daaronder uren:minuten:seconden
function useAfteller(doel) {
  const [nu, setNu] = useState(() => Date.now())
  useEffect(() => {
    const t = setInterval(() => setNu(Date.now()), 1000)
    return () => clearInterval(t)
  }, [])
  const rest = Math.max(0, new Date(doel).getTime() - nu)
  const dagen = Math.floor(rest / 86_400_000)
  const uren = Math.floor(rest / 3_600_000) % 24
  const minuten = Math.floor(rest / 60_000) % 60
  const seconden = Math.floor(rest / 1000) % 60
  if (rest >= 86_400_000) {
    return {
      tekst: `${tweeCijfers(Math.min(dagen, 99))}:${tweeCijfers(uren)}:${tweeCijfers(minuten)}`,
      label: `Nog ${dagen} dagen, ${uren} uur en ${minuten} minuten tot de aftrap`,
    }
  }
  return {
    tekst: `${tweeCijfers(uren)}:${tweeCijfers(minuten)}:${tweeCijfers(seconden)}`,
    label: `Nog ${uren} uur, ${minuten} minuten en ${seconden} seconden tot de aftrap`,
  }
}

/* ---------- Gras (SVG, vaste "willekeur" zodat het er altijd hetzelfde uitziet) ---------- */

function maakSprieten() {
  let zaad = 7
  const kans = () => {
    zaad = (zaad * 16807) % 2147483647
    return (zaad - 1) / 2147483646
  }
  const lagen = [
    { kleur: '#2c3610', aantal: 70, min: 55, max: 110 },
    { kleur: '#45551a', aantal: 80, min: 40, max: 95 },
    { kleur: '#627226', aantal: 90, min: 22, max: 70 },
  ]
  return lagen.flatMap(({ kleur, aantal, min, max }) =>
    Array.from({ length: aantal }, () => {
      const x = kans() * 404 - 2
      const hoogte = min + kans() * (max - min)
      const buig = (kans() - 0.5) * 22
      const breed = 3 + kans() * 4
      return {
        kleur,
        d: `M${x.toFixed(1)},120 Q${(x + buig / 2).toFixed(1)},${(120 - hoogte / 2).toFixed(1)} ${(x + buig).toFixed(1)},${(120 - hoogte).toFixed(1)} Q${(x + buig / 2 + breed / 2).toFixed(1)},${(120 - hoogte / 2).toFixed(1)} ${(x + breed).toFixed(1)},120 Z`,
      }
    }),
  )
}
const SPRIETEN = maakSprieten()

function Gras() {
  return (
    <svg className="wt__gras" viewBox="0 0 400 120" preserveAspectRatio="none" aria-hidden="true">
      {SPRIETEN.map((s, i) => (
        <path key={i} d={s.d} fill={s.kleur} />
      ))}
    </svg>
  )
}

/* ---------- Tegel ---------- */

const datumKort = new Intl.DateTimeFormat('nl-NL', { day: '2-digit', month: '2-digit' })
const tijdKort = new Intl.DateTimeFormat('nl-NL', { hour: '2-digit', minute: '2-digit' })
const ddmm = (d) => datumKort.format(d).replace('/', '-').replace('.', '-')

// Het eredivisie- en conference-league-logo hebben een doorzichtige achtergrond
// en worden wit gemaakt (zoals in het ontwerp); andere logo's (met eigen witte
// achtergrond) krijgen een klein wit plaatje, zodat ze niet onleesbaar worden.
const WIT_TE_MAKEN = ['/competities/eredivisie.png', '/competities/conference-league.png']

function CompetitieLogo({ pad, naam }) {
  if (!pad) return <span className="wt__competitie" aria-label={naam} />
  const wit = WIT_TE_MAKEN.includes(pad)
  return (
    <span className={`wt__competitie${wit ? ' is-wit' : ' is-plaatje'}`}>
      <img src={pad} alt={naam} />
    </span>
  )
}

// Clublogo's hebben een witte achtergrond; op de rode tegel gebruiken we een
// transparante kopie uit public/logos-transparant (zelfde bestandsnaam)
function ClubLogo({ club }) {
  return <img className="wt__club" src={club.logoUrl.replace('/logos/', '/logos-transparant/')} alt={club.name} />
}

/**
 * props:
 *  match       — wedstrijd uit de database (thuisTeam/uitTeam met logoUrl, kickoff,
 *                competitieLogo): de eerstvolgende, of bij een demo de demowedstrijd
 *  demo        — state uit useDemo(), of null als er geen demo actief is
 *  onOpenRecap — knop "Twente in 60 seconden" (alleen bij "na"/"dagerna")
 */
export default function WedstrijdTegel({ match, demo, onOpenRecap }) {
  const fase = demo?.fase ?? null
  const bezig = fase === 'live' || fase === 'rust'
  const klaar = fase === 'na' || fase === 'dagerna'

  // Vóór de wedstrijd: doel van de afteller. Bij de demo is de wedstrijd
  // "vandaag" op de aftraptijd uit de data (zoals LiveScore "Vanmiddag" toont).
  const aftrap = match ? new Date(match.kickoff) : new Date()
  const doel = fase === 'voor' ? vandaagOm(aftrap) : aftrap
  const afteller = useAfteller(doel)

  if (!match) {
    return (
      <article className="wt wt--leeg">
        <p>Er staat nu geen wedstrijd gepland.</p>
        <Gras />
      </article>
    )
  }

  const aftrapBekend = match.aftrapBekend !== false

  return (
    <article className={`wt${bezig ? ' wt--live' : ''}${klaar ? ' wt--klaar' : ''}`} aria-live={bezig ? 'polite' : undefined}>
      <div className="wt__boven">
        <ClubLogo club={match.thuisTeam} />

        <div className="wt__midden">
          <CompetitieLogo pad={match.competitieLogo} naam={match.competition} />

          {!fase || fase === 'voor' ? (
            <>
              <strong className="wt__groot">{aftrapBekend ? tijdKort.format(aftrap) : 'n.t.b.'}</strong>
              <span className="wt__klein">{fase === 'voor' ? `vandaag ${ddmm(new Date())}` : ddmm(aftrap)}</span>
              {fase === 'voor' && demo.wedstrijd?.uitzending && (
                <span className="wt__tv">Te zien bij {demo.wedstrijd.uitzending}</span>
              )}
            </>
          ) : (
            <>
              <strong className="wt__groot wt__stand">
                {demo.stand.thuis}
                <span aria-hidden="true">–</span>
                {demo.stand.uit}
              </strong>
              <span className="wt__klein wt__minuut">
                {bezig && <i className="wt__stip" aria-hidden="true" />}
                {fase === 'rust' ? 'RUST' : bezig ? `${demo.minuut}'` : 'Eindstand'}
              </span>
            </>
          )}
        </div>

        <ClubLogo club={match.uitTeam} />
      </div>

      <div className="wt__onder">
        {(!fase || fase === 'voor') && <SegmentTijd tekst={afteller.tekst} label={afteller.label} />}

        {(bezig || klaar) && demo.gebeurtenissen.length > 0 && (
          <ul className="wt__tijdlijn">
            {demo.gebeurtenissen.map((g, i) => (
              <li key={i} className={g.team === demo.wedstrijd.thuis ? 'is-thuis' : 'is-uit'}>
                <b>{g.minuut}'</b>
                <span>{g.speler}</span>
                <em>{g.stand}</em>
              </li>
            ))}
          </ul>
        )}

        {klaar && (
          <button type="button" className="wt__recap" onClick={onOpenRecap}>
            Twente in 60 seconden
          </button>
        )}
      </div>

      <Gras />
    </article>
  )
}

// Zelfde kloktijd als de aftrap, maar vandaag
function vandaagOm(aftrap) {
  const d = new Date()
  d.setHours(aftrap.getHours(), aftrap.getMinutes(), 0, 0)
  return d
}
