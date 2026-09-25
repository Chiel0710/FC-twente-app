// Demo-regisseur in de browser: speelt FC Twente – PSV (20 sep 2026, 3-2) af.
// Vroeger deed de server dit met de toestand in zijn geheugen; serverless
// (Vercel) vergeet die tussen twee aanroepen. Daarom bewaren we hier alleen
// één starttijd (localStorage) en BEREKENEN we de rest steeds opnieuw uit
// (nu − starttijd): fase, minuut, stand en welke meldingen er al zijn. Zo
// klopt alles ook na herladen. Elk apparaat speelt zijn eigen pitch.
// De doelpunten komen uit data/sport/wedstrijd-details-2026-2027.json.
import details from './data/sport/wedstrijd-details-2026-2027.json'

// ---- Snelheid van de pitch (instelbaar) ----
export const PITCH_AFTELLEN_SEC = 20 // afteller op Home tot de aftrap
export const SEC_PER_MINUUT = 1.5 // 90 speelminuten -> ~2 min 15 s
export const RUST_SEC = 5

// Na het eindsignaal volgen vanzelf drie meldingen (wachttijd in seconden)
export const WACHT_HIGHLIGHTS = 8 // "Twente in 60 seconden"
export const WACHT_STEMMEN = 12 // "Stem nu op de Man of the Match"
export const WACHT_STICKER = 18 // plakboek-sticker claimen

export const DEMO_DATUM = '2026-09-20' // FC Twente – PSV
const WEDSTRIJD = details.wedstrijden.find((w) => w.id === DEMO_DATUM)

/* ---------- Opslag: { aftrapOp, dagernaOp } (ms), per apparaat ---------- */
const SLEUTEL = 'fctwente_demo'

function lees() {
  try {
    return JSON.parse(localStorage.getItem(SLEUTEL)) ?? {}
  } catch {
    return {}
  }
}

function bewaar(staat) {
  try {
    localStorage.setItem(SLEUTEL, JSON.stringify(staat))
  } catch {
    // niet op te slaan: dan geldt het alleen tot herladen
  }
}

// Pitch (opnieuw): fase "voor" met de afteller; vertraging = de splash eerst
export function startPitch(vertragingMs = 0) {
  bewaar({ aftrapOp: Date.now() + vertragingMs + PITCH_AFTELLEN_SEC * 1000, dagernaOp: null })
}

// Wedstrijd meteen laten beginnen (bv. ?demo=wedstrijd)
export function startNu() {
  bewaar({ aftrapOp: Date.now(), dagernaOp: null })
}

// Tik op het logo: de dag erna (gewone dag, geen nieuwe meldingen meer)
export function naarDagErna() {
  const staat = lees()
  if (!staat.dagernaOp) bewaar({ ...staat, dagernaOp: Date.now() })
}

/* ---------- Rekenwerk ---------- */

// Seconden na de aftrap waarop een speelminuut begint (inclusief de rust)
const secVoorMinuut = (m) => (m < 45 ? m * SEC_PER_MINUUT : 45 * SEC_PER_MINUUT + RUST_SEC + (m - 45) * SEC_PER_MINUUT)
const WEDSTRIJD_SEC = secVoorMinuut(90)

function huidigeMinuut(verstreken) {
  const eersteHelft = 45 * SEC_PER_MINUUT
  if (verstreken < eersteHelft) return { minuut: Math.floor(verstreken / SEC_PER_MINUUT), fase: 'live' }
  if (verstreken < eersteHelft + RUST_SEC) return { minuut: 45, fase: 'rust' }
  const minuut = 45 + Math.floor((verstreken - eersteHelft - RUST_SEC) / SEC_PER_MINUUT)
  if (minuut >= 90) return { minuut: 90, fase: 'na' }
  return { minuut, fase: 'live' }
}

// Stand en doelpunten tot en met deze minuut (de echte doelpunten)
function standTot(minuut) {
  let thuis = 0
  let uit = 0
  const gebeurd = []
  for (const d of WEDSTRIJD.doelpunten) {
    if (d.minuut > minuut) continue
    if (d.team === WEDSTRIJD.thuis) thuis++
    else uit++
    gebeurd.push({ ...d, stand: `${thuis}-${uit}` })
  }
  return { thuis, uit, gebeurd }
}

/* ---------- Meldingen (zelfde teksten als vroeger op de server) ---------- */

const zelfde = (tekst, knop, link) => {
  const v = { tekst, knop, route: link }
  return { standaard: v, afstand: v }
}
const kort = (naam) => naam.replace('FC ', '')
const highlightsLink = `/highlights/${DEMO_DATUM}`
const stickerLink = `/plakboek?claim=${DEMO_DATUM}-twente-psv`

const goalMelding = (d, tijd) => ({
  id: `goal-${d.minuut}`,
  tijd,
  titel:
    d.team === 'FC Twente' ? `GOAL! FC Twente – PSV ${d.stand}` : `Tegengoal. FC Twente – PSV ${d.stand}`,
  link: '/',
  varianten: zelfde(`${d.minuut}' ${d.speler}`, 'Volg live', '/'),
})

const eindMelding = (tijd) => ({
  id: 'eindsignaal',
  tijd,
  titel: 'Gewonnen! FC Twente – PSV 3-2',
  link: '/',
  varianten: zelfde('Het eindsignaal heeft geklonken.', 'Bekijk', '/'),
})

const highlightsMelding = (tijd) => ({
  id: 'highlights',
  tijd,
  titel: 'Twente in 60 seconden',
  link: highlightsLink,
  varianten: zelfde(`Bekijk de goals van ${kort(WEDSTRIJD.thuis)} – ${WEDSTRIJD.uit}`, 'Bekijk', highlightsLink),
})

const stemMelding = (tijd) => ({
  id: 'stemmen',
  tijd,
  titel: 'Stem nu op de Man of the Match',
  link: '/fan?open=motm',
  varianten: zelfde('Wie was de beste Twente-speler tegen PSV?', 'Stemmen', '/fan?open=motm'),
})

// De titel hangt af van de fan (App.jsx kiest uit titels): erbij / afstand / standaard
function stickerMelding(tijd) {
  const titels = {
    erbij: 'Was je erbij? Claim je plakboek-sticker',
    afstand: 'Je keek mee op afstand. Claim je plakboek-sticker',
    standaard: `Claim je plakboek-sticker van ${kort(WEDSTRIJD.thuis)} – ${WEDSTRIJD.uit}`,
  }
  return {
    id: 'sticker',
    tijd,
    titel: titels.standaard,
    titels,
    link: stickerLink,
    varianten: zelfde(`${kort(WEDSTRIJD.thuis)} – ${WEDSTRIJD.uit} 3-2 staat klaar in je plakboek`, 'Claim', stickerLink),
  }
}

// Alle meldingen die op tijdstip t al binnen zijn, in volgorde
function meldingenTot(aftrapOp, t) {
  const iso = (ms) => new Date(ms).toISOString()
  const verstreken = (t - aftrapOp) / 1000
  const { minuut, fase } = huidigeMinuut(verstreken)
  const lijst = standTot(minuut).gebeurd.map((d) => goalMelding(d, iso(aftrapOp + secVoorMinuut(d.minuut) * 1000)))
  if (fase === 'na') {
    const naOp = aftrapOp + WEDSTRIJD_SEC * 1000
    lijst.push(eindMelding(iso(naOp)))
    const sinds = (t - naOp) / 1000
    if (sinds >= WACHT_HIGHLIGHTS) lijst.push(highlightsMelding(iso(naOp + WACHT_HIGHLIGHTS * 1000)))
    if (sinds >= WACHT_STEMMEN) lijst.push(stemMelding(iso(naOp + WACHT_STEMMEN * 1000)))
    if (sinds >= WACHT_STICKER) lijst.push(stickerMelding(iso(naOp + WACHT_STICKER * 1000)))
  }
  return lijst
}

/**
 * De stand van de demo op dit moment, in dezelfde vorm als vroeger
 * GET /api/demo/state: { fase, restMs, minuut, wedstrijd, stand,
 * gebeurtenissen, meldingen }. fase: voor | live | rust | na | dagerna
 */
export function berekenDemo(nu = Date.now()) {
  const { aftrapOp, dagernaOp } = lees()
  const wedstrijd = { thuis: WEDSTRIJD.thuis, uit: WEDSTRIJD.uit, datum: WEDSTRIJD.datum, uitzending: 'ESPN 1' }
  const uitslag = (minuut, fase, meldingen, restMs = null) => {
    const { thuis, uit, gebeurd } = standTot(minuut)
    return { fase, restMs, minuut, wedstrijd, stand: { thuis, uit }, gebeurtenissen: gebeurd, meldingen }
  }

  // De dag erna: wedstrijd gespeeld, meldingen tot het moment van de tik
  if (dagernaOp) {
    const meldingen = aftrapOp && dagernaOp >= aftrapOp ? meldingenTot(aftrapOp, dagernaOp) : []
    return uitslag(90, 'dagerna', meldingen)
  }
  if (!aftrapOp) return uitslag(0, 'voor', [])
  if (nu < aftrapOp) return uitslag(0, 'voor', [], aftrapOp - nu)

  const { minuut, fase } = huidigeMinuut((nu - aftrapOp) / 1000)
  return uitslag(minuut, fase, meldingenTot(aftrapOp, nu))
}
