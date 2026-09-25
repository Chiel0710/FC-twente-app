import { claimStickerVoor } from './eigenStickers'
// Helpers om wedstrijd/sticker-data (zoals de backend 'm rauw teruggeeft) om
// te zetten naar het sticker-object dat StickerPlak.jsx verwacht:
// { id, matchId, tegenstander, logoSlug, thuis, datum, uitslag, volgnummer, europees }

const datumKortFormat = new Intl.DateTimeFormat('nl-NL', {
  weekday: 'short',
  day: 'numeric',
  month: 'short',
})

export function datumKort(kickoff) {
  return datumKortFormat.format(new Date(kickoff))
}

// logoUrl is altijd "/logos/<slug>.png" (zo geseed) — slug eruit halen.
export function logoSlugVan(team) {
  return team.logoUrl.replace('/logos/', '').replace('.png', '')
}

export function tegenstanderTeamVan(match) {
  return match.thuisTeam.isTwente ? match.uitTeam : match.thuisTeam
}

export function bouwStickerObject(stickerCard) {
  const { match } = stickerCard
  const tegenstander = tegenstanderTeamVan(match)

  return {
    id: stickerCard.id,
    matchId: match.id,
    tegenstander: tegenstander.name,
    logoSlug: logoSlugVan(tegenstander),
    thuis: match.thuisTeam.isTwente,
    datum: datumKort(match.kickoff),
    uitslag:
      match.thuisScore !== null && match.uitScore !== null
        ? `${match.thuisScore}-${match.uitScore}`
        : null,
    volgnummer: stickerCard.serialNumber || null,
    // Alleen echt Europese duels; niet elke competitie die geen "Eredivisie" heet
    // (Vrouwen Eredivisie en de Supercup zijn niet Europees)
    europees: match.competition === 'Conference League',
    // eigen ontwerp voor deze sticker (bv. Twente – PSV), anders null
    beeld: claimStickerVoor(match.kickoff),
  }
}

// Leesbare sleutel van een sticker in links, bv. "2026-09-20-twente-psv".
// Een sticker in de database heeft per profiel een eigen id; deze sleutel is
// voor iedereen gelijk en wijst via datum en clubs de wedstrijd aan.
const kortNaam = (naam) =>
  naam
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '') // accenten weg: é -> e
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^(fc|sc)-|-$/g, '')

export function stickerSleutel(match) {
  const d = new Date(match.kickoff)
  const datum = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  return `${datum}-${kortNaam(match.thuisTeam.name)}-${kortNaam(match.uitTeam.name)}`
}
