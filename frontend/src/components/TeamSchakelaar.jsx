import { TEAM_LABEL, useTeamKeuze } from '../teamKeuze'

// Schakelaar Mannen / Vrouwen — dezelfde op Wedstrijden en Selectie.
// De keuze geldt voor de hele app en wordt in het profiel onthouden.
export default function TeamSchakelaar() {
  const { team, kiesTeam } = useTeamKeuze()

  return (
    <div className="team-schakelaar" role="group" aria-label="Kies een team">
      {Object.entries(TEAM_LABEL).map(([id, label]) => (
        <button
          key={id}
          type="button"
          className="team-schakelaar__knop"
          aria-pressed={team === id}
          onClick={() => kiesTeam(id)}
        >
          {label}
        </button>
      ))}
    </div>
  )
}
