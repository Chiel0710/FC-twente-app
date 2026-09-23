// Kleine fetch-helpers naar onze eigen backend. Relatieve paden (/api/...) —
// lokaal lost de Vite-proxy dit op naar http://localhost:4000, in fase 2
// draait dit gewoon op hetzelfde domein.

async function getJson(pad) {
  const res = await fetch(pad)
  if (!res.ok) {
    throw new Error(`Fout bij ophalen van ${pad}: ${res.status}`)
  }
  return res.json()
}

async function postJson(pad, body) {
  const res = await fetch(pad, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    throw new Error(`Fout bij versturen naar ${pad}: ${res.status}`)
  }
  return res.json()
}

export function getMatches(status) {
  const query = status ? `?status=${status}` : ''
  return getJson(`/api/matches${query}`)
}

export function getResults() {
  return getJson('/api/results')
}

export function getStandings() {
  return getJson('/api/standings')
}

export function getPlayers() {
  return getJson('/api/players')
}

export function getNews() {
  return getJson('/api/news')
}

// Fan-interactie: voorspellen
export function getVoorspelling(matchId, profileId) {
  return getJson(`/api/predictions/${matchId}?profileId=${profileId}`)
}

export function stemVoorspelling(matchId, profileId, keuze) {
  return postJson('/api/predictions', { matchId, profileId, keuze })
}

// Fan-interactie: Man of the Match
export function getMotm(matchId, profileId) {
  return getJson(`/api/motm/${matchId}?profileId=${profileId}`)
}

export function stemMotm(matchId, profileId, playerId) {
  return postJson('/api/motm', { matchId, profileId, playerId })
}

// Fan-interactie: poll van de week
export function getActievePolls(profileId) {
  return getJson(`/api/polls?profileId=${profileId}`)
}

export function stemPoll(pollId, profileId, optionIndex) {
  return postJson(`/api/polls/${pollId}/vote`, { profileId, optionIndex })
}

// Fan-interactie: weekquiz (logt alleen het gedrag, geen score/ranglijst)
export function stuurQuizAntwoord(profileId, vraagId, gekozenIndex, correct) {
  return postJson('/api/quiz/answer', { profileId, vraagId, gekozenIndex, correct })
}

// Digitaal plakboek
export function simuleerCheckIn(profileId, matchId, type) {
  return postJson('/api/checkins', { profileId, matchId, type })
}

export function getStickers(profileId) {
  return getJson(`/api/stickers/${profileId}`)
}

export function getClaimbareStickers(profileId) {
  return getJson(`/api/stickers/${profileId}/claimbaar`)
}

export function claimSticker(stickerId) {
  return postJson(`/api/stickers/${stickerId}/claim`, {})
}

// Seizoenskaart — echte toegangs-QR, telkens opnieuw gegenereerd door de server
export function getSeizoenskaartQr(profileId) {
  return getJson(`/api/tickets/seizoenskaart/${profileId}/qr`)
}

// Profielen — voor de demo-profielwissel in "Jij" (Meer-tab)
export function getProfiles() {
  return getJson('/api/profiles')
}

// Fanshop — doorklikmeting vanaf plekken buiten de fanshop zelf (MOTM, plakboek)
export function stuurShopKlik(profileId, productId, naam, bron) {
  return postJson('/api/fanshop/klik', { profileId, productId, naam, bron })
}

// Geen shirt-per-speler of poster-product bij Castore — deze knoppen linken
// daarom naar de algemene collectiepagina, de meting is wat hier telt.
export const CASTORE_COLLECTIE_URL = 'https://castore.com/nl-nl/collections/fc-twente'
