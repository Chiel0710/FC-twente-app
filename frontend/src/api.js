// "Backend in de browser". Vroeger haalde de app alles op bij de Express-
// backend met SQLite; live (Vercel) is er geen database. Daarom:
//  - alles wat alleen gelezen wordt (wedstrijden, standen, selecties,
//    fanshop) komt rechtstreeks uit de JSON-bestanden (zie sportData.js)
//  - alles wat een fan opslaat (stemmen, voorspelling, poll, quiz, stickers,
//    teamkeuze, fanshop-kliks) staat in localStorage, per apparaat
// De functienamen en de vorm van de antwoorden zijn gelijk gebleven, zodat
// de pagina's niets hoeven te weten. Alles geeft nog steeds een Promise terug.
// Alleen Rossie praat nog met een server: /api/rossie (serverless function).
import QRCode from 'qrcode'
import { WEDSTRIJDEN, spelerMetId, spelersVan, standVan, wedstrijdMetId, wedstrijdenVan } from './sportData'
import demoStemmen from './data/demo-stemmen.json'
import fanshopSnapshot from './data/sport/fanshop-snapshot.json'
import personas from './data/personas.json'
import voorbeeld from './data/voorbeeld-seizoenskaart.json'

const klaar = (waarde) => Promise.resolve(waarde)

/* ---------- Opslag per apparaat ----------
   localStorage "fctwente_opslag" = {
     profielen: { "<profielId>": { motm: {matchId: playerId}, voorspelling: {matchId: keuze},
                                   poll: {pollId: index}, teamKeuze, quiz: [...] } },
     stickers: [{ id, profileId, matchId, type, seed, claimedAt, serialNumber }],
     shopKliks: [{ profileId, productId, naam, bron, tijd }]
   } */
const OPSLAG = 'fctwente_opslag'

function lees() {
  try {
    return JSON.parse(localStorage.getItem(OPSLAG)) ?? {}
  } catch {
    return {}
  }
}

function bewaar(data) {
  try {
    localStorage.setItem(OPSLAG, JSON.stringify(data))
  } catch {
    // vol of geblokkeerd: dan geldt het alleen voor deze sessie niet
  }
}

function profiel(data, profielId) {
  data.profielen ??= {}
  data.profielen[profielId] ??= {}
  return data.profielen[profielId]
}

// Pitch opnieuw (herladen in pitchmodus): stemmen, voorspellingen, poll,
// quiz en de stickers van de demowedstrijd weer leeg, zodat je opnieuw kunt kiezen
export function wisDemoStemmen(demoDatum) {
  const data = lees()
  for (const p of Object.values(data.profielen ?? {})) {
    delete p.motm
    delete p.voorspelling
    delete p.poll
    delete p.quiz
  }
  data.stickers = (data.stickers ?? []).filter((s) => !s.matchId.endsWith(demoDatum))
  bewaar(data)
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

// Profielen: de persona's, met hun teamkeuze van dit apparaat
export function getProfiles() {
  const data = lees()
  return klaar(
    personas.map((p) => ({
      id: `demo-${p.id}`,
      naam: p.naam,
      fantype: p.fantype,
      teamKeuze: data.profielen?.[`demo-${p.id}`]?.teamKeuze ?? null,
    })),
  )
}

export function setTeamKeuze(profileId, teamKeuze) {
  const data = lees()
  profiel(data, profileId).teamKeuze = teamKeuze
  bewaar(data)
  return klaar({ id: profileId, teamKeuze })
}

/* ---------- Stemmen: demo-startaantallen + de stem van dit apparaat ---------- */

const datumVanId = (matchId) => matchId.slice(-10)

// Fan-interactie: voorspellen
export function getVoorspelling(matchId, profileId) {
  const eigen = lees().profielen?.[profileId]?.voorspelling?.[matchId] ?? null
  const telling = { ...demoStemmen.voorspelling.standaard }
  if (eigen) telling[eigen] += 1
  const totaal = telling.thuis + telling.gelijk + telling.uit
  const percentages = Object.fromEntries(Object.entries(telling).map(([k, n]) => [k, Math.round((n / totaal) * 100)]))
  return klaar({ totaal, telling, percentages, eigenKeuze: eigen })
}

export function stemVoorspelling(matchId, profileId, keuze) {
  const data = lees()
  const p = profiel(data, profileId)
  p.voorspelling = { ...p.voorspelling, [matchId]: keuze }
  bewaar(data)
  return klaar({ matchId, profileId, keuze })
}

// Fan-interactie: Man of the Match
export function getMotm(matchId, profileId) {
  const basis = demoStemmen.motm[datumVanId(matchId)] ?? {}
  const eigen = lees().profielen?.[profileId]?.motm?.[matchId] ?? null
  const perSpeler = new Map(Object.entries(basis).map(([nr, aantal]) => [`mannen-${nr}`, aantal]))
  if (eigen) perSpeler.set(eigen, (perSpeler.get(eigen) ?? 0) + 1)
  const totaal = [...perSpeler.values()].reduce((a, b) => a + b, 0)
  const resultaten = [...perSpeler]
    .map(([id, aantal]) => ({ player: spelerMetId(id), aantal, percentage: totaal ? Math.round((aantal / totaal) * 100) : 0 }))
    .filter((r) => r.player)
    .sort((a, b) => b.aantal - a.aantal)
  return klaar({ totaal, resultaten, eigenKeuze: eigen })
}

export function stemMotm(matchId, profileId, playerId) {
  const data = lees()
  const p = profiel(data, profileId)
  p.motm = { ...p.motm, [matchId]: playerId }
  bewaar(data)
  return klaar({ matchId, profileId, playerId })
}

// Fan-interactie: poll van de week
export function getActievePolls(profileId) {
  const poll = demoStemmen.poll
  const eigen = lees().profielen?.[profileId]?.poll?.[poll.id] ?? null
  const tellingPerOptie = poll.basis.map((n, i) => n + (eigen === i ? 1 : 0))
  const totaal = tellingPerOptie.reduce((a, b) => a + b, 0)
  return klaar([
    {
      id: poll.id,
      question: poll.question,
      opties: poll.opties,
      totaal,
      tellingPerOptie,
      percentages: tellingPerOptie.map((n) => Math.round((n / totaal) * 100)),
      eigenKeuze: eigen,
    },
  ])
}

export function stemPoll(pollId, profileId, optionIndex) {
  const data = lees()
  const p = profiel(data, profileId)
  p.poll = { ...p.poll, [pollId]: optionIndex }
  bewaar(data)
  return klaar({ pollId, profileId, optionIndex })
}

// Fan-interactie: weekquiz (logt alleen het gedrag, geen score/ranglijst)
export function stuurQuizAntwoord(profileId, vraagId, gekozenIndex, correct) {
  const data = lees()
  const p = profiel(data, profileId)
  p.quiz = [...(p.quiz ?? []), { vraagId, gekozenIndex, correct: Boolean(correct), tijd: Date.now() }]
  bewaar(data)
  return klaar({ ok: true })
}

/* ---------- Digitaal plakboek ---------- */

// Sticker met zijn wedstrijd (thuisTeam/uitTeam), zoals de backend hem gaf
const metWedstrijd = (s) => ({ ...s, match: wedstrijdMetId(s.matchId) })

// Inchecken maakt een ongeclaimde sticker (idempotent per profiel en wedstrijd)
export function simuleerCheckIn(profileId, matchId, type = 'attended') {
  const data = lees()
  data.stickers ??= []
  let sticker = data.stickers.find((s) => s.profileId === profileId && s.matchId === matchId)
  if (!sticker) {
    sticker = {
      id: `sticker-${profileId}-${matchId}`,
      profileId,
      matchId,
      type,
      seed: Math.random().toString(16).slice(2, 14),
      claimedAt: null,
      serialNumber: null,
    }
    data.stickers.push(sticker)
    bewaar(data)
  }
  return klaar({ checkIn: { profileId, matchId }, stickerCard: metWedstrijd(sticker) })
}

const opAftrap = (a, b) => (a.match?.kickoff ?? '').localeCompare(b.match?.kickoff ?? '')

export function getStickers(profileId) {
  return klaar((lees().stickers ?? []).filter((s) => s.profileId === profileId).map(metWedstrijd).sort(opAftrap))
}

export function getClaimbareStickers(profileId) {
  return getStickers(profileId).then((lijst) => lijst.filter((s) => s.claimedAt === null))
}

// Claimen: claimedAt en een volgnummer (volgorde van claimen binnen de
// wedstrijd, op dit apparaat). Al geclaimd: gewoon teruggeven.
export function claimSticker(stickerId) {
  const data = lees()
  const sticker = (data.stickers ?? []).find((s) => s.id === stickerId)
  if (!sticker) return Promise.reject(new Error('Sticker niet gevonden'))
  if (!sticker.claimedAt) {
    const al = data.stickers.filter((s) => s.matchId === sticker.matchId && s.claimedAt).length
    sticker.claimedAt = new Date().toISOString()
    sticker.serialNumber = al + 1
    bewaar(data)
  }
  return klaar(metWedstrijd(sticker))
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
  const data = lees()
  data.shopKliks = [...(data.shopKliks ?? []), { profileId, productId, naam, bron, tijd: Date.now() }]
  bewaar(data)
  return klaar({ ok: true })
}

// Voor de adminkant: doorklikken per bron en de top 10 producten
export function getShopStats() {
  const kliks = lees().shopKliks ?? []
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
