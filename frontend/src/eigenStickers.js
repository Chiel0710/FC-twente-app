// Zelfgemaakte stickers (aangeleverd als "1.png" t/m "7.png") — de nummering
// in de bestandsnamen bleek NIET de chronologische wedstrijdvolgorde te zijn
// (bv. "1.png" is de PEC Zwolle-wedstrijd van 16 augustus, niet de eerste
// gespeelde wedstrijd van 9 augustus). Daarom hier gekoppeld op de datum die
// letterlijk op elke sticker staat, niet op het bestandsnummer.
//
// Deze 7 wedstrijden staan hierdoor altijd als "geplakt" in het plakboek, met
// dit eigen ontwerp i.p.v. de gegenereerde kaart — ongeacht check-in/claim-status.
export const EIGEN_STICKERS = {
  '2026-08-09': '/eigen-stickers/3.png', // sc Heerenveen 1-0 FC Twente
  '2026-08-16': '/eigen-stickers/1.png', // FC Twente 3-1 PEC Zwolle
  '2026-08-30': '/eigen-stickers/4.png', // SC Cambuur 1-4 FC Twente
  '2026-09-06': '/eigen-stickers/5.png', // FC Groningen 2-2 FC Twente
  '2026-09-09': '/eigen-stickers/6.png', // FC Twente 1-0 Telstar
  '2026-09-12': '/eigen-stickers/2.png', // FC Twente 2-0 ADO Den Haag
  '2026-09-20': '/eigen-stickers/7.png', // FC Twente 3-2 PSV
}

export function eigenStickerVoor(kickoffIso) {
  return EIGEN_STICKERS[kickoffIso.slice(0, 10)] ?? null
}
