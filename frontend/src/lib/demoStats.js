// Alle cijfers van de demo = startwaarden (demo-database.json) + wat er live
// in de app gebeurt (wijzigingen in demoDb). Gedeeld door de app (resultaten
// na stemmen, poll, voorspellen, quiz) en de admin (dashboard en data).
import { START, alleAgents, voorraadVan, wijzigingen } from './demoDb'
import { spelersVan } from '../sportData'
import { QUIZVRAGEN, QUIZ_WEEK } from '../quizData'

const pct = (deel, geheel) => (geheel ? Math.round((deel / geheel) * 1000) / 10 : 0)
const datumVan = (id) => id.match(/\d{4}-\d{2}-\d{2}/)?.[0] ?? id
const profielen = (w) => Object.values(w.fan.profielen)

/* ---------- Man of the Match ---------- */

// Stemmen per speler voor een wedstrijd (app-id, bv. "mannen-2026-09-20")
export function motmStats(matchId, w = wijzigingen()) {
  const spelers = spelersVan('mannen')
  const perId = new Map()
  let overig = 0
  const start = START.manOfTheMatch
  if (datumVan(start.wedstrijdId) === datumVan(matchId)) {
    for (const s of start.stemmen) {
      if (s.rugnummer == null) overig += s.stemmen
      else perId.set(`mannen-${s.rugnummer}`, s.stemmen)
    }
  }
  for (const p of profielen(w)) {
    const keuze = p.motm?.[matchId]
    if (keuze) perId.set(keuze, (perId.get(keuze) ?? 0) + 1)
  }
  const totaal = [...perId.values()].reduce((a, b) => a + b, 0) + overig
  const rijen = [...perId]
    .map(([id, aantal]) => {
      const speler = spelers.find((s) => s.id === id)
      return speler && { speler, aantal, procent: pct(aantal, totaal) }
    })
    .filter(Boolean)
    .sort((a, b) => b.aantal - a.aantal)
  return { totaal, rijen, overig }
}

/* ---------- Polls ---------- */

export function pollStats(w = wijzigingen()) {
  return START.polls.map((poll, i) => {
    const id = `poll-${i}`
    const telling = poll.stemmen.map((s) => s.aantal)
    for (const p of profielen(w)) {
      const keuze = p.poll?.[id]
      if (keuze != null) telling[keuze] += 1
    }
    const totaal = telling.reduce((a, b) => a + b, 0)
    return { id, vraag: poll.vraag, opties: poll.stemmen.map((s) => s.optie), telling, totaal, procent: telling.map((n) => pct(n, totaal)) }
  })
}

/* ---------- Voorspellen (exacte uitslag) ---------- */

export function voorspelStats(matchId, w = wijzigingen()) {
  const start = START.voorspellingen
  const perUitslag = new Map()
  let voorspellers = 0
  if (datumVan(start.wedstrijdId) === datumVan(matchId)) {
    for (const t of start.top) perUitslag.set(t.uitslag, t.aantal)
    voorspellers = start.voorspellers
  }
  for (const p of profielen(w)) {
    const u = p.voorspelling?.[matchId]
    if (u) {
      perUitslag.set(u, (perUitslag.get(u) ?? 0) + 1)
      voorspellers += 1
    }
  }
  const top = [...perUitslag]
    .map(([uitslag, aantal]) => ({ uitslag, aantal, procent: pct(aantal, voorspellers) }))
    .sort((a, b) => b.aantal - a.aantal)
  return { voorspellers, top }
}

/* ---------- Quiz ---------- */

export function quizStats(w = wijzigingen()) {
  const start = START.quiz
  const gespeeld = profielen(w)
    .map((p) => p.quiz?.[String(QUIZ_WEEK)])
    .filter(Boolean)
  const deelnemers = start.deelnemers + gespeeld.length
  const allesGoed = start.allesGoed + gespeeld.filter((q) => q.antwoorden.every(Boolean)).length
  const perVraag = QUIZVRAGEN.map((v, i) => {
    const startGoed = Math.round(((start.vragen[i]?.['goed%'] ?? 0) / 100) * start.deelnemers)
    const goed = startGoed + gespeeld.filter((q) => q.antwoorden[i]).length
    return { vraag: v.vraag, procent: pct(goed, deelnemers) }
  })
  return { deelnemers, allesGoed, procentAllesGoed: pct(allesGoed, deelnemers), perVraag }
}

/* ---------- Tickets ---------- */

export function ticketStats(w = wijzigingen()) {
  const t = START.tickets
  const aangeboden = profielen(w).reduce((a, p) => a + Object.keys(p.aangeboden ?? {}).length, 0)
  const aanwezig = profielen(w).flatMap((p) => Object.values(p.aanwezigheid ?? {}))
  const ja = t.benJeErbij.ja + aanwezig.filter((x) => x === 'ja').length
  const nee = t.benJeErbij.nee + aanwezig.filter((x) => x === 'nee').length
  return {
    losMannen: t.losseTicketsVerkochtViaApp.mannen,
    losVrouwen: t.losseTicketsVerkochtViaApp.vrouwen,
    aangeboden: t.doorverkoop.aangeboden + aangeboden,
    verkocht: t.doorverkoop.verkocht,
    binnenUur: t.doorverkoop.gemiddeldBinnenUur,
    benJeErbij: { wedstrijd: t.benJeErbij.wedstrijd, ja, nee, nogNiet: Math.max(0, t.benJeErbij.nogNiet - (ja + nee - t.benJeErbij.ja - t.benJeErbij.nee)) },
  }
}

/* ---------- Stickers ---------- */

export function stickerStats(w = wijzigingen()) {
  const rijen = Object.entries(START.stickers).map(([id, s]) => ({ id, datum: datumVan(id), ...s }))
  for (const s of w.fan.stickers.filter((x) => x.claimedAt)) {
    const datum = datumVan(s.matchId)
    let rij = rijen.find((r) => r.datum === datum)
    if (!rij) {
      rij = { id: s.matchId, datum, geclaimd: 0, waarvanOpAfstand: 0 }
      rijen.push(rij)
    }
    rij.geclaimd += 1
    if (s.type === 'followed') rij.waarvanOpAfstand += 1
  }
  return rijen.sort((a, b) => b.datum.localeCompare(a.datum))
}

/* ---------- Webshop ---------- */

export function webshopStats(w = wijzigingen()) {
  const producten = START.webshop.producten.map((p) => {
    const eigen = w.winkel.bestellingen.filter((b) => b.productId === p.id)
    const aantal = eigen.reduce((a, b) => a + b.aantal, 0)
    return { ...p, besteld: p.besteld + aantal, voorraadNu: voorraadVan(w, p), omzetApp: aantal * p.prijs }
  })
  const omzet = START.webshop.omzetDezeMaand + producten.reduce((a, p) => a + p.omzetApp, 0)
  const shirtsBesteld = producten.filter((p) => /shirt/i.test(p.naam)).reduce((a, p) => a + p.besteld, 0)
  return { producten, omzet, shirtsBesteld, bestellingen: w.winkel.bestellingen }
}

/* ---------- Deals ---------- */

export function dealStats(w = wijzigingen()) {
  const codes = (dealId) => profielen(w).filter((p) => p.dealCodes?.[dealId]).length
  const start = START.deals.map((d) => ({ ...d, codesAangemaakt: d.codesAangemaakt + codes(d.id), aan: !w.admin.deals.uit.includes(d.id) }))
  const eigen = w.admin.deals.eigen.map((d) => ({ id: d.id, titel: d.titel, codesAangemaakt: codes(d.id), ingewisseld: 0, eigen: true, aan: !w.admin.deals.uit.includes(d.id) }))
  return [...start, ...eigen]
}

/* ---------- Rossie ---------- */

const normaliseer = (v) => v.toLowerCase().replace(/[?!.]+$/, '').replace(/\s+/g, ' ').trim()

export function rossieStats(w = wijzigingen()) {
  const tel = new Map(START.rossie.topVragen.map((v) => [normaliseer(v.vraag), { vraag: v.vraag, aantal: v.aantal }]))
  for (const r of w.rossie) {
    const sleutel = normaliseer(r.vraag)
    const rij = tel.get(sleutel) ?? { vraag: r.vraag, aantal: 0, nieuw: true }
    rij.aantal += 1
    tel.set(sleutel, rij)
  }
  return {
    gesprekken: START.rossie.gesprekken + w.rossie.length,
    top: [...tel.values()].sort((a, b) => b.aantal - a.aantal).slice(0, 10),
  }
}

/* ---------- Agents ---------- */

export const openAgents = (w = wijzigingen()) => alleAgents(w).filter((a) => a.actie && !a.afgehandeld).length
