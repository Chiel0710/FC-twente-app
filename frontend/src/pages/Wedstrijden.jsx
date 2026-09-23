import { useEffect, useState } from 'react'
import { getMatches, getResults, getStandings } from '../api'
import TeamBadge from '../components/TeamBadge'

const datumFormat = new Intl.DateTimeFormat('nl-NL', {
  weekday: 'short',
  day: 'numeric',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
})

const datumKortFormat = new Intl.DateTimeFormat('nl-NL', {
  weekday: 'short',
  day: 'numeric',
  month: 'short',
})

export default function Wedstrijden() {
  const [laatsteUitslag, setLaatsteUitslag] = useState(undefined)
  const [programma, setProgramma] = useState([])
  const [stand, setStand] = useState([])
  const [fout, setFout] = useState(null)

  useEffect(() => {
    let actief = true

    Promise.all([getMatches('gepland'), getResults(), getStandings()])
      .then(([geplande, resultaten, teams]) => {
        if (!actief) return
        setProgramma(geplande)
        setLaatsteUitslag(resultaten[0] ?? null)
        setStand(teams)
      })
      .catch((err) => {
        if (!actief) return
        setFout(err.message)
      })

    return () => {
      actief = false
    }
  }, [])

  if (fout) {
    return (
      <div className="card">
        <p>Kan de gegevens nu niet ophalen. Controleer of de backend draait.</p>
      </div>
    )
  }

  return (
    <>
      <section>
        <div className="section-heading">
          <span className="eyebrow">Terugblik</span>
          <h2>Laatste uitslag</h2>
        </div>

        {laatsteUitslag === undefined && <div className="card">Uitslag laden...</div>}
        {laatsteUitslag === null && (
          <div className="card">
            <p>Er is nog geen wedstrijd gespeeld.</p>
          </div>
        )}

        {laatsteUitslag && (
          <div className="card">
            <div className="result-card__row">
              <div className="result-card__team">
                <TeamBadge team={laatsteUitslag.thuisTeam} />
                <span className="result-card__team-name">{laatsteUitslag.thuisTeam.name}</span>
              </div>
              <span className="result-card__score">
                {laatsteUitslag.thuisScore} - {laatsteUitslag.uitScore}
              </span>
              <div className="result-card__team">
                <TeamBadge team={laatsteUitslag.uitTeam} />
                <span className="result-card__team-name">{laatsteUitslag.uitTeam.name}</span>
              </div>
            </div>
            <p className="result-card__meta">
              {datumFormat.format(new Date(laatsteUitslag.kickoff))} · {laatsteUitslag.venue}
            </p>
          </div>
        )}
      </section>

      <section>
        <div className="section-heading">
          <span className="eyebrow">Nog te spelen</span>
          <h2>Programma</h2>
        </div>

        {programma.length === 0 && laatsteUitslag !== undefined && (
          <div className="card">
            <p>Geen verdere wedstrijden gepland.</p>
          </div>
        )}

        {programma.length > 0 && (
          <div className="card fixture-list">
            {programma.map((m) => (
              <div className="fixture-row" key={m.id}>
                <span className="fixture-row__datum">
                  {datumKortFormat.format(new Date(m.kickoff))}
                  {!m.aftrapBekend && <span className="fixture-row__nnb"> n.n.b.</span>}
                </span>
                <span className="fixture-row__team">
                  <TeamBadge team={m.thuisTeam} size="sm" />
                  <span>{m.thuisTeam.name}</span>
                </span>
                <span className="fixture-row__vs">–</span>
                <span className="fixture-row__team">
                  <TeamBadge team={m.uitTeam} size="sm" />
                  <span>{m.uitTeam.name}</span>
                </span>
                <span className="fixture-row__competitie">{m.competition}</span>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <div className="section-heading">
          <span className="eyebrow">Eredivisie</span>
          <h2>Stand</h2>
        </div>

        {stand.length === 0 && <div className="card">Stand laden...</div>}

        {stand.length > 0 && (
          <div className="card">
            <div className="table-scroll">
              <table className="standings-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Club</th>
                    <th className="num">Sp</th>
                    <th className="num">GD</th>
                    <th className="num">Pt</th>
                  </tr>
                </thead>
                <tbody>
                  {stand.map((team) => (
                    <tr
                      key={team.id}
                      className={[
                        team.isTwente ? 'is-twente' : '',
                        team.zone ? 'is-zone' : '',
                      ]
                        .filter(Boolean)
                        .join(' ')}
                    >
                      <td>{team.position}</td>
                      <td>
                        <span className="standings-table__team">
                          <TeamBadge team={team} size="sm" />
                          {team.name}
                          {team.zone && <span className="standings-table__zone-dot" />}
                        </span>
                      </td>
                      <td className="num">{team.played}</td>
                      <td className="num">{team.goalDifference}</td>
                      <td className="num punten">{team.points}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="result-card__meta">
              Rood stipje = degradatie of play-offs promotie/degradatie.
            </p>
          </div>
        )}
      </section>
    </>
  )
}
