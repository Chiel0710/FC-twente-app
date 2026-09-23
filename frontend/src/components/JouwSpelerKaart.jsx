import { useEffect, useState } from 'react'
import { getMotm, getResults } from '../api'
import { HUIDIG_PROFIEL_ID } from '../profiel'
import SpelerAvatar from './SpelerAvatar'

// Laat op Home de eigen Man of the Match-stem terugzien, als die er is.
// Geen stem uitgebracht (of nog geen wedstrijd gespeeld) → toont niets.
export default function JouwSpelerKaart() {
  const [data, setData] = useState(undefined)

  useEffect(() => {
    let actief = true

    getResults().then(async (resultaten) => {
      const laatste = resultaten[0]
      if (!laatste) {
        if (actief) setData(null)
        return
      }
      const motm = await getMotm(laatste.id, HUIDIG_PROFIEL_ID)
      if (!actief) return
      const gekozen = motm.resultaten.find((r) => r.player.id === motm.eigenKeuze)
      if (!gekozen) {
        setData(null)
        return
      }
      const opponent = laatste.uitTeam.isTwente ? laatste.thuisTeam.name : laatste.uitTeam.name
      setData({ speler: gekozen.player, opponent })
    })

    return () => {
      actief = false
    }
  }, [])

  if (!data) return null

  return (
    <div className="jouw-speler-kaart">
      <SpelerAvatar speler={data.speler} />
      <div className="jouw-speler-kaart__tekst">
        <span className="eyebrow jouw-speler-kaart__eyebrow">Jouw speler van de wedstrijd</span>
        <h3>{data.speler.naam}</h3>
        <p>tegen {data.opponent}</p>
      </div>
    </div>
  )
}
