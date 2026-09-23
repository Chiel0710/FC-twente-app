import { useEffect, useState } from 'react'
import { getPlayers } from '../../api'
import SpelerAvatar from '../../components/SpelerAvatar'

// Echte selectie uit de database (zelfde spelers als bij Man of the Match).
// Positie ontbreekt in de bron voor de meeste spelers — dan een streepje,
// nooit zelf verzonnen.
export default function SelectieOverzicht() {
  const [spelers, setSpelers] = useState(undefined)

  useEffect(() => {
    let actief = true
    getPlayers().then((data) => {
      if (actief) setSpelers(data)
    })
    return () => {
      actief = false
    }
  }, [])

  return (
    <div className="meer-sub">
      <div className="section-heading">
        <span className="eyebrow">Eerste elftal</span>
        <h2>Selectie</h2>
      </div>

      {spelers === undefined && <div className="card">Selectie laden...</div>}

      {spelers && (
        <div className="selectie-raster">
          {spelers.map((speler) => (
            <div className="selectie-kaart" key={speler.id}>
              <SpelerAvatar speler={speler} />
              <span className="selectie-kaart__naam">{speler.naam}</span>
              <span className="selectie-kaart__info">
                #{speler.rugnummer} · {speler.positie ?? '—'}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
