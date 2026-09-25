import TeamBadge from './TeamBadge'
import { datumTekst, isGespeeld, tijdTekst } from '../wedstrijdTekst'

// Wedstrijdkaart: thuisploeg links, uitploeg rechts. In het midden de datum
// met daaronder de aftraptijd — of de uitslag, als er al gespeeld is — en
// onderaan het competitielogo. Geen logo in de bron (bv. Supercup): die plek
// blijft leeg, maar houdt zijn hoogte zodat alle kaarten gelijk uitlijnen.
export default function WedstrijdKaart({ match }) {
  const gespeeld = isGespeeld(match)

  return (
    <article className={`wedstrijd-kaart${gespeeld ? ' wedstrijd-kaart--gespeeld' : ''}`}>
      <div className="wedstrijd-kaart__club">
        <TeamBadge team={match.thuisTeam} />
        <span className="wedstrijd-kaart__naam">{match.thuisTeam.name}</span>
      </div>

      <div className="wedstrijd-kaart__midden">
        <span className="wedstrijd-kaart__datum">{datumTekst(match)}</span>
        {gespeeld ? (
          <span className="wedstrijd-kaart__uitslag" aria-label={`Uitslag ${match.thuisScore}-${match.uitScore}`}>
            {match.thuisScore}
            <span aria-hidden="true">–</span>
            {match.uitScore}
          </span>
        ) : (
          <span className={`wedstrijd-kaart__tijd${match.aftrapBekend ? '' : ' is-onbekend'}`}>
            {tijdTekst(match)}
          </span>
        )}
        <span className="wedstrijd-kaart__competitie">
          {match.competitieLogo ? (
            <img src={match.competitieLogo} alt={match.competition} title={match.competition} />
          ) : (
            <span className="visueel-verborgen">{match.competition}</span>
          )}
        </span>
      </div>

      <div className="wedstrijd-kaart__club">
        <TeamBadge team={match.uitTeam} />
        <span className="wedstrijd-kaart__naam">{match.uitTeam.name}</span>
      </div>
    </article>
  )
}
