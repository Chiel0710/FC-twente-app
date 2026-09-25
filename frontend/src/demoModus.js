// Is de demo actief? Vroeger stond er een aan/uit-schakelaar op de server
// (/api/demo/modus); de demo draait nu helemaal in de browser (demoKlok.js).
// In pitchmodus (standaard aan) telt de demo altijd als actief; zonder
// pitchmodus pas zodra de wedstrijd loopt (bv. via ?demo=wedstrijd).
export function useDemoModus() {
  return false
}

// De dag erna (tik op het logo) is weer een gewone dag: dan is de demo niet
// meer actief en tonen alle pagina's de echte eerstvolgende wedstrijd; alleen
// de inbox blijft staan.
export function isDemoActief(demoState, modusAan) {
  if (!demoState || demoState.fase === 'dagerna') return false
  return modusAan || demoState.fase !== 'voor'
}
