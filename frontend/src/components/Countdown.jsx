import { useEffect, useState } from 'react'

// Berekent het verschil tussen nu en de kickoff-tijd.
function berekenVerschil(doel) {
  const verschil = Math.max(0, new Date(doel).getTime() - Date.now())
  const dagen = Math.floor(verschil / (1000 * 60 * 60 * 24))
  const uren = Math.floor((verschil / (1000 * 60 * 60)) % 24)
  const minuten = Math.floor((verschil / (1000 * 60)) % 60)
  const seconden = Math.floor((verschil / 1000) % 60)
  return { dagen, uren, minuten, seconden, afgelopen: verschil === 0 }
}

// Live afteller naar de kickoff van de eerstvolgende wedstrijd.
export default function Countdown({ kickoff }) {
  const [tijd, setTijd] = useState(() => berekenVerschil(kickoff))

  useEffect(() => {
    const interval = setInterval(() => {
      setTijd(berekenVerschil(kickoff))
    }, 1000)
    return () => clearInterval(interval)
  }, [kickoff])

  const eenheden = [
    { label: 'Dagen', waarde: tijd.dagen },
    { label: 'Uur', waarde: tijd.uren },
    { label: 'Min', waarde: tijd.minuten },
    { label: 'Sec', waarde: tijd.seconden },
  ]

  return (
    <div className="scoreboard__clock">
      {eenheden.map((eenheid) => (
        <div className="scoreboard__clock-unit" key={eenheid.label}>
          <span className="scoreboard__clock-value">
            {String(eenheid.waarde).padStart(2, '0')}
          </span>
          <span className="scoreboard__clock-label">{eenheid.label}</span>
        </div>
      ))}
    </div>
  )
}
