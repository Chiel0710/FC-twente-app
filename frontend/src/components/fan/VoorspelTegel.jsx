import { useEffect, useState } from 'react'
import { getMatches } from '../../api'
import VoorspelKaart from '../VoorspelKaart'

// Haalt zelf de eerstvolgende geplande wedstrijd op — verhuisd uit Fan.jsx,
// VoorspelKaart zelf blijft ongewijzigd.
export default function VoorspelTegel() {
  const [volgende, setVolgende] = useState(undefined)

  useEffect(() => {
    let actief = true
    getMatches('gepland').then((geplande) => {
      if (actief) setVolgende(geplande[0] ?? null)
    })
    return () => {
      actief = false
    }
  }, [])

  if (volgende === undefined) return <div className="card">Laden...</div>
  if (!volgende) return null
  return <VoorspelKaart match={volgende} />
}
