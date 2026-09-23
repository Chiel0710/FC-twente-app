import { Image } from 'lucide-react'
import { StickerKaart } from '../StickerPlak'
import { datumKort, tegenstanderTeamVan } from '../plakboekUtil'
import { CASTORE_COLLECTIE_URL, stuurShopKlik } from '../api'
import { HUIDIG_PROFIEL_ID } from '../profiel'
import TeamBadge from './TeamBadge'

// Geen posterproduct bij Castore — we meten de interesse onder een eigen
// productId (per wedstrijd) en linken naar de algemene collectie.
function naarPoster(match, tegenstander) {
  stuurShopKlik(
    HUIDIG_PROFIEL_ID,
    `plakboek-poster-${match.id}`,
    `Poster — FC Twente vs ${tegenstander.name}`,
    'plakboek',
  )
  window.open(CASTORE_COLLECTIE_URL, '_blank', 'noopener,noreferrer')
}

// Eén vakje in het plakboek-raster. Drie toestanden:
// - "geplakt": toont de echte StickerKaart (uit StickerPlak.jsx) — de id
//   staat op deze buitenste wrapper, zodat useStickerPlak 'm kan vinden
//   (vindSlot) en er de stempel-animatie op kan zetten.
// - "claimbaar": klikbaar, zelfde actie als de knop in ClaimBalk.
// - "leeg": niet klikbaar. Toont, puur als oriëntatie, welke wedstrijd dit
//   vakje voorstelt (teambadge + korte datum) — geen verzonnen data, dit
//   komt uit dezelfde wedstrijddata die we toch al ophalen voor het raster.
export default function StickerSlot({ match, toestand, sticker, eigenBeeld, onClaimKlik }) {
  const id = `s-${match.id}`

  const tegenstander = tegenstanderTeamVan(match)

  if (toestand === 'geplakt') {
    return (
      <div id={id} className="sticker-geplakt">
        {eigenBeeld ? (
          <img className="eigen-sticker" src={eigenBeeld} alt={`Sticker ${tegenstander.name}`} />
        ) : (
          <StickerKaart sticker={sticker} />
        )}
        <button
          type="button"
          className="sticker-poster-knop"
          onClick={() => naarPoster(match, tegenstander)}
          aria-label="Maak er een poster van"
          title="Maak er een poster van"
        >
          <Image strokeWidth={2} size={14} />
        </button>
      </div>
    )
  }

  if (toestand === 'claimbaar') {
    return (
      <button type="button" id={id} className="slot claimbaar" onClick={onClaimKlik}>
        <TeamBadge team={tegenstander} size="sm" />
        <span className="slot__datum">{datumKort(match.kickoff)}</span>
        <span className="slot__hint">Claim!</span>
      </button>
    )
  }

  return (
    <div id={id} className="slot leeg">
      <TeamBadge team={tegenstander} size="sm" />
      <span className="slot__datum">{datumKort(match.kickoff)}</span>
    </div>
  )
}
