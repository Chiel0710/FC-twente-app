import { useEffect, useState } from 'react'
import { getMatches, getResults } from '../api'
import TeamSchakelaar from '../components/TeamSchakelaar'
import WedstrijdTegel from '../components/WedstrijdTegel'
import WedstrijdPlaatje from '../components/WedstrijdPlaatje'
import OpstellingTegel from '../components/OpstellingTegel'
import TegelZone from '../components/TegelZone'
import { useTeamKeuze } from '../teamKeuze'

// Home volgens het Canva-ontwerp, van boven naar onder:
//   schakelaar Mannen / Vrouwen
//   a. wedstrijdtegel (in code; volgt het wedstrijdmoment van de demo)
//   b. opstelling (in code; alleen bij de mannen, want opstelling.json is van de mannen)
//   c–g. plaatjes-tegels uit tegels.json, in de volgorde van het fantype;
//        "Waar te kijken" staat altijd onderaan
//
// props (uit App.jsx):
//   demo        — state uit useDemo()
//   demoActief  — staat de demo aan (zie demoModus.js)
//   onOpenRecap — "Twente in 60 seconden" bij de eindstand

// Lokale datum "2026-09-20" van een kickoff
function datumVan(kickoff) {
  const d = new Date(kickoff)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export default function Home({ demo, demoActief, onOpenRecap }) {
  const { team } = useTeamKeuze()
  const [volgende, setVolgende] = useState(undefined) // eerstvolgende wedstrijd van het team
  const [demoMatch, setDemoMatch] = useState(null) // de demowedstrijd uit de database
  const [fout, setFout] = useState(false)

  useEffect(() => {
    let actief = true
    getMatches('gepland', team)
      .then((geplande) => actief && setVolgende(geplande[0] ?? null))
      .catch(() => actief && setFout(true))
    return () => {
      actief = false
    }
  }, [team])

  // De demo speelt een echte, al gespeelde mannenwedstrijd na (datum uit de
  // demo-state); logo's en competitielogo halen we uit die wedstrijd
  const demoDatum = demo?.wedstrijd?.datum
  useEffect(() => {
    if (!demoDatum) return
    let actief = true
    getResults('mannen')
      .then((uitslagen) => actief && setDemoMatch(uitslagen.find((m) => datumVan(m.kickoff) === demoDatum) ?? null))
      .catch(() => {})
    return () => {
      actief = false
    }
  }, [demoDatum])

  // De demo is een mannenwedstrijd: bij Vrouwen altijd de eigen eerstvolgende wedstrijd
  const toonDemo = team === 'mannen' && demoActief && demoMatch
  const fase = toonDemo ? demo.fase : null

  // Na de wedstrijd: stemmen open en de analyse staat klaar;
  // vóór de wedstrijd "Actie!" op Aanbiedingen (de deal "een helft eerder")
  const labels =
    fase === 'na' || fase === 'dagerna'
      ? { 'player-of-the-match': 'Stemmen open', wedstrijdanalyse: 'Nieuw' }
      : fase === 'voor'
        ? { aanbiedingen: 'Actie!' }
        : {}

  return (
    <div className="home">
      <TeamSchakelaar />

      {fout && <div className="card">Kan de wedstrijden nu niet ophalen. Controleer of de backend draait.</div>}

      {/* Mannen: tegel met de achtergronden uit het ontwerp (pitchverloop);
          vrouwen: de getekende tegel met hun eigen eerstvolgende wedstrijd */}
      {team === 'mannen' && (
        <WedstrijdPlaatje demo={demoActief ? demo : null} onOpenRecap={onOpenRecap} />
      )}

      {team === 'vrouwen' && !fout && volgende !== undefined && (
        <WedstrijdTegel
          match={toonDemo ? demoMatch : volgende}
          demo={toonDemo ? demo : null}
          onOpenRecap={onOpenRecap}
        />
      )}

      {team === 'mannen' && <OpstellingTegel fase={fase} />}

      <TegelZone zone="home" labels={labels} />
    </div>
  )
}
