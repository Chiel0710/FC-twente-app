// Hoe datum en aftraptijd van een wedstrijd op het scherm komen.
// Eén plek, zodat Home en Wedstrijden precies hetzelfde zeggen.

const datumFormat = new Intl.DateTimeFormat('nl-NL', {
  weekday: 'short',
  day: 'numeric',
  month: 'short',
})

const tijdFormat = new Intl.DateTimeFormat('nl-NL', {
  hour: '2-digit',
  minute: '2-digit',
})

// Harde spatie: "(onder voorbehoud)" blijft bij elkaar. Moet de regel
// afbreken, dan gebeurt dat vóór het haakje en niet midden in de toevoeging.
const HARDE_SPATIE = String.fromCharCode(160)
const ONDER_VOORBEHOUD = `(onder${HARDE_SPATIE}voorbehoud)`

// "za 6 feb", of "za 6 feb (onder voorbehoud)" als de dag nog niet vaststaat
export function datumTekst(match) {
  const datum = datumFormat.format(new Date(match.kickoff))
  return match.dagDefinitief === false ? `${datum} ${ONDER_VOORBEHOUD}` : datum
}

// "20:00", of "tijd n.t.b." als de aftrap nog niet bekend is
export function tijdTekst(match) {
  return match.aftrapBekend ? tijdFormat.format(new Date(match.kickoff)) : 'tijd n.t.b.'
}

export function isGespeeld(match) {
  return match.status === 'gespeeld' && match.thuisScore !== null && match.uitScore !== null
}
