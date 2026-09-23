import { useEffect, useState } from 'react'
import { getPlayers, getResults } from '../../api'
import MotmKaart from '../MotmKaart'

// Haalt zelf de laatste uitslag + selectie op — verhuisd uit Fan.jsx.
// MotmKaart (met het spelersraster + echte foto's) blijft ongewijzigd.
export default function MotmTegel() {
  const [laatsteUitslag, setLaatsteUitslag] = useState(undefined)
  const [spelers, setSpelers] = useState([])

  useEffect(() => {
    let actief = true
    Promise.all([getResults(), getPlayers()]).then(([resultaten, spelersData]) => {
      if (!actief) return
      setLaatsteUitslag(resultaten[0] ?? null)
      setSpelers(spelersData)
    })
    return () => {
      actief = false
    }
  }, [])

  if (laatsteUitslag === undefined || spelers.length === 0) {
    return <div className="card">Laden...</div>
  }
  if (!laatsteUitslag) return null
  return <MotmKaart match={laatsteUitslag} spelers={spelers} />
}
