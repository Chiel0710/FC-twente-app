import { useEffect, useState } from 'react'
import { getMatches, getResults } from '../api'
import TeamSchakelaar from '../components/TeamSchakelaar'
import WedstrijdPlaatje from '../components/WedstrijdPlaatje'
import OpstellingTegel from '../components/OpstellingTegel'
import TegelZone from '../components/TegelZone'
import { useTeamKeuze } from '../teamKeuze'

// Home volgens het Canva-ontwerp, van boven naar onder:
//   schakelaar Mannen / Vrouwen
//   a. wedstrijdtegel: mannen volgen het wedstrijdmoment van de demo; vrouwen
//      zien de generieke tegel met hun eerstvolgende wedstrijd (nooit de demo)
//   b. opstelling (in code; mannen en vrouwen elk hun laatste opstelling)
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

// Een geplande wedstrijd blijft op de tegel tot 2 uur na de aftrap; daarna de volgende
const NA_AFTRAP_MS = 2 * 60 * 60 * 1000

// Eerstvolgende wedstrijd uit een lijst geplande wedstrijden (op aftrap gesorteerd)
function eerstvolgende(geplande, nu = Date.now()) {
  return geplande.find((m) => new Date(m.kickoff).getTime() + NA_AFTRAP_MS > nu) ?? null
}

export default function Home({ demo, demoActief, onOpenRecap }) {
  const { team } = useTeamKeuze()
  const [geplande, setGeplande] = useState(undefined) // geplande wedstrijden van het team
  const [nu, setNu] = useState(() => Date.now())
  const [demoMatch, setDemoMatch] = useState(null) // de demowedstrijd uit de database
  const [fout, setFout] = useState(false)

  useEffect(() => {
    let actief = true
    getMatches('gepland', team)
      .then((lijst) => actief && setGeplande(lijst))
      .catch(() => actief && setFout(true))
    return () => {
      actief = false
    }
  }, [team])

  // Elke minuut opnieuw kijken welke wedstrijd de eerstvolgende is
  useEffect(() => {
    const t = setInterval(() => setNu(Date.now()), 60 * 1000)
    return () => clearInterval(t)
  }, [])
  const volgende = geplande === undefined ? undefined : eerstvolgende(geplande, nu)

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
  // vóór de wedstrijd "Actie!" op Aanbiedingen (de deal "een helft eerder").
  // Vrouwen: hun analyse (PSV – Twente) staat altijd klaar.
  const labels =
    team === 'vrouwen'
      ? { wedstrijdanalyse: 'Nieuw' }
      : fase === 'na' || fase === 'dagerna'
      ? { 'player-of-the-match': 'Stemmen open', wedstrijdanalyse: 'Nieuw' }
      : fase === 'voor'
        ? { aanbiedingen: 'Actie!' }
        : {}

  return (
    <div className="home">
      <TeamSchakelaar />

      {fout && <div className="card">Kan de wedstrijden nu niet ophalen. Controleer of de backend draait.</div>}

      {/* Mannen: tegel met de achtergronden uit het ontwerp (pitchverloop);
          vrouwen: dezelfde tegel met de generieke achtergrond en hun eigen
          eerstvolgende wedstrijd; de pitch heeft daar geen invloed op */}
      {team === 'mannen' && (
        <WedstrijdPlaatje key="mannen" demo={demoActief ? demo : null} onOpenRecap={onOpenRecap} />
      )}

      {team === 'vrouwen' && !fout && volgende && <WedstrijdPlaatje key="vrouwen" wedstrijd={volgende} />}

      {/* Mannen altijd; vrouwen zodra de admin een opstelling publiceerde */}
      <OpstellingTegel fase={team === 'mannen' ? fase : null} team={team} />

      <TegelZone zone="home" labels={labels} />
    </div>
  )
}
