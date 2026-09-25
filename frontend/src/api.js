// "Backend in de browser". Vroeger haalde de app alles op bij de Express-
// backend met SQLite; live (Vercel) is er geen database. Daarom:
//  - alles wat alleen gelezen wordt (wedstrijden, standen, selecties,
//    fanshop) komt rechtstreeks uit de JSON-bestanden (zie sportData.js)
//  - alles wat een fan opslaat (stemmen, voorspelling, poll, quiz, stickers,
//    teamkeuze, fanshop-kliks) gaat via lib/demoDb.js (startwaarden uit
//    data/demo-database.json + wijzigingen in localStorage)
// De functienamen en de vorm van de antwoorden zijn gelijk gebleven, zodat
// de pagina's niets hoeven te weten. Alles geeft nog steeds een Promise terug.
// Alleen Rossie praat nog met een server: /api/rossie (serverless function).
import QRCode from 'qrcode'
import { WEDSTRIJDEN, spelersVan, standVan, wedstrijdMetId, wedstrijdenVan } from './sportData'
import * as db from './lib/demoDb'
import { motmStats, pollStats, voorspelStats } from './lib/demoStats'
import fanshopSnapshot from './data/sport/fanshop-snapshot.json'
import personas from './data/personas.json'
import voorbeeld from './data/voorbeeld-seizoenskaart.json'

const klaar = (waarde) => Promise.resolve(waarde)

// Pitch opnieuw (herladen in pitchmodus): wat je als fan deed weer leeg
export function wisDemoStemmen() {
  db.resetFan()
}

/* ---------- Sportdata (alleen lezen) ---------- */

// team: 'mannen' (standaard) of 'vrouwen' — geldt voor wedstrijden, uitslagen en stand
export function getMatches(status, team = 'mannen') {
  return klaar(wedstrijdenVan(team, status))
}

// Gespeelde wedstrijden, nieuwste eerst
export function getResults(team = 'mannen') {
  return klaar(wedstrijdenVan(team, 'gespeeld').reverse())
}

export function getStandings(team = 'mannen') {
  return klaar(standVan(team))
}

// team: 'mannen' (standaard, zoals bij Man of the Match) of 'vrouwen'
export function getPlayers(team = 'mannen') {
  return klaar(spelersVan(team))
}

// Het nieuws staat in public/nieuws/nieuws.json (zie NieuwsPagina)
export function getNews() {
  return klaar([])
}

/* ---------- Profielen en teamkeuze ---------- */

export function getProfiles() {
  const team = db.leesTeamKeuze()
  return klaar(personas.map((p) => ({ id: `demo-${p.id}`, naam: p.naam, fantype: p.fantype, teamKeuze: team })))
}

export function setTeamKeuze(profileId, teamKeuze) {
  db.zetTeamKeuze(teamKeuze)
  return klaar({ id: profileId, teamKeuze })
}

/* ---------- Stemmen: startwaarden + wat er in de app gestemd wordt ---------- */

// Voorspellen: exacte uitslag (zie VoorspelKaart)
export function getVoorspelling(matchId, profileId) {
  return klaar({ ...voorspelStats(matchId), eigenKeuze: db.leesFan(profileId, 'voorspelling')[matchId] ?? null })
}

export function stemVoorspelling(matchId, profileId, uitslag) {
  db.bewaarVoorspelling(profileId, matchId, uitslag)
  return klaar({ matchId, profileId, uitslag })
}

// Man of the Match
export function getMotm(matchId, profileId) {
  const { totaal, rijen } = motmStats(matchId)
  return klaar({
    totaal,
    resultaten: rijen.map((r) => ({ player: r.speler, aantal: r.aantal, percentage: Math.round(r.procent) })),
    eigenKeuze: db.leesFan(profileId, 'motm')[matchId] ?? null,
  })
}

export function stemMotm(matchId, profileId, playerId) {
  db.stem(profileId, matchId, playerId)
  return klaar({ matchId, profileId, playerId })
}

// Polls van de week (twee, uit de startwaarden)
export function getActievePolls(profileId) {
  const eigen = db.leesFan(profileId, 'poll')
  return klaar(
    pollStats().map((p) => ({
      id: p.id,
      question: p.vraag,
      opties: p.opties,
      totaal: p.totaal,
      tellingPerOptie: p.telling,
      percentages: p.procent.map(Math.round),
      eigenKeuze: eigen[p.id] ?? null,
    })),
  )
}

export function stemPoll(pollId, profileId, optionIndex) {
  db.bewaarPoll(profileId, pollId, optionIndex)
  return klaar({ pollId, profileId, optionIndex })
}

/* ---------- Digitaal plakboek ---------- */

// Sticker met zijn wedstrijd (thuisTeam/uitTeam), zoals de backend hem gaf
const metWedstrijd = (s) => ({ ...s, match: wedstrijdMetId(s.matchId) })

// Inchecken maakt een ongeclaimde sticker (idempotent per profiel en wedstrijd)
export function simuleerCheckIn(profileId, matchId, type = 'attended') {
  return klaar({ checkIn: { profileId, matchId }, stickerCard: metWedstrijd(db.checkIn(profileId, matchId, type)) })
}

const opAftrap = (a, b) => (a.match?.kickoff ?? '').localeCompare(b.match?.kickoff ?? '')

export function getStickers(profileId) {
  return klaar(db.leesStickers().filter((s) => s.profileId === profileId).map(metWedstrijd).filter((s) => s.match).sort(opAftrap))
}

export function getClaimbareStickers(profileId) {
  return getStickers(profileId).then((lijst) => lijst.filter((s) => s.claimedAt === null))
}

// Claimen: tijd en volgnummer (na de startwaarden van die wedstrijd)
export function claimSticker(stickerId) {
  const sticker = db.claimSticker(stickerId)
  return sticker ? klaar(metWedstrijd(sticker)) : Promise.reject(new Error('Sticker niet gevonden'))
}

/* ---------- Tickets: QR in de browser, met tijdstempel ---------- */

// Seizoenskaart van een profiel: eigen kaart van de persona, of de voorbeeldkaart
function seizoenskaartVan(profileId) {
  if (profileId === voorbeeld.profielId) return { naam: voorbeeld.naam, ...voorbeeld.seizoenskaart }
  const persona = personas.find((p) => `demo-${p.id}` === profileId)
  return persona?.seizoenskaart ? { naam: persona.naam, ...persona.seizoenskaart } : null
}

// transparant: QR zonder witte achtergrond (voor op een gekleurd vlak)
async function qrVan(tekst, transparant) {
  const opties = { margin: 1, width: 320 }
  if (transparant) opties.color = { dark: '#000000ff', light: '#00000000' }
  return QRCode.toDataURL(tekst, opties)
}

export async function getSeizoenskaartQr(profileId, { transparant = false } = {}) {
  const kaart = seizoenskaartVan(profileId)
  if (!kaart) throw new Error('Geen seizoenskaart gevonden voor dit profiel')
  const nu = Date.now()
  const kaartnummer = `FCT-DEMO-SEASON-${kaart.vak}-${kaart.rij}-${kaart.stoel}`
  return {
    qr: await qrVan(`FCT|${kaartnummer}|${nu}`, transparant),
    kaartnummer,
    naam: kaart.naam,
    vak: kaart.vak,
    rij: kaart.rij,
    stoel: kaart.stoel,
    geldigTot: '2027-06-30T00:00:00.000Z',
    verlooptOm: new Date(nu + 60_000).toISOString(),
  }
}

// Kaartje voor één wedstrijd, op de stoel van de seizoenskaart van dit profiel
export async function getWedstrijdTicketQr(matchId, profileId) {
  const kaart = seizoenskaartVan(profileId)
  if (!wedstrijdMetId(matchId) || !kaart) throw new Error('Geen kaart gevonden')
  const nu = Date.now()
  const kaartnummer = `FCT-DEMO-SEASON-${kaart.vak}-${kaart.rij}-${kaart.stoel}-${matchId.replace(/\D/g, '').slice(-6)}`
  return {
    qr: await qrVan(`FCT|${kaartnummer}|${nu}`, false),
    kaartnummer,
    naam: kaart.naam,
    vak: kaart.vak,
    rij: kaart.rij,
    stoel: kaart.stoel,
    verlooptOm: new Date(nu + 60_000).toISOString(),
  }
}

/* ---------- Fanshop ---------- */

// De collectie uit de meegeleverde snapshot (Castore mag de browser niet
// rechtstreeks aanroepen; de snapshot werkt altijd, ook tijdens de pitch)
export function getFanshop() {
  return klaar({
    producten: fanshopSnapshot.producten,
    bron: 'snapshot',
    bijgewerkt: fanshopSnapshot.opgehaald,
    collectieUrl: 'https://castore.com/nl-nl/collections/fc-twente',
  })
}

// Doorklikmeting (fanshop, MOTM, plakboek), bewaard op dit apparaat
export function stuurShopKlik(profileId, productId, naam, bron) {
  db.klikNaarShop(profileId, productId, naam, bron)
  return klaar({ ok: true })
}

// Voor de adminkant: doorklikken per bron en de top 10 producten
export function getShopStats() {
  const kliks = db.wijzigingen().shopKliks.map((k) => ({ ...k, profileId: k.profielId }))
  const tel = (sleutel) => {
    const m = new Map()
    for (const k of kliks) m.set(k[sleutel], (m.get(k[sleutel]) ?? 0) + 1)
    return [...m].map(([waarde, n]) => ({ [sleutel]: waarde, _count: { _all: n } }))
  }
  return klaar({
    perBron: tel('bron'),
    perProduct: tel('naam').sort((a, b) => b._count._all - a._count._all).slice(0, 10),
  })
}

// Geen shirt-per-speler of poster-product bij Castore — deze knoppen linken
// daarom naar de algemene collectiepagina, de meting is wat hier telt.
export const CASTORE_COLLECTIE_URL = 'https://castore.com/nl-nl/collections/fc-twente'

// (Alle wedstrijden, bv. voor tests)
export const ALLE_WEDSTRIJDEN = WEDSTRIJDEN
