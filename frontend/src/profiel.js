import { useCallback } from 'react'
import personas from './data/personas.json'
import voorbeeld from './data/voorbeeld-seizoenskaart.json'
import * as db from './lib/demoDb'

// Wie gebruikt de app? Er is geen echte inlog: je bent standaard "Bezoeker"
// en kunt via het profielmenu (poppetje rechtsboven) inloggen als een van de
// demo-persona's uit data/personas.json. De keuze staat in de demoDb; na
// het wisselen laden we de pagina opnieuw, zodat alle pagina's die
// HUIDIGE_PERSONA / HUIDIG_PROFIEL_ID importeren automatisch meeveranderen —
// geen React-context nodig voor zoiets simpels.
//
// Elke persona hoort bij een databaseprofiel "demo-<id>", zodat stemmen,
// voorspellingen, stickers, de seizoenskaart en de teamkeuze blijven werken.
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
  const id = db.leesPersona()
  return personas.some((p) => p.id === id) ? id : STANDAARD_PERSONA
}

export const HUIDIGE_PERSONA = personas.find((p) => p.id === leesPersonaId())
export const HUIDIG_PROFIEL_ID = `demo-${HUIDIGE_PERSONA.id}`
export const IS_BEZOEKER = HUIDIGE_PERSONA.id === STANDAARD_PERSONA

// Inloggen als persona (of met "bezoeker" weer uitloggen) — daarna herladen
export function kiesPersona(personaId) {
  db.zetPersona(personaId)
  window.location.reload()
}

// Oude profielwissel (Meer → Jij) gebruikte database-id's als "demo-daan";
// die vertalen we naar de persona, zodat oude aanroepen blijven werken.
export function setHuidigProfielId(profielId) {
  kiesPersona(profielId.replace(/^demo-/, ''))
}

/* ---------- Per persona bewaard (in de demoDb): aanwezigheid, aangeboden kaarten, dealcodes ---------- */

const leesVeld = (veld, wedstrijdId) => db.leesFan(HUIDIG_PROFIEL_ID, veld)[wedstrijdId] ?? null

export function leesAanwezigheid(wedstrijdId) {
  return leesVeld('aanwezigheid', wedstrijdId)
}

// [waarde, zet]: waarde is "ja", "nee" of null (nog niets gekozen).
export function useAanwezigheid(wedstrijdId) {
  db.useDemoDb() // opnieuw tekenen bij een wijziging (ook uit een ander tabblad)
  const zet = useCallback((nieuw) => db.bewaarAanwezigheid(HUIDIG_PROFIEL_ID, wedstrijdId, nieuw), [wedstrijdId])
  return [leesVeld('aanwezigheid', wedstrijdId), zet]
}

// [aangeboden, zet]: staat de kaart voor deze wedstrijd op de doorverkoopmarkt?
// Aanbieden meldt de Ticket-agent in de admin.
export function useAangeboden(wedstrijdId) {
  db.useDemoDb()
  const zet = useCallback((nieuw) => db.biedKaartAan(HUIDIG_PROFIEL_ID, wedstrijdId, Boolean(nieuw)), [wedstrijdId])
  return [leesVeld('aangeboden', wedstrijdId), zet]
}

// Code voor één deal: één keer gemaakt en bewaard, zodat je bij opnieuw
// openen dezelfde code ziet. Een nieuwe dag (of een reset) = nieuwe code.
export function dealCodeVoor(dealId) {
  return db.maakDealCode(HUIDIG_PROFIEL_ID, dealId)
}

// Pitch opnieuw: wat je als fan deed weer leeg (zie demoDb.resetFan)
export function wisDemoGegevens() {
  db.resetFan()
}
