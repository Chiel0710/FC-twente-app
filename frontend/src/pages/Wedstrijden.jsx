import { useEffect, useState } from 'react'
import { getMatches, getResults, getStandings } from '../api'
import TeamBadge from '../components/TeamBadge'
import TeamSchakelaar from '../components/TeamSchakelaar'
import WedstrijdKaart from '../components/WedstrijdKaart'
import { useTeamKeuze } from '../teamKeuze'

// Naam van de competitie boven de stand, per team
const STAND_COMPETITIE = { mannen: 'Eredivisie', vrouwen: 'Vrouwen Eredivisie' }

export default function Wedstrijden() {
  const { team } = useTeamKeuze()
  // Per team bewaren: terugschakelen is dan meteen klaar
  const [perTeam, setPerTeam] = useState({})
  const [fout, setFout] = useState(null)
  const data = perTeam[team]

  useEffect(() => {
    if (perTeam[team]) return
    let actief = true

    Promise.all([getMatches('gepland', team), getResults(team), getStandings(team)])
      .then(([programma, uitslagen, stand]) => {
        if (!actief) return
        setPerTeam((oud) => ({ ...oud, [team]: { programma, uitslagen, stand } }))
      })
      .catch((err) => {
        if (!actief) return
        setFout(err.message)
      })

    return () => {
      actief = false
    }
  }, [team, perTeam])

  if (fout) {
    return (
      <div className="card">
        <p>Kan de gegevens nu niet ophalen. Controleer of de backend draait.</p>
      </div>
    )
  }

  return (
    <>
      <TeamSchakelaar />

      <section>
        <div className="section-heading">
          <span className="eyebrow">Terugblik</span>
          <h2>Uitslagen</h2>
        </div>

        {!data && <div className="card">Uitslagen laden...</div>}
        {data && data.uitslagen.length === 0 && (
          <div className="card">
            <p>Er is nog geen wedstrijd gespeeld.</p>
          </div>
        )}
        {data && data.uitslagen.length > 0 && (
          <div className="wedstrijd-lijst">
            {data.uitslagen.map((m) => (
              <WedstrijdKaart match={m} key={m.id} />
            ))}
          </div>
        )}
      </section>

      <section>
        <div className="section-heading">
          <span className="eyebrow">Nog te spelen</span>
          <h2>Programma</h2>
        </div>

        {!data && <div className="card">Programma laden...</div>}
        {data && data.programma.length === 0 && (
          <div className="card">
            <p>Geen verdere wedstrijden gepland.</p>
          </div>
        )}
        {data && data.programma.length > 0 && (
          <div className="wedstrijd-lijst">
            {data.programma.map((m) => (
              <WedstrijdKaart match={m} key={m.id} />
            ))}
          </div>
        )}
      </section>

      <section>
        <div className="section-heading">
          <span className="eyebrow">{STAND_COMPETITIE[team]}</span>
          <h2>Stand</h2>
        </div>

        {!data && <div className="card">Stand laden...</div>}

        {data && data.stand.length > 0 && (
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
                  {data.stand.map((club) => (
                    <tr
                      key={club.id}
                      className={[club.isTwente ? 'is-twente' : '', club.zone ? 'is-zone' : '']
                        .filter(Boolean)
                        .join(' ')}
                    >
                      <td>{club.position}</td>
                      <td>
                        <span className="standings-table__team">
                          <TeamBadge team={club} size="sm" />
                          {club.name}
                          {club.zone && <span className="standings-table__zone-dot" />}
                        </span>
                      </td>
                      <td className="num">{club.played}</td>
                      <td className="num">{club.goalDifference}</td>
                      <td className="num punten">{club.points}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Alleen tonen als er echt zones in de stand staan (bij de vrouwen niet) */}
            {data.stand.some((club) => club.zone) && (
              <p className="result-card__meta">
                Rood stipje = degradatie of play-offs promotie/degradatie.
              </p>
            )}
          </div>
        )}
      </section>
    </>
  )
}
