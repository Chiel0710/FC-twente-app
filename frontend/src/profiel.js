// Er is nog geen echte onboarding in de app (komt in een latere stap), maar
// via "Jij" in de Meer-tab kun je wél wisselen tussen de geseede demo-
// profielen ("demo-wissel", zoals de briefing vraagt). De keuze staat in
// localStorage; na het wisselen laden we de pagina opnieuw, zodat alle
// pagina's die HUIDIG_PROFIEL_ID importeren automatisch de nieuwe waarde
// krijgen — geen React-context nodig voor zoiets simpels.
const OPSLAGSLEUTEL = "fctwente_profiel_id"
const STANDAARD_PROFIEL_ID = "demo-daan" // Daan = standaard showcase-persona

function leesOpgeslagenProfielId() {
  try {
    return localStorage.getItem(OPSLAGSLEUTEL) ?? STANDAARD_PROFIEL_ID
  } catch {
    return STANDAARD_PROFIEL_ID
  }
}

export const HUIDIG_PROFIEL_ID = leesOpgeslagenProfielId()

export function setHuidigProfielId(profielId) {
  try {
    localStorage.setItem(OPSLAGSLEUTEL, profielId)
  } catch {
    // localStorage niet beschikbaar (bv. privénavigatie) — gewoon negeren
  }
  window.location.reload()
}
