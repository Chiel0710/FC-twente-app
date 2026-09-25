// demoDb — de "database" van de demo, helemaal in de browser (werkt dus ook
// op Vercel, zonder server).
//
//  - data/demo-database.json = de startwaarden: verzonnen gebruikers en
//    cijfers, echte wedstrijden en uitslagen. Die veranderen nooit.
//  - Alles wat een fan of de admin doet, staat als WIJZIGINGEN in één
//    localStorage-sleutel ("fctwente_demodb"), bovenop die startwaarden.
//  - Alle schermen lezen en schrijven via deze module (direct, of via de
//    dunne lagen api.js, profiel.js en demoKlok.js die hierop zijn gebouwd).
//  - Wijzigingen zijn meteen overal zichtbaar: in dit tabblad via de
//    luisteraars, in andere tabbladen of een iframe via het storage-event.
//
// Twee soorten reset:
//  - resetFan(): wat je als fan deed (stemmen, quiz, poll, voorspelling,
//    sticker, Ben je erbij, aangeboden kaart, dealcodes, inbox). Gebeurt bij
//    het (her)starten van de pitch.
//  - reset(): alles terug naar de startwaarden, ook publicaties, bestellingen,
//    agents en Rossie-vragen (knop Reset in /admin/demo). Wie ingelogd is
//    (persona) en de teamkeuze blijven staan.
import { useSyncExternalStore } from 'react'
import startDb from '../data/demo-database.json'

export const START = startDb

const SLEUTEL = 'fctwente_demodb'
// Oude losse sleutels van vóór deze module: één keer opruimen
const OUDE_SLEUTELS = ['fctwente_opslag', 'fctwente_profielen', 'fctwente_demo', 'fctwente_meldingen']

/* ---------- De lege set wijzigingen ---------- */

function leegFan() {
  // per profiel: motm, poll, voorspelling, quiz, aanwezigheid, aangeboden, dealCodes
  return { profielen: {}, stickers: [], inbox: [] }
}

function leeg() {
  return {
    versie: 1,
    persona: null, // 'bezoeker' | 'daan' (null = bezoeker)
    teamKeuze: null, // 'mannen' | 'vrouwen'
    meldingInstellingen: null,
    fan: leegFan(),
    winkel: { bestellingen: [], aanvulling: {} }, // aanvulling: { productId: { maat: aantal } }
    shopKliks: [],
    rossie: [], // [{ profielId, vraag, tijd }]
    admin: {
      opstelling: {}, // { mannen: {formatie, rijen, tijd}, vrouwen: ... }
      nieuws: { gepubliceerd: {}, eigen: [] }, // gepubliceerd: { id: tijd }
      deals: { eigen: [], uit: [] },
      weetjes: { gepubliceerd: [], verborgen: [] },
      agents: { afgehandeld: [], nieuw: [] },
    },
    demo: { aftrapOp: null, dagernaOp: null },
  }
}

// Diep samenvoegen met de lege vorm, zodat oudere opslag nooit velden mist
function metStandaard(opslag) {
  const basis = leeg()
  const voeg = (doel, bron) => {
    for (const [k, v] of Object.entries(bron ?? {})) {
      if (v && typeof v === 'object' && !Array.isArray(v) && doel[k] && typeof doel[k] === 'object' && !Array.isArray(doel[k])) {
        voeg(doel[k], v)
      } else {
        doel[k] = v
      }
    }
  }
  voeg(basis, opslag)
  return basis
}

/* ---------- Lezen, schrijven, luisteren ---------- */

let cache = null
const luisteraars = new Set()

function laad() {
  try {
    OUDE_SLEUTELS.forEach((s) => localStorage.removeItem(s))
    return metStandaard(JSON.parse(localStorage.getItem(SLEUTEL)))
  } catch {
    return leeg()
  }
}

// De huidige wijzigingen (zelfde object tot er iets verandert)
export function wijzigingen() {
  cache ??= laad()
  return cache
}

// Startwaarden + wijzigingen
export function leesDb() {
  return { start: START, w: wijzigingen() }
}

function meld() {
  luisteraars.forEach((l) => l())
}

// Schrijven: altijd op een kopie, zodat React ziet dat er iets veranderd is
function schrijf(wijzig) {
  const kopie = structuredClone(wijzigingen())
  wijzig(kopie)
  cache = kopie
  try {
    localStorage.setItem(SLEUTEL, JSON.stringify(kopie))
  } catch {
    // vol of geblokkeerd: dan geldt het alleen tot herladen
  }
  meld()
  return kopie
}

export function abonneer(luisteraar) {
  luisteraars.add(luisteraar)
  return () => luisteraars.delete(luisteraar)
}

// Ander tabblad of iframe schreef iets: opnieuw inlezen en iedereen seinen
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key !== SLEUTEL && e.key !== null) return
    cache = null
    meld()
  })
}

// Hook: de wijzigingen, en opnieuw renderen zodra er iets verandert
export function useDemoDb() {
  return useSyncExternalStore(abonneer, wijzigingen)
}

const nu = () => new Date().toISOString()
const uid = (voorvoegsel) => `${voorvoegsel}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`

/* ---------- Persona, teamkeuze, meldingsinstellingen ---------- */

export const leesPersona = () => wijzigingen().persona
export function zetPersona(id) {
  schrijf((w) => {
    w.persona = id
  })
}

export const leesTeamKeuze = () => wijzigingen().teamKeuze
export function zetTeamKeuze(team) {
  schrijf((w) => {
    w.teamKeuze = team
  })
}

export const leesMeldingInstellingen = () => wijzigingen().meldingInstellingen
export function zetMeldingInstellingen(instellingen) {
  schrijf((w) => {
    w.meldingInstellingen = instellingen
  })
}

/* ---------- Fan: per profiel ---------- */

function profiel(w, profielId) {
  w.fan.profielen[profielId] ??= {}
  return w.fan.profielen[profielId]
}

// Eén veld van één profiel lezen, bv. leesFan('demo-daan', 'aanwezigheid')
export const leesFan = (profielId, veld) => wijzigingen().fan.profielen[profielId]?.[veld] ?? {}

function zetFan(profielId, veld, sleutel, waarde) {
  schrijf((w) => {
    const p = profiel(w, profielId)
    p[veld] = { ...p[veld] }
    if (waarde === null) delete p[veld][sleutel]
    else p[veld][sleutel] = waarde
  })
}

// Man of the Match: één stem per profiel per wedstrijd
export const stem = (profielId, matchId, spelerId) => zetFan(profielId, 'motm', matchId, spelerId)

// Quiz: de antwoorden (goed/fout per vraag) van een week
export const bewaarQuiz = (profielId, week, antwoorden) =>
  zetFan(profielId, 'quiz', String(week), { antwoorden, tijd: nu() })

export const bewaarPoll = (profielId, pollId, optie) => zetFan(profielId, 'poll', pollId, optie)

// Voorspelling: exacte uitslag, "thuis-uit", bv. "1-2"
export const bewaarVoorspelling = (profielId, matchId, uitslag) => zetFan(profielId, 'voorspelling', matchId, uitslag)

// Ben je erbij?: "ja" | "nee" | null
export const bewaarAanwezigheid = (profielId, matchId, waarde) => zetFan(profielId, 'aanwezigheid', matchId, waarde)

// Kaart aanbieden op de doorverkoopmarkt; de Ticket-agent meldt het
export function biedKaartAan(profielId, matchId, aan, omschrijving = '') {
  schrijf((w) => {
    const p = profiel(w, profielId)
    p.aangeboden = { ...p.aangeboden }
    if (aan) {
      p.aangeboden[matchId] = true
      w.admin.agents.nieuw.push({
        id: uid('agent'),
        agent: 'Ticket-agent',
        tijd: nu(),
        niveau: 'info',
        bericht: `Nieuwe kaart aangeboden op de doorverkoopmarkt${omschrijving ? `: ${omschrijving}` : ''}.`,
        actie: null,
      })
    } else {
      delete p.aangeboden[matchId]
    }
  })
}

// Dealcode: één keer gemaakt en bewaard (per profiel, per dag)
const CODE_TEKENS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // zonder O/0 en I/1
const vandaag = () => new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Amsterdam' })

export function maakDealCode(profielId, dealId) {
  const bewaard = leesFan(profielId, 'dealCodes')[dealId]
  if (bewaard?.datum === vandaag()) return bewaard.code
  const g = crypto.getRandomValues(new Uint32Array(8))
  const t = [...g].map((x) => CODE_TEKENS[x % CODE_TEKENS.length]).join('')
  const code = `FCT-${t.slice(0, 4)}-${t.slice(4)}`
  zetFan(profielId, 'dealCodes', dealId, { code, datum: vandaag() })
  return code
}

/* ---------- Stickers (plakboek) ---------- */

export const leesStickers = () => wijzigingen().fan.stickers

// Inchecken maakt een ongeclaimde sticker (idempotent per profiel en wedstrijd)
export function checkIn(profielId, matchId, type = 'attended') {
  let sticker = leesStickers().find((s) => s.profileId === profielId && s.matchId === matchId)
  if (sticker) return sticker
  sticker = { id: `sticker-${profielId}-${matchId}`, profileId: profielId, matchId, type, claimedAt: null, serialNumber: null }
  schrijf((w) => {
    w.fan.stickers.push(sticker)
  })
  return sticker
}

// Claimen: tijd + volgnummer (volgorde binnen de wedstrijd, na de startwaarden)
export function claimSticker(stickerId) {
  let resultaat = null
  schrijf((w) => {
    const s = w.fan.stickers.find((x) => x.id === stickerId)
    if (!s) return
    if (!s.claimedAt) {
      const datum = s.matchId.slice(-10)
      const start = Object.entries(START.stickers).find(([id]) => id.startsWith(datum))?.[1]?.geclaimd ?? 0
      const al = w.fan.stickers.filter((x) => x.matchId === s.matchId && x.claimedAt).length
      s.claimedAt = nu()
      s.serialNumber = start + al + 1
    }
    resultaat = { ...s }
  })
  return resultaat
}

/* ---------- Webshop ---------- */

// Bestelling: voorraad omlaag; onder de drempel een seintje van de Voorraad-agent
export function bestel(profielId, productId, maat, aantal) {
  schrijf((w) => {
    w.winkel.bestellingen.push({ id: uid('bestelling'), profielId, productId, maat, aantal, tijd: nu() })
    const product = START.webshop.producten.find((p) => p.id === productId)
    if (!product) return
    const over = voorraadVan(w, product)[maat]
    const openSeintje = w.admin.agents.nieuw.some(
      (a) => !w.admin.agents.afgehandeld.includes(a.id) && a.doel?.productId === productId && a.doel?.maat === maat,
    )
    if (over < product.drempel && !openSeintje) {
      w.admin.agents.nieuw.push({
        id: uid('agent'),
        agent: 'Voorraad-agent',
        tijd: nu(),
        niveau: 'waarschuwing',
        bericht: `${product.naam} maat ${maat} bijna op (${over} over, drempel ${product.drempel}).`,
        actie: 'Bijbestellen',
        doel: { productId, maat },
      })
    }
  })
}

// Voorraad per maat: startwaarde − bestellingen in de app + aanvullingen
export function voorraadVan(w, product) {
  const uit = {}
  for (const [maat, n] of Object.entries(product.voorraad)) {
    const besteld = w.winkel.bestellingen
      .filter((b) => b.productId === product.id && b.maat === maat)
      .reduce((a, b) => a + b.aantal, 0)
    uit[maat] = n - besteld + (w.winkel.aanvulling[product.id]?.[maat] ?? 0)
  }
  return uit
}

export function klikNaarShop(profielId, productId, naam, bron) {
  schrijf((w) => {
    w.shopKliks.push({ profielId, productId, naam, bron, tijd: nu() })
  })
}

/* ---------- Rossie ---------- */

export function logRossieVraag(profielId, vraag) {
  schrijf((w) => {
    w.rossie.push({ profielId, vraag: vraag.trim(), tijd: nu() })
  })
}

/* ---------- Inbox (meldingen van publicaties) ---------- */

function inboxMelding(w, titel, tekst, link, knop = 'Bekijk') {
  const v = { tekst, knop, route: link }
  w.fan.inbox.push({ id: uid('pub'), tijd: nu(), titel, link, varianten: { standaard: v, afstand: v } })
}

/* ---------- Admin: publiceren ---------- */

export function publiceerOpstelling(team, formatie, rijen) {
  schrijf((w) => {
    w.admin.opstelling[team] = { team, formatie, rijen, tijd: nu() }
    inboxMelding(
      w,
      'Nieuwe opstelling gepubliceerd',
      `De opstelling van ${team === 'vrouwen' ? 'FC Twente Vrouwen' : 'FC Twente'} (${formatie}) staat op Home.`,
      '/',
    )
  })
}

// bericht: een concept-id uit nieuws.json (string) of een nieuw bericht (object)
export function publiceerNieuws(bericht) {
  schrijf((w) => {
    let id = bericht
    let titel = null
    if (typeof bericht === 'object') {
      id = uid('nieuws')
      titel = bericht.titel
      w.admin.nieuws.eigen.push({ ...bericht, id, datum: vandaag(), eigen: true })
    }
    w.admin.nieuws.gepubliceerd[id] = nu()
    inboxMelding(w, 'Nieuw bericht', titel ?? 'Er staat een nieuw bericht klaar bij Nieuws.', `/nieuws/${id}`, 'Lees')
  })
}

export function publiceerDeal(deal) {
  schrijf((w) => {
    const id = uid('deal')
    w.admin.deals.eigen.push({ ...deal, id, tijd: nu() })
    inboxMelding(w, 'Nieuwe deal', deal.titel, '/aanbiedingen', 'Bekijk')
  })
}

export function zetDealAan(dealId, aan) {
  schrijf((w) => {
    w.admin.deals.uit = w.admin.deals.uit.filter((id) => id !== dealId)
    if (!aan) w.admin.deals.uit.push(dealId)
  })
}

export function publiceerWeetje(tekst) {
  schrijf((w) => {
    w.admin.weetjes.verborgen = w.admin.weetjes.verborgen.filter((t) => t !== tekst)
    if (!w.admin.weetjes.gepubliceerd.includes(tekst)) w.admin.weetjes.gepubliceerd.push(tekst)
  })
}

export function verbergWeetje(tekst) {
  schrijf((w) => {
    w.admin.weetjes.gepubliceerd = w.admin.weetjes.gepubliceerd.filter((t) => t !== tekst)
    if (!w.admin.weetjes.verborgen.includes(tekst)) w.admin.weetjes.verborgen.push(tekst)
  })
}

/* ---------- Admin: agents ---------- */

// Alle seintjes: de startwaarden (id "start-<n>") + de live seintjes
export function alleAgents(w = wijzigingen()) {
  const start = START.agents.map((a, i) => ({ ...a, id: `start-${i}`, doel: startDoel(a) }))
  return [...w.admin.agents.nieuw, ...start]
    .map((a) => ({ ...a, afgehandeld: w.admin.agents.afgehandeld.includes(a.id) }))
    .sort((a, b) => b.tijd.localeCompare(a.tijd))
}

// Voorraad-seintjes uit de startwaarden koppelen aan hun product en maat
function startDoel(a) {
  if (a.agent !== 'Voorraad-agent') return null
  const product = START.webshop.producten.find((p) => a.bericht.startsWith(p.naam))
  if (!product) return null
  const maat = a.bericht.match(/maat (\w+)/)?.[1] ?? Object.keys(product.voorraad)[0]
  return { productId: product.id, maat }
}

// Seintje afhandelen; bij de Voorraad-agent wordt de voorraad aangevuld
export function handelAgentAf(agentId) {
  const agent = alleAgents().find((a) => a.id === agentId)
  schrijf((w) => {
    if (!w.admin.agents.afgehandeld.includes(agentId)) w.admin.agents.afgehandeld.push(agentId)
    if (agent?.agent === 'Voorraad-agent' && agent.doel) {
      const { productId, maat } = agent.doel
      w.winkel.aanvulling[productId] = { ...w.winkel.aanvulling[productId] }
      w.winkel.aanvulling[productId][maat] = (w.winkel.aanvulling[productId][maat] ?? 0) + 50
    }
  })
}

/* ---------- Demo-klok (pitch) ---------- */

export const leesDemo = () => wijzigingen().demo
export function zetDemo(demo) {
  schrijf((w) => {
    w.demo = { ...w.demo, ...demo }
  })
}

/* ---------- Reset ---------- */

// Wat je als fan deed (bij het (her)starten van de pitch)
export function resetFan() {
  schrijf((w) => {
    w.fan = leegFan()
  })
}

// Alles terug naar de startwaarden (persona en teamkeuze blijven)
export function reset() {
  const { persona, teamKeuze, meldingInstellingen } = wijzigingen()
  schrijf((w) => {
    Object.assign(w, leeg(), { persona, teamKeuze, meldingInstellingen })
  })
}
