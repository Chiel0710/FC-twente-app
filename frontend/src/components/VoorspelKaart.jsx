import { useEffect, useState } from 'react'
import { getVoorspelling, stemVoorspelling } from '../api'
import { HUIDIG_PROFIEL_ID } from '../profiel'
import TeamBadge from './TeamBadge'
import StemBalk from './StemBalk'

// "Voorspellen" — geen punten, alleen het collectieve sfeerbeeld achteraf.
export default function VoorspelKaart({ match }) {
  const [resultaat, setResultaat] = useState(undefined)
  const [wijzigen, setWijzigen] = useState(false)

  useEffect(() => {
    if (!match) return
    getVoorspelling(match.id, HUIDIG_PROFIEL_ID).then(setResultaat)
  }, [match])

  if (!match) return null

  async function stem(keuze) {
    await stemVoorspelling(match.id, HUIDIG_PROFIEL_ID, keuze)
    const vers = await getVoorspelling(match.id, HUIDIG_PROFIEL_ID)
    setResultaat(vers)
    setWijzigen(false)
  }

  const toontKnoppen = resultaat === undefined || resultaat.eigenKeuze === null || wijzigen

  return (
    <div className="card fan-card">
      <div className="fan-card__intro">
        <span className="eyebrow">Voorspellen</span>
        <p>
          Wie wint er tussen <TeamBadge team={match.thuisTeam} size="sm" /> {match.thuisTeam.name}{' '}
          en <TeamBadge team={match.uitTeam} size="sm" /> {match.uitTeam.name}?
        </p>
      </div>

      {toontKnoppen && (
        <div className="vote-options">
          <button type="button" className="vote-button" onClick={() => stem('thuis')}>
            {match.thuisTeam.name} wint
          </button>
          <button type="button" className="vote-button" onClick={() => stem('gelijk')}>
            Gelijkspel
          </button>
          <button type="button" className="vote-button" onClick={() => stem('uit')}>
            {match.uitTeam.name} wint
          </button>
        </div>
      )}

      {!toontKnoppen && resultaat && (
        <>
          <div className="stembalk-lijst">
            <StemBalk
              label={`${match.thuisTeam.name} wint`}
              percentage={resultaat.percentages.thuis}
              actief={resultaat.eigenKeuze === 'thuis'}
            />
            <StemBalk
              label="Gelijkspel"
              percentage={resultaat.percentages.gelijk}
              actief={resultaat.eigenKeuze === 'gelijk'}
            />
            <StemBalk
              label={`${match.uitTeam.name} wint`}
              percentage={resultaat.percentages.uit}
              actief={resultaat.eigenKeuze === 'uit'}
            />
          </div>
          <button type="button" className="fan-card__wijzig" onClick={() => setWijzigen(true)}>
            Wijzig je voorspelling
          </button>
        </>
      )}
    </div>
  )
}
