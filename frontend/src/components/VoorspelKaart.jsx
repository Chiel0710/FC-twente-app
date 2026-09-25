import { useState } from 'react'
import { Minus, Plus } from 'lucide-react'
import { bewaarVoorspelling, leesFan, useDemoDb } from '../lib/demoDb'
import { voorspelStats } from '../lib/demoStats'
import { HUIDIG_PROFIEL_ID } from '../profiel'
import TeamBadge from './TeamBadge'
import StemBalk from './StemBalk'

// "Voorspellen" — geef zelf een uitslag door (thuis-uit). Daarna zie je de
// meest voorspelde uitslagen van iedereen, met die van jou erbij. Geen punten.
function Teller({ team, waarde, onZet }) {
  return (
    <div className="voorspel-teller">
      <span className="voorspel-teller__team">
        <TeamBadge team={team} size="sm" />
        {team.shortName ?? team.name}
      </span>
      <div className="voorspel-teller__knoppen">
        <button type="button" onClick={() => onZet(Math.max(0, waarde - 1))} aria-label={`Minder goals voor ${team.name}`} disabled={waarde === 0}>
          <Minus size={16} strokeWidth={2.6} />
        </button>
        <output aria-live="polite">{waarde}</output>
        <button type="button" onClick={() => onZet(Math.min(9, waarde + 1))} aria-label={`Meer goals voor ${team.name}`}>
          <Plus size={16} strokeWidth={2.6} />
        </button>
      </div>
    </div>
  )
}

export default function VoorspelKaart({ match }) {
  useDemoDb() // cijfers live bijwerken
  const eigen = match ? leesFan(HUIDIG_PROFIEL_ID, 'voorspelling')[match.id] ?? null : null
  const [thuis, setThuis] = useState(() => Number(eigen?.split('-')[0] ?? 1))
  const [uit, setUit] = useState(() => Number(eigen?.split('-')[1] ?? 1))
  const [wijzigen, setWijzigen] = useState(false)

  if (!match) return null

  const invullen = eigen === null || wijzigen
  const stats = voorspelStats(match.id)
  // Top 5, en jouw uitslag altijd zichtbaar (ook als die niet in de top staat)
  const top = stats.top.slice(0, 5)
  const jouwRij = stats.top.find((t) => t.uitslag === eigen)
  if (jouwRij && !top.includes(jouwRij)) top.push(jouwRij)

  function geefDoor() {
    bewaarVoorspelling(HUIDIG_PROFIEL_ID, match.id, `${thuis}-${uit}`)
    setWijzigen(false)
  }

  return (
    <div className="card fan-card">
      <div className="fan-card__intro">
        <span className="eyebrow">Voorspellen</span>
        <p>
          Hoe eindigt <TeamBadge team={match.thuisTeam} size="sm" /> {match.thuisTeam.name} –{' '}
          <TeamBadge team={match.uitTeam} size="sm" /> {match.uitTeam.name}?
        </p>
      </div>

      {invullen ? (
        <>
          <div className="voorspel-invoer">
            <Teller team={match.thuisTeam} waarde={thuis} onZet={setThuis} />
            <span className="voorspel-invoer__streep" aria-hidden="true">–</span>
            <Teller team={match.uitTeam} waarde={uit} onZet={setUit} />
          </div>
          <button type="button" className="vote-button voorspel-doorgeven" onClick={geefDoor}>
            Geef {thuis}-{uit} door
          </button>
        </>
      ) : (
        <>
          <p className="voorspel-aantal">
            Jij voorspelt <strong>{eigen}</strong> · {stats.voorspellers.toLocaleString('nl-NL')} voorspellers
          </p>
          <div className="stembalk-lijst">
            {top.map((t) => (
              <StemBalk key={t.uitslag} label={t.uitslag} percentage={t.procent} actief={t.uitslag === eigen} />
            ))}
          </div>
          <button type="button" className="fan-card__wijzig" onClick={() => setWijzigen(true)}>
            Wijzig je voorspelling
          </button>
        </>
      )}
    </div>
  )
}
