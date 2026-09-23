import { tegenstanderTeamVan, datumKort } from '../plakboekUtil'
import TeamBadge from './TeamBadge'

// Bovenaan het plakboek: alleen zichtbaar bij minstens één claimbare sticker.
// Toont de eerstvolgende (tegenstander, uitslag, datum) + de claimknop.
export default function ClaimBalk({ stickers, onClaim }) {
  if (stickers.length === 0) return null

  const [eerste, ...rest] = stickers
  const match = eerste.match
  const tegenstander = tegenstanderTeamVan(match)
  const uitslag =
    match.thuisScore !== null && match.uitScore !== null
      ? `${match.thuisScore}-${match.uitScore}`
      : null

  return (
    <div className="claim-balk">
      <TeamBadge team={tegenstander} />
      <div className="claim-balk__tekst">
        <span className="eyebrow">Nieuwe sticker</span>
        <p className="claim-balk__wedstrijd">
          {tegenstander.name} {uitslag ? `· ${uitslag}` : ''}
        </p>
        <span className="claim-balk__datum">
          {datumKort(match.kickoff)}
          {rest.length > 0 && ` · +${rest.length} meer`}
        </span>
      </div>
      <button type="button" className="claim-balk__knop" onClick={() => onClaim(eerste)}>
        Claim je sticker
      </button>
    </div>
  )
}
