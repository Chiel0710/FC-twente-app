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
    europees: match.competition !== 'Eredivisie',
  }
}
