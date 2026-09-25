import { useEffect, useState } from 'react'
import { getMatches, getResults } from './api'

// Over welke wedstrijd gaan het kaartje, "Ben je erbij?" en "Verkoop je kaart"?
// Een seizoenskaart geldt alleen thuis, dus: de eerstvolgende THUISwedstrijd
// van de mannen. Zolang de demo actief is: de demowedstrijd (Twente – PSV).
// Geeft undefined zolang hij laadt, null als er geen wedstrijd is.

// Lokale datum "2026-09-20" van een kickoff
export function datumVan(kickoff) {
  const d = new Date(kickoff)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function useKaartWedstrijd(demo, demoActief) {
  const [match, setMatch] = useState(undefined)
  const demoDatum = demoActief ? demo?.wedstrijd?.datum : null

  useEffect(() => {
    let actief = true
    const ophalen = demoDatum
      ? getResults('mannen').then((uitslagen) => uitslagen.find((m) => datumVan(m.kickoff) === demoDatum))
      : getMatches('gepland', 'mannen').then((geplande) => geplande.find((m) => m.thuisTeam.isTwente))
    ophalen
      .then((m) => actief && setMatch(m ?? null))
      .catch(() => actief && setMatch(null))
    return () => {
      actief = false
    }
  }, [demoDatum])

  return match
}
