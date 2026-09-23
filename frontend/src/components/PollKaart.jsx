import { useState } from 'react'
import { stemPoll } from '../api'
import { HUIDIG_PROFIEL_ID } from '../profiel'
import StemBalk from './StemBalk'

// "Poll van de week" — uitslag in percentages, geen ranglijst.
export default function PollKaart({ poll, onGestemd }) {
  const [wijzigen, setWijzigen] = useState(false)

  async function stem(optionIndex) {
    const stem = await stemPoll(poll.id, HUIDIG_PROFIEL_ID, optionIndex)
    onGestemd(poll.id, stem)
    setWijzigen(false)
  }

  const toontKnoppen = poll.eigenKeuze === null || wijzigen

  return (
    <div className="card fan-card">
      <div className="fan-card__intro">
        <span className="eyebrow">Poll van de week</span>
        <p>{poll.question}</p>
      </div>

      {toontKnoppen && (
        <div className="vote-options vote-options--verticaal">
          {poll.opties.map((optie, i) => (
            <button key={optie} type="button" className="vote-button" onClick={() => stem(i)}>
              {optie}
            </button>
          ))}
        </div>
      )}

      {!toontKnoppen && (
        <>
          <div className="stembalk-lijst">
            {poll.opties.map((optie, i) => (
              <StemBalk
                key={optie}
                label={optie}
                percentage={poll.percentages[i]}
                actief={poll.eigenKeuze === i}
              />
            ))}
          </div>
          <button type="button" className="fan-card__wijzig" onClick={() => setWijzigen(true)}>
            Wijzig je stem
          </button>
        </>
      )}
    </div>
  )
}
