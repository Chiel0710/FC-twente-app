import { useEffect, useState } from 'react'
import { getPlayers } from '../../api'
import SpelerAvatar from '../../components/SpelerAvatar'
import TeamSchakelaar from '../../components/TeamSchakelaar'
import { useTeamKeuze } from '../../teamKeuze'

// Echte selecties uit de database: mannen (zelfde spelers als bij Man of the
// Match) en vrouwen. Bovenaan de schakelaar (zelfde keuze als op Wedstrijden
// en Home); daaronder per linie gegroepeerd.
const EYEBROW = { mannen: 'Eerste elftal', vrouwen: 'FC Twente Vrouwen' }

// Vaste volgorde van achter naar voren; "positie" in de bron is enkelvoud
const LINIES = [
  { positie: 'Keeper', titel: 'Keepers' },
  { positie: 'Verdediger', titel: 'Verdedigers' },
  { positie: 'Middenvelder', titel: 'Middenvelders' },
  { positie: 'Aanvaller', titel: 'Aanvallers' },
]

function groepeer(spelers) {
  const opRugnummer = (a, b) => a.rugnummer - b.rugnummer
  const groepen = LINIES.map(({ positie, titel }) => ({
    titel,
    spelers: spelers.filter((s) => s.positie === positie).sort(opRugnummer),
  }))
  // Positie ontbreekt in de bron: niet raden, maar apart onderaan tonen
  const zonder = spelers.filter((s) => !LINIES.some((l) => l.positie === s.positie))
  if (zonder.length) groepen.push({ titel: 'Positie onbekend', spelers: zonder.sort(opRugnummer) })
  return groepen.filter((g) => g.spelers.length)
}

// startSpeler: rugnummer (mannen) om naartoe te scrollen en even te laten
// oplichten, bv. vanuit een nieuwsbericht
export default function SelectieOverzicht({ startSpeler = null }) {
  const { team, kiesTeam } = useTeamKeuze()
  // Per team bewaren, zodat terugschakelen meteen werkt
  const [perTeam, setPerTeam] = useState({})
  const spelers = perTeam[team]

  useEffect(() => {
    if (perTeam[team]) return
    let actief = true
    getPlayers(team).then((data) => {
      if (actief) setPerTeam((oud) => ({ ...oud, [team]: data }))
    })
    return () => {
      actief = false
    }
  }, [team, perTeam])

  // Nieuws gaat over het eerste elftal: dan de mannen tonen
  useEffect(() => {
    if (startSpeler != null && team !== 'mannen') kiesTeam('mannen')
    // alleen bij het openen
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Naar de speler scrollen zodra de selectie er staat
  useEffect(() => {
    if (startSpeler == null || !spelers || team !== 'mannen') return
    const kaart = document.getElementById(`speler-${startSpeler}`)
    if (!kaart) return
    const snel = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    kaart.scrollIntoView({ behavior: snel ? 'auto' : 'smooth', block: 'center' })
    kaart.classList.add('is-oplichtend')
    const t = setTimeout(() => kaart.classList.remove('is-oplichtend'), 2200)
    return () => clearTimeout(t)
  }, [startSpeler, spelers, team])

  return (
    <div className="meer-sub">
      <div className="section-heading">
        <span className="eyebrow">{EYEBROW[team]}</span>
        <h2>Selectie</h2>
      </div>

      <TeamSchakelaar />

      {spelers === undefined && <div className="card">Selectie laden...</div>}

      {spelers &&
        groepeer(spelers).map((groep) => (
          <section className="selectie-linie" key={groep.titel}>
            <h3 className="selectie-linie__titel">
              {groep.titel}
              <span className="selectie-linie__aantal">{groep.spelers.length}</span>
            </h3>
            <div className="selectie-raster">
              {groep.spelers.map((speler) => (
                <div className="selectie-kaart" key={speler.id} id={team === 'mannen' ? `speler-${speler.rugnummer}` : undefined}>
                  <SpelerAvatar speler={speler} />
                  <span className="selectie-kaart__nummer">#{speler.rugnummer}</span>
                  <span className="selectie-kaart__naam">{speler.naam}</span>
                </div>
              ))}
            </div>
          </section>
        ))}
    </div>
  )
}
