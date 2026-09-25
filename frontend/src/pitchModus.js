// Pitchmodus: de hele demo in de app zelf, zonder regiepaneel.
//  - staat standaard AAN (localhost én de live-link); ?pitch=0 zet hem uit,
//    ?pitch=1 weer aan
//  - de keuze geldt voor deze sessie (sessionStorage), dus navigeren binnen de
//    app, of even naar /plakboek en terug, verandert niets
//  - herladen (F5 / Ctrl+R) start de pitch opnieuw: fase "voor" met de
//    afteller, inbox leeg, sticker, stemmen, aanwezigheid en dealcodes terug
//    (alles op dit apparaat, zie demoKlok.js en api.js)
import { DEMO_DATUM, startPitch as startDemoKlok } from './demoKlok'
import { wisDemoStemmen } from './api'
import { wisDemoGegevens } from './profiel'

const MODUS_SLEUTEL = 'fctwente_pitch' // "1" of "0"
const GESTART_SLEUTEL = 'fctwente_pitch_gestart'

function leesSessie(sleutel) {
  try {
    return sessionStorage.getItem(sleutel)
  } catch {
    return null
  }
}

function schrijfSessie(sleutel, waarde) {
  try {
    sessionStorage.setItem(sleutel, waarde)
  } catch {
    // geen sessionStorage: dan geldt het alleen voor deze paginalading
  }
}

function bepaalModus() {
  const params = new URLSearchParams(window.location.search)
  const uitUrl = params.get('pitch')
  if (uitUrl === '0' || uitUrl === '1') {
    schrijfSessie(MODUS_SLEUTEL, uitUrl)
    // ?pitch=... weer uit het adres halen; de keuze staat nu in de sessie
    params.delete('pitch')
    const rest = params.toString()
    window.history.replaceState(window.history.state, '', `${window.location.pathname}${rest ? `?${rest}` : ''}${window.location.hash}`)
    return uitUrl === '1'
  }
  const bewaard = leesSessie(MODUS_SLEUTEL)
  if (bewaard !== null) return bewaard === '1'
  return true // standaard aan, ook op de live-link
}

export const IS_PITCH = bepaalModus()

// Moet deze paginalading de pitch (opnieuw) starten? Ja bij herladen, en bij de
// eerste keer in deze sessie; niet als je via een link terugkomt (bv. van /plakboek).
function bepaalStart() {
  if (!IS_PITCH) return false
  const navigatie = performance.getEntriesByType?.('navigation')?.[0]
  return navigatie?.type === 'reload' || leesSessie(GESTART_SLEUTEL) !== '1'
}

export const PITCH_START = bepaalStart()

// De splash duurt ~2,5 s; zo lang wacht de afteller extra, zodat je na de
// splash de volle 20 seconden ziet.
const SPLASH_MS = 2500

let gestart = false
export function startPitch() {
  if (!PITCH_START || gestart) return
  gestart = true
  schrijfSessie(GESTART_SLEUTEL, '1')
  wisDemoStemmen(DEMO_DATUM) // stemmen, poll, voorspelling en de demo-sticker
  wisDemoGegevens() // aanwezigheid, aangeboden kaarten, dealcodes
  startDemoKlok(SPLASH_MS)
}
