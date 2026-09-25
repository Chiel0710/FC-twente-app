import { useCallback, useSyncExternalStore } from 'react'
import personas from './data/personas.json'
import voorbeeld from './data/voorbeeld-seizoenskaart.json'

// Wie gebruikt de app? Er is geen echte inlog: je bent standaard "Bezoeker"
// en kunt via het profielmenu (poppetje rechtsboven) inloggen als een van de
// demo-persona's uit data/personas.json. De keuze staat in localStorage; na
// het wisselen laden we de pagina opnieuw, zodat alle pagina's die
// HUIDIGE_PERSONA / HUIDIG_PROFIEL_ID importeren automatisch meeveranderen —
// geen React-context nodig voor zoiets simpels.
//
// Elke persona hoort bij een databaseprofiel "demo-<id>", zodat stemmen,
// voorspellingen, stickers, de seizoenskaart en de teamkeuze blijven werken.
const PERSONA_SLEUTEL = 'fctwente_persona'
const PROFIELEN_SLEUTEL = 'fctwente_profielen' // per persona: { aanwezigheid: {...} }
const STANDAARD_PERSONA = 'bezoeker'

export const PERSONAS = personas

// Voorbeeld-seizoenskaart (Johan de Heer) voor wie zelf geen kaart heeft:
// zelfde vorm als een persona ({ id, naam, seizoenskaart }), met id zo dat
// `demo-${id}` het databaseprofiel is waar de server de voorbeeld-QR voor maakt
export const VOORBEELD_HOUDER = {
  id: voorbeeld.profielId.replace(/^demo-/, ''),
  naam: voorbeeld.naam,
  seizoenskaart: voorbeeld.seizoenskaart,
}

function leesPersonaId() {
  try {
    const id = localStorage.getItem(PERSONA_SLEUTEL)
    return personas.some((p) => p.id === id) ? id : STANDAARD_PERSONA
  } catch {
    return STANDAARD_PERSONA
  }
}

export const HUIDIGE_PERSONA = personas.find((p) => p.id === leesPersonaId())
export const HUIDIG_PROFIEL_ID = `demo-${HUIDIGE_PERSONA.id}`
export const IS_BEZOEKER = HUIDIGE_PERSONA.id === STANDAARD_PERSONA

// Inloggen als persona (of met "bezoeker" weer uitloggen) — daarna herladen
export function kiesPersona(personaId) {
  try {
    localStorage.setItem(PERSONA_SLEUTEL, personaId)
  } catch {
    // localStorage niet beschikbaar (bv. privénavigatie) — dan blijft het bij deze sessie
  }
  window.location.reload()
}

// Oude profielwissel (Meer → Jij) gebruikte database-id's als "demo-daan";
// die vertalen we naar de persona, zodat oude aanroepen blijven werken.
export function setHuidigProfielId(profielId) {
  kiesPersona(profielId.replace(/^demo-/, ''))
}

/* ---------- Per persona bewaard: aanwezigheid, aangeboden kaarten, dealcodes ----------
   localStorage "fctwente_profielen" = {
     "<persona-id>": {
       aanwezigheid: { "<wedstrijd-id>": "ja" | "nee" },
       aangeboden:   { "<wedstrijd-id>": true },    // kaart op de doorverkoopmarkt
       dealCodes:    { "<deal-id>": { code, datum } } // QR-code bij Aanbiedingen
     }
   } */

const luisteraars = new Set()

function leesProfielen() {
  try {
    return JSON.parse(localStorage.getItem(PROFIELEN_SLEUTEL)) ?? {}
  } catch {
    return {}
  }
}

function meldWijziging() {
  luisteraars.forEach((l) => l())
}

function abonneer(luisteraar) {
  luisteraars.add(luisteraar)
  // Ook bijwerken als een ander tabblad het profiel aanpast
  window.addEventListener('storage', luisteraar)
  return () => {
    luisteraars.delete(luisteraar)
    window.removeEventListener('storage', luisteraar)
  }
}

function leesVeld(veld, wedstrijdId) {
  return leesProfielen()[HUIDIGE_PERSONA.id]?.[veld]?.[wedstrijdId] ?? null
}

function schrijfVeld(veld, wedstrijdId, waarde) {
  const profielen = leesProfielen()
  const eigen = profielen[HUIDIGE_PERSONA.id] ?? {}
  const lijst = { ...(eigen[veld] ?? {}) }
  if (waarde === null) delete lijst[wedstrijdId]
  else lijst[wedstrijdId] = waarde
  profielen[HUIDIGE_PERSONA.id] = { ...eigen, [veld]: lijst }
  try {
    localStorage.setItem(PROFIELEN_SLEUTEL, JSON.stringify(profielen))
  } catch {
    // niet op te slaan — dan geldt de keuze alleen niet na herladen
  }
  meldWijziging()
}

// [waarde, zet] voor één veld van één wedstrijd; zet(null) haalt het weg
function useProfielVeld(veld, wedstrijdId) {
  const waarde = useSyncExternalStore(abonneer, () => leesVeld(veld, wedstrijdId))
  const zet = useCallback((nieuw) => schrijfVeld(veld, wedstrijdId, nieuw), [veld, wedstrijdId])
  return [waarde, zet]
}

export function leesAanwezigheid(wedstrijdId) {
  return leesVeld('aanwezigheid', wedstrijdId)
}

// [waarde, zet]: waarde is "ja", "nee" of null (nog niets gekozen).
export function useAanwezigheid(wedstrijdId) {
  return useProfielVeld('aanwezigheid', wedstrijdId)
}

// [aangeboden, zet]: staat de kaart voor deze wedstrijd op de doorverkoopmarkt?
export function useAangeboden(wedstrijdId) {
  return useProfielVeld('aangeboden', wedstrijdId)
}

// Dealcode (Aanbiedingen): leesbaar zonder O/0 en I/1, bv. "FCT-7K3Q-92XD"
const CODE_TEKENS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

function maakDealCode() {
  const getallen = crypto.getRandomValues(new Uint32Array(8))
  const tekens = [...getallen].map((g) => CODE_TEKENS[g % CODE_TEKENS.length]).join('')
  return `FCT-${tekens.slice(0, 4)}-${tekens.slice(4)}`
}

// Vandaag als "YYYY-MM-DD" in Nederlandse tijd: de code is geldig t/m vandaag
const vandaag = () => new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Amsterdam' })

// Code voor één deal: één keer gemaakt en bewaard in het profiel, zodat je bij
// opnieuw openen dezelfde code ziet. Een nieuwe dag (of een Reset) = nieuwe code.
export function dealCodeVoor(dealId) {
  const bewaard = leesVeld('dealCodes', dealId)
  if (bewaard?.datum === vandaag()) return bewaard.code
  const code = maakDealCode()
  schrijfVeld('dealCodes', dealId, { code, datum: vandaag() })
  return code
}

// Reset van de demo (regiepaneel): aanwezigheid, aangeboden kaarten en dealcodes weg,
// voor alle persona's in deze browser
export function wisDemoGegevens() {
  try {
    localStorage.removeItem(PROFIELEN_SLEUTEL)
  } catch {
    // niets op te ruimen
  }
  meldWijziging()
}
