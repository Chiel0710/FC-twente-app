// Sportdata in de browser, rechtstreeks uit de JSON-bestanden in
// data/sport/. Bouwt precies dezelfde vorm op als de backend (Prisma) vroeger
// teruggaf — teams, wedstrijden met events, standen, selecties — zodat de
// pagina's niets merken. Zo heeft de live-versie geen database nodig.
// (Zelfde logica als backend/prisma/seed.js, maar met vaste id's.)
import speelschema from './data/sport/fc-twente-speelschema-2026-2027.json'
import speelschemaVrouwen from './data/sport/fc-twente-vrouwen-speelschema-2026-2027.json'
import standMannen from './data/sport/eredivisie-stand-2026-2027.json'
import standVrouwen from './data/sport/vrouwen-eredivisie-stand-2026-2027.json'
import selectieMannen from './data/sport/selectie-fc-twente-2026-2027.json'
import selectieVrouwen from './data/sport/selectie-fc-twente-vrouwen-2026-2027.json'
import wedstrijdDetails from './data/sport/wedstrijd-details-2026-2027.json'

// Clubnaam (zoals in de JSON) → logo-bestand in public/logos en korte naam
const LOGO_SLUG = {
  AZ: 'az',
  Feyenoord: 'feyenoord',
  PSV: 'psv',
  'FC Twente': 'fc-twente',
  Ajax: 'ajax',
  'Fortuna Sittard': 'fortuna-sittard',
  Excelsior: 'excelsior',
  'FC Groningen': 'fc-groningen',
  'Go Ahead Eagles': 'go-ahead-eagles',
  'sc Heerenveen': 'sc-heerenveen',
  NEC: 'nec',
  Sparta: 'sparta',
  Telstar: 'telstar',
  'SC Cambuur': 'sc-cambuur',
  'FC Utrecht': 'fc-utrecht',
  'PEC Zwolle': 'pec-zwolle',
  'ADO Den Haag': 'ado-den-haag',
  'Willem II': 'willem-ii',
  'FC Thun': 'fc-thun',
  'Lincoln Red Imps': 'lincoln-red-imps',
  Pafos: 'pafos',
  'SC Freiburg': 'sc-freiburg',
  'AGF Aarhus': 'agf-aarhus',
  'Kairat Almaty': 'kairat-almaty',
  'De Graafschap': 'de-graafschap',
}

const SHORT_NAME = {
  AZ: 'AZ', Feyenoord: 'FEY', PSV: 'PSV', 'FC Twente': 'TWE', Ajax: 'AJA',
  'Fortuna Sittard': 'FOR', Excelsior: 'EXC', 'FC Groningen': 'GRO', 'Go Ahead Eagles': 'GAE',
  'sc Heerenveen': 'HEE', NEC: 'NEC', Sparta: 'SPA', Telstar: 'TEL', 'SC Cambuur': 'CAM',
  'FC Utrecht': 'UTR', 'PEC Zwolle': 'PEC', 'ADO Den Haag': 'ADO', 'Willem II': 'WIL',
  'FC Thun': 'THU', 'Lincoln Red Imps': 'LIN', Pafos: 'PAF', 'SC Freiburg': 'FRE',
  'AGF Aarhus': 'AGF', 'Kairat Almaty': 'KAI', 'De Graafschap': 'DGR',
}

export const slugVan = (naam) => LOGO_SLUG[naam] ?? naam.toLowerCase().replace(/[^a-z0-9]+/g, '-')

/* ---------- Teams: standcijfers van de Eredivisie (mannen) erbij ---------- */
function bouwTeams() {
  const teams = new Map()
  const maak = (naam, rij) => ({
    id: slugVan(naam),
    name: naam,
    shortName: SHORT_NAME[naam] ?? naam.slice(0, 3).toUpperCase(),
    logoUrl: `/logos/${slugVan(naam)}.png`,
    isTwente: naam === 'FC Twente',
    position: rij?.positie ?? null,
    played: rij?.gespeeld ?? null,
    goalDifference: rij?.doelsaldo ?? null,
    points: rij?.punten ?? null,
    zone: rij?.zone ?? null,
  })
  for (const rij of standMannen.stand) teams.set(rij.club, maak(rij.club, rij))
  const overige = [...speelschema.wedstrijden, ...speelschemaVrouwen.wedstrijden]
    .flatMap((w) => [w.thuis, w.uit])
    .concat(standVrouwen.stand.map((r) => r.club))
  for (const naam of overige) if (!teams.has(naam)) teams.set(naam, maak(naam, null))
  return teams
}

const TEAMS = bouwTeams()

/* ---------- Wedstrijden: beide speelschema's, met doelpunten als events ---------- */
function bouwWedstrijden() {
  const details = new Map(wedstrijdDetails.wedstrijden.map((w) => [w.datum, w]))
  const teller = { mannen: 0, vrouwen: 0 }
  const gezien = new Set()
  const lijst = [
    ...speelschema.wedstrijden.map((w) => ({ ...w, team: 'mannen' })),
    ...speelschemaVrouwen.wedstrijden.map((w) => ({ ...w, team: 'vrouwen' })),
  ]
  return lijst.map((w) => {
    const thuisTeam = TEAMS.get(w.thuis)
    const uitTeam = TEAMS.get(w.uit)
    // Aftrap in lokale tijd op de speeldag (onbekende aftrap: 15:00, zoals de seed)
    const [uur, minuut] = (w.aftrap ?? '15:00').split(':').map(Number)
    const kickoff = new Date(w.datum)
    kickoff.setHours(uur, minuut, 0, 0)

    let matchday = null
    if (w.competitie.endsWith('Eredivisie')) matchday = ++teller[w.team]

    const [thuisScore, uitScore] =
      w.status === 'gespeeld' && w.uitslag ? w.uitslag.split('-').map(Number) : [null, null]

    // Vaste id, bv. "mannen-2026-09-20" (nooit dubbel)
    let id = `${w.team}-${w.datum}`
    while (gezien.has(id)) id += '-2'
    gezien.add(id)

    // wedstrijd-details gaat alleen over de mannen
    const d = w.team === 'mannen' ? details.get(w.datum) : undefined
    const events =
      w.status === 'gespeeld' && d
        ? d.doelpunten
            .map((g, i) => ({
              id: `${id}-goal-${i}`,
              matchId: id,
              minute: g.minuut,
              type: 'goal',
              teamId: TEAMS.get(g.team)?.id ?? slugVan(g.team),
              playerName: g.speler,
            }))
            .sort((a, b) => a.minute - b.minute)
        : []

    return {
      id,
      competition: w.competitie,
      matchday,
      kickoff: kickoff.toISOString(),
      aftrapBekend: Boolean(w.aftrap),
      dagDefinitief: w.dagDefinitief !== false,
      competitieLogo: w.competitieLogo ?? null,
      team: w.team,
      venue:
        w.team === 'vrouwen'
          ? null
          : w.thuis === 'FC Twente'
            ? 'De Grolsch Veste, Enschede'
            : `Uitstadion ${thuisTeam.name}`,
      status: w.status,
      thuisTeamId: thuisTeam.id,
      uitTeamId: uitTeam.id,
      thuisScore,
      uitScore,
      toeschouwers: d?.toeschouwers ?? null,
      bron: d?.bron ?? null,
      compleet: d?.compleet ?? false,
      thuisTeam,
      uitTeam,
      events,
    }
  })
}

export const WEDSTRIJDEN = bouwWedstrijden()

export function wedstrijdenVan(team, status) {
  return WEDSTRIJDEN.filter((m) => m.team === team && (!status || m.status === status)).sort(
    (a, b) => a.kickoff.localeCompare(b.kickoff),
  )
}

export const wedstrijdMetId = (id) => WEDSTRIJDEN.find((m) => m.id === id) ?? null

/* ---------- Standen ---------- */
export function standVan(team) {
  const bron = team === 'vrouwen' ? standVrouwen : standMannen
  return bron.stand
    .map((r) => {
      const club = TEAMS.get(r.club)
      return {
        id: club.id,
        name: club.name,
        shortName: club.shortName,
        logoUrl: club.logoUrl,
        isTwente: club.isTwente,
        position: r.positie,
        played: r.gespeeld,
        goalDifference: r.doelsaldo,
        points: r.punten,
        zone: r.zone,
        // alleen bij de vrouwenstand ingevuld, anders null
        gewonnen: r.gewonnen ?? null,
        gelijk: r.gelijk ?? null,
        verloren: r.verloren ?? null,
        doelpuntenVoor: r.doelpuntenVoor ?? null,
        doelpuntenTegen: r.doelpuntenTegen ?? null,
      }
    })
    .sort((a, b) => a.position - b.position)
}

/* ---------- Selecties ---------- */
export function spelersVan(team) {
  const bron = team === 'vrouwen' ? selectieVrouwen : selectieMannen
  return bron.selectie
    .map((s) => ({
      id: `${team}-${s.rugnummer}`,
      naam: s.naam,
      rugnummer: s.rugnummer,
      positie: s.positie ?? null,
      foto: s.foto ?? null,
      team,
    }))
    .sort((a, b) => a.rugnummer - b.rugnummer)
}

export const spelerMetId = (id) =>
  [...spelersVan('mannen'), ...spelersVan('vrouwen')].find((s) => s.id === id) ?? null
