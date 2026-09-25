// Admin-slot voor de demo. LET OP: dit is GEEN echte beveiliging. De code
// staat gewoon in de frontend en iedereen die hem kent (of de code leest)
// komt erin. Genoeg om in de pitch te laten zien dat er een aparte admin-kant
// is; een echte app heeft hier een login met accounts en rechten op de server.
const CODE = '0000'
const SLEUTEL = 'fctwente_admin' // sessionStorage: alleen voor deze browsersessie

export function probeerAdmin(code) {
  if (code !== CODE) return false
  try {
    sessionStorage.setItem(SLEUTEL, '1')
  } catch {
    // geen sessionStorage: dan alleen tot herladen
  }
  return true
}

export function isAdmin() {
  try {
    return sessionStorage.getItem(SLEUTEL) === '1'
  } catch {
    return false
  }
}

export function adminUitloggen() {
  try {
    sessionStorage.removeItem(SLEUTEL)
  } catch {
    // niets te doen
  }
}
