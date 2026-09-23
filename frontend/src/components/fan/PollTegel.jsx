import { useEffect, useState } from 'react'
import { getActievePolls } from '../../api'
import { HUIDIG_PROFIEL_ID } from '../../profiel'
import PollKaart from '../PollKaart'

// Haalt zelf de actieve poll(s) op en houdt de optimistische update na het
// stemmen bij — exact overgenomen uit het oude Fan.jsx. PollKaart zelf
// blijft ongewijzigd.
export default function PollTegel() {
  const [polls, setPolls] = useState(undefined)

  useEffect(() => {
    let actief = true
    getActievePolls(HUIDIG_PROFIEL_ID).then((pollsData) => {
      if (actief) setPolls(pollsData)
    })
    return () => {
      actief = false
    }
  }, [])

  function bijgewerktePoll(pollId, stem) {
    setPolls((huidig) =>
      huidig.map((p) => {
        if (p.id !== pollId) return p
        const nieuweTelling = p.opties.map((_, i) => {
          if (i === stem.optionIndex) {
            return p.eigenKeuze === i ? p.tellingPerOptie[i] : p.tellingPerOptie[i] + 1
          }
          if (i === p.eigenKeuze) {
            return Math.max(0, p.tellingPerOptie[i] - 1)
          }
          return p.tellingPerOptie[i]
        })
        const totaal = nieuweTelling.reduce((a, b) => a + b, 0)
        const percentages = nieuweTelling.map((a) => (totaal ? Math.round((a / totaal) * 100) : 0))
        return { ...p, tellingPerOptie: nieuweTelling, totaal, percentages, eigenKeuze: stem.optionIndex }
      }),
    )
  }

  if (polls === undefined) return <div className="card">Laden...</div>
  return (
    <>
      {polls.map((poll) => (
        <PollKaart key={poll.id} poll={poll} onGestemd={bijgewerktePoll} />
      ))}
    </>
  )
}
