import { useEffect, useMemo, useState } from 'react'
import featureData from './data/features.json'
import { HUIDIGE_PERSONA } from './profiel'

// Featuresysteem: welke tegels staan in welke volgorde op een scherm (zone),
// afhankelijk van het fantype van de fan. De data staat in data/features.json
// (relevantie per fantype) en public/home/tegels.json (ontwerp: afbeelding,
// vorm en de standaardvolgorde). Nieuwe feature = alleen features.json aanvullen.

export const FEATURES = featureData.features

// Database-profielen gebruiken soms andere namen dan de features
const FANTYPE_ALIAS = { seizoenskaarthouder: 'seizoenskaart', losbezoek: 'losse' }

export function normaliseerFantype(fantype) {
  const naam = FANTYPE_ALIAS[fantype] ?? fantype
  return featureData.fantypes.includes(naam) ? naam : 'standaard'
}

// tegels.json is één keer per sessie nodig; staat in public, dus ophalen
let tegelsBelofte = null
function laadTegels() {
  tegelsBelofte ??= fetch('/home/tegels.json').then((r) => {
    if (!r.ok) throw new Error(`tegels.json: ${r.status}`)
    return r.json()
  })
  return tegelsBelofte
}

// De volgorde uit het ontwerp. Regels als "player-of-the-match + aanbiedingen"
// of "wedstrijdtegel (code)" worden losse id's; alleen echte features blijven over.
function ontwerpVolgorde(tegels, zone) {
  return (tegels.volgorde?.[zone] ?? [])
    .flatMap((regel) => regel.split('+'))
    .map((deel) => deel.replace(/\(.*\)/, '').trim())
    .filter((id) => FEATURES.some((f) => f.id === id))
}

// Pure functie (los te testen): de features van een zone, in volgorde.
// - heeft de persona een eigen lijst (volgorde["<zone>-<persona>"]): exact die
// - fantype "standaard": precies de volgorde uit tegels.json (het ontwerp)
// - andere fantypes: hoogste relevantie eerst; bij gelijke relevantie de ontwerpvolgorde
// - relevantie 0: niet in deze zone (wel via Meer)
// - vast "onder": altijd achteraan, buiten het sorteren om
// Elke feature krijgt zijn tegel uit tegels.json mee (null als er geen afbeelding is).
export function bepaalVolgorde({ zone, fantype, persona, tegels }) {
  // Eigen ontwerp voor deze persona, bv. volgorde["home-daan"]: die lijst
  // exact volgen (geen sorteren, geen "vast onder"). Nieuwe persona met eigen
  // scherm = alleen een regel in tegels.json.
  if (persona && tegels.volgorde?.[`${zone}-${persona}`]) {
    return ontwerpVolgorde(tegels, `${zone}-${persona}`).map((id) => ({
      ...FEATURES.find((f) => f.id === id),
      tegel: tegels.tegels?.find((t) => t.id === id) ?? null,
    }))
  }

  const type = normaliseerFantype(fantype)
  const ontwerp = ontwerpVolgorde(tegels, zone)
  const plek = (id) => (ontwerp.includes(id) ? ontwerp.indexOf(id) : Infinity)

  // Tegels met "personas" in tegels.json (bv. Webshop) alleen voor die persona's
  const voorPersona = (f) => {
    const alleen = tegels.tegels?.find((t) => t.id === f.id)?.personas
    return !alleen || alleen.includes(persona)
  }
  const zichtbaar = FEATURES.filter(
    (f) => f.zones.includes(zone) && (f.relevantie[type] ?? 0) > 0 && voorPersona(f),
  )

  const gesorteerd =
    type === 'standaard'
      ? zichtbaar.filter((f) => ontwerp.includes(f.id)).sort((a, b) => plek(a.id) - plek(b.id))
      : [...zichtbaar].sort(
          (a, b) => b.relevantie[type] - a.relevantie[type] || plek(a.id) - plek(b.id),
        )

  const vastOnder = gesorteerd.filter((f) => f.vast === 'onder')
  const rest = gesorteerd.filter((f) => f.vast !== 'onder')

  return [...rest, ...vastOnder].map((f) => ({
    ...f,
    tegel: tegels.tegels?.find((t) => t.id === f.id) ?? null,
  }))
}

// tegels.json als hook (null zolang hij laadt); gedeeld door alle tegels
export function useTegels() {
  const [tegels, setTegels] = useState(null)

  useEffect(() => {
    let actief = true
    laadTegels()
      .then((t) => actief && setTegels(t))
      .catch(() => {})
    return () => {
      actief = false
    }
  }, [])

  return tegels
}

// Volgorde voor het fantype van de huidige persona. Leeg zolang tegels.json laadt.
export function useFeatureVolgorde(zone) {
  const tegels = useTegels()

  return useMemo(
    () =>
      tegels
        ? bepaalVolgorde({ zone, fantype: HUIDIGE_PERSONA.fantype, persona: HUIDIGE_PERSONA.id, tegels })
        : [],
    [zone, tegels],
  )
}
