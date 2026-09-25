import { useEffect, useState } from 'react'
import { getMatches, getPlayers, getResults, getStandings } from '../../api'
import { maakWeetjes } from '../../weetjes'

// Weetje (bal met de gloeilamp): één weetje per keer, in dezelfde rode
// kaartstijl als de Weekquiz. De weetjes bouwt maakWeetjes() uit de data van
// de API, dus niets is verzonnen.
function haalTeam(team) {
  // Ontbreekt één bron, dan vallen alleen die weetjes weg
  const veilig = (p) => p.catch(() => undefined)
  return Promise.all([
    veilig(getPlayers(team)),
    veilig(getStandings(team)),
    veilig(getResults(team)),
    veilig(getMatches('gepland', team)),
  ]).then(([spelers, stand, uitslagen, programma]) => ({ spelers, stand, uitslagen, programma }))
}

// Willekeurige volgorde, zodat "Nog een weetje" pas herhaalt als alles geweest is
function schud(lijst) {
  const kopie = [...lijst]
  for (let i = kopie.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[kopie[i], kopie[j]] = [kopie[j], kopie[i]]
  }
  return kopie
}

export default function WeetjeTegel() {
  const [weetjes, setWeetjes] = useState(undefined)
  const [index, setIndex] = useState(0)

  useEffect(() => {
    let actief = true
    Promise.all([haalTeam('mannen'), haalTeam('vrouwen')]).then(([mannen, vrouwen]) => {
      if (actief) setWeetjes(schud(maakWeetjes({ mannen, vrouwen })))
    })
    return () => {
      actief = false
    }
  }, [])

  if (weetjes === undefined) return <div className="card">Laden...</div>

  return (
    <div className="quiz-kaart weetje-kaart">
      <span className="eyebrow quiz-kaart__eyebrow">Weetje</span>
      {weetjes.length ? (
        <>
          <p className="quiz-kaart__voortgang">
            {index + 1} van {weetjes.length}
          </p>
          {/* key: elk nieuw weetje komt opnieuw binnen */}
          <p key={index} className="quiz-kaart__vraag weetje-kaart__tekst" aria-live="polite">
            {weetjes[index]}
          </p>
          <button
            type="button"
            className="quiz-kaart__volgende"
            onClick={() => setIndex((i) => (i + 1) % weetjes.length)}
          >
            Nog een weetje
          </button>
        </>
      ) : (
        <p className="quiz-kaart__vraag">Er zijn nu even geen weetjes. Probeer het later nog eens.</p>
      )}
    </div>
  )
}
