import { useEffect, useState } from 'react'
import { getPlayers } from '../api'
import opstelling from '../data/opstelling.json'
import opstellingVrouwen from '../data/opstelling-vrouwen.json'
import { useDemoDb, wijzigingen } from '../lib/demoDb'

// Opstelling op Home, in de stijl van ref-opstelling.png: zwarte kaart, witte
// veldlijnen in perspectief, spelers als zwarte badges met rode gloedrand.
// data/opstelling.json geeft rijen van keeper naar spits (rugnummers); de
// naam zoeken we op via het rugnummer in de selectie (nooit zelf invullen).

// Het veld als trapezium (viewBox 100 x 100): onderkant breed, bovenkant smal
const ONDER = { y: 94, links: 8, rechts: 92 }
const BOVEN = { y: 8, links: 19, rechts: 81 }

// Linker- en rechterrand van het veld op hoogte y
function randOp(y) {
  const t = (ONDER.y - y) / (ONDER.y - BOVEN.y)
  return {
    links: ONDER.links + (BOVEN.links - ONDER.links) * t,
    rechts: ONDER.rechts + (BOVEN.rechts - ONDER.rechts) * t,
  }
}

// Een lijn op het veld: x in 0..1 over de breedte, y in 0..1 van onder naar boven
function punt(x, y) {
  const yy = ONDER.y - (ONDER.y - BOVEN.y) * y
  const { links, rechts } = randOp(yy)
  return `${(links + (rechts - links) * x).toFixed(2)},${yy.toFixed(2)}`
}

function Veld() {
  const lijn = (...p) => p.map(([x, y]) => punt(x, y)).join(' ')
  return (
    <svg className="opstelling__veld" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
      <polygon points={lijn([0, 0], [1, 0], [1, 1], [0, 1])} />
      <polyline points={lijn([0, 0.5], [1, 0.5])} />
      {/* strafschopgebieden en doelgebieden, onder en boven */}
      <polyline points={lijn([0.2, 0], [0.2, 0.17], [0.8, 0.17], [0.8, 0])} />
      <polyline points={lijn([0.37, 0], [0.37, 0.06], [0.63, 0.06], [0.63, 0])} />
      <polyline points={lijn([0.2, 1], [0.2, 0.83], [0.8, 0.83], [0.8, 1])} />
      <polyline points={lijn([0.37, 1], [0.37, 0.94], [0.63, 0.94], [0.63, 1])} />
      {/* middencirkel: ellips, platter door het perspectief */}
      <ellipse cx="50" cy="51" rx="11" ry="6.5" />
      <circle cx="50" cy="51" r="0.5" className="opstelling__stip" />
    </svg>
  )
}

// "Bart van Rooij" -> "van Rooij"; één woord blijft zoals het is
function achternaam(naam) {
  const delen = naam.split(' ')
  return delen.length > 1 ? delen.slice(1).join(' ') : naam
}

// Vrouwen: voorletter + achternaam, tussenvoegsels afgekort:
// "Imre van der Vegt" -> "I. v.d. Vegt", "Danique van Ginkel" -> "D. v. Ginkel",
// "Eva Oude Elberink" -> "E. O. Elberink"
const TUSSENVOEGSELS = new Set(['van', 'der', 'den', 'de', 'het', 'ter', 'ten', 'te', 'in', "'t"])
function kortenaam(naam) {
  const delen = naam.split(' ')
  if (delen.length < 2) return naam
  const voorletter = `${delen[0][0]}.`
  const midden = delen.slice(1, -1)
  // kleine tussenvoegsels aan elkaar ("v.d."), andere delen als losse letter ("O.")
  const stukken = []
  for (const d of midden) {
    const letter = `${d[0]}.`
    if (TUSSENVOEGSELS.has(d) && stukken.length && TUSSENVOEGSELS.has(stukken.at(-1).bron)) {
      stukken.at(-1).tekst += letter
    } else {
      stukken.push({ bron: d, tekst: letter })
    }
  }
  return [voorletter, ...stukken.map((s) => s.tekst), delen.at(-1)].join(' ')
}

// "I. v.d. Vegt" -> kleine regel "I. v.d." met daaronder "Vegt"
function NaamKort({ naam }) {
  const kort = kortenaam(naam)
  const i = kort.lastIndexOf(' ')
  if (i < 0) return kort
  return (
    <>
      <small>{kort.slice(0, i)}</small> {kort.slice(i + 1)}
    </>
  )
}

// De opstelling die de admin publiceerde (Publiceren > Opstelling), anders
// de standaard: data/opstelling.json (mannen) of data/opstelling-vrouwen.json
export function opstellingVan(team, w = wijzigingen()) {
  return w.admin.opstelling[team] ?? (team === 'mannen' ? opstelling : opstellingVrouwen)
}

// "PSV – FC Twente Vrouwen" + "0-4" -> "PSV – FC Twente 0-4" (alleen als het
// bestand zegt welke wedstrijd het was; een admin-publicatie zegt dat niet)
function wedstrijdVan(o) {
  if (!o.wedstrijd || !o.uitslag) return null
  return `${o.wedstrijd.replace(/ Vrouwen$/, '')} ${o.uitslag}`
}

/**
 * fase: demofase ("live", "rust", "na", "dagerna" = vandaag gespeeld) of null
 * team: 'mannen' | 'vrouwen'
 */
export default function OpstellingTegel({ fase, team = 'mannen' }) {
  const w = useDemoDb() // een nieuwe publicatie is meteen zichtbaar
  const huidig = opstellingVan(team, w)
  const [perNummer, setPerNummer] = useState(null)

  useEffect(() => {
    let actief = true
    getPlayers(team)
      .then((spelers) => actief && setPerNummer(new Map(spelers.map((s) => [s.rugnummer, s.naam]))))
      .catch(() => actief && setPerNummer(new Map()))
    return () => {
      actief = false
    }
  }, [team])

  if (!huidig) return null
  const vandaag = ['live', 'rust', 'na', 'dagerna'].includes(fase)
  const rijen = huidig.rijen
  const vrouwen = team === 'vrouwen'
  const wedstrijd = vrouwen ? wedstrijdVan(huidig) : null

  return (
    <section className="opstelling-blok" aria-labelledby="opstelling-titel">
      <h2 className="opstelling-titel" id="opstelling-titel">
        {vandaag ? 'Opstelling vandaag' : 'Laatste opstelling'}
        {wedstrijd && ` · ${wedstrijd}`}
      </h2>
      <div className="opstelling">
        <Veld />
        <ol className="opstelling__spelers" aria-label={`Opstelling ${huidig.formatie}`}>
          {rijen.map((rij, r) => {
            // Rij 0 (keeper) onderaan, laatste rij (spits) bovenaan
            const y = 0.06 + (r / (rijen.length - 1)) * 0.86
            return rij.map((nummer, i) => {
              const x = (i + 1) / (rij.length + 1)
              const [px, py] = punt(x, y).split(',').map(Number)
              const naam = perNummer?.get(nummer)
              return (
                <li
                  key={nummer}
                  className="opstelling__speler"
                  style={{ left: `${px}%`, top: `${py}%` }}
                >
                  <span className="opstelling__badge">{nummer}</span>
                  {vrouwen ? (
                    // twee regels, zodat drie namen naast elkaar niet botsen:
                    // "I. v.d." boven, "Vegt" eronder
                    <span className="opstelling__naam opstelling__naam--kort">
                      {naam && <NaamKort naam={naam} />}
                    </span>
                  ) : (
                    <span className="opstelling__naam">{naam ? achternaam(naam) : ''}</span>
                  )}
                </li>
              )
            })
          })}
        </ol>
      </div>
    </section>
  )
}
