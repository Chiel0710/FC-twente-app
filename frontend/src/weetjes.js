// Weetjes voor de Fan-tab (bal met de gloeilamp). Alles komt uit de bestaande
// data: de API geeft door wat de seed uit backend/data/*.json in de database
// zette. Er wordt niets verzonnen: ontbreekt een gegeven, dan valt dat weetje
// weg. Zo kloppen ze vanzelf weer als de data verandert.
//
// Weetjes die nu nog niet kunnen, maar vanzelf verschijnen zodra de data er is:
//  - oudste/jongste speler: als spelers een veld `geboortedatum` krijgen
//  - topscorer: pas als van élke gespeelde wedstrijd de doelpuntmakers bekend
//    zijn, anders zou de topscorer niet kloppen

const tz = 'Europe/Amsterdam'

function datumTekst(iso, metTijd) {
  const d = new Date(iso)
  const dag = d.toLocaleDateString('nl-NL', { timeZone: tz, weekday: 'long', day: 'numeric', month: 'long' })
  if (!metTijd) return dag
  const tijd = d.toLocaleTimeString('nl-NL', { timeZone: tz, hour: '2-digit', minute: '2-digit' })
  return `${dag} om ${tijd}`
}

const ploeg = (team) => (team === 'vrouwen' ? 'de vrouwen' : 'de mannen')
const Ploeg = (team) => (team === 'vrouwen' ? 'De vrouwen' : 'De mannen')

// Twente-kant van een wedstrijd: { voor, tegen, tegenstander, thuis }
function vanTwente(m) {
  const thuis = m.thuisTeam?.isTwente
  return {
    thuis,
    voor: thuis ? m.thuisScore : m.uitScore,
    tegen: thuis ? m.uitScore : m.thuisScore,
    tegenstander: (thuis ? m.uitTeam : m.thuisTeam)?.name,
  }
}

function standWeetjes(team, stand) {
  const twente = stand?.find((t) => t.isTwente)
  if (!twente || !twente.played) return []
  const uit = []
  const alles = twente.gewonnen === twente.played ? ` Ze wonnen elke wedstrijd!` : ''
  uit.push(
    `${Ploeg(team)} van FC Twente staan ${twente.position}e in de ${team === 'vrouwen' ? 'Vrouwen Eredivisie' : 'Eredivisie'}, met ${twente.points} punten uit ${twente.played} wedstrijden.${alles}`,
  )
  if (twente.doelpuntenVoor != null && twente.doelpuntenTegen != null) {
    uit.push(
      `Na ${twente.played} speelrondes scoorden ${ploeg(team)} al ${twente.doelpuntenVoor} keer in de competitie. Tegen kregen ze er ${twente.doelpuntenTegen}.`,
    )
  }
  return uit
}

function volgendeWeetje(team, programma) {
  const m = programma?.[0]
  if (!m) return []
  const { thuis, tegenstander } = vanTwente(m)
  if (!tegenstander) return []
  const waar = thuis ? 'thuis tegen' : 'uit bij'
  return [
    `De volgende wedstrijd van ${ploeg(team)}: ${datumTekst(m.kickoff, m.aftrapBekend)}, ${waar} ${tegenstander} (${m.competition}).`,
  ]
}

function uitslagWeetjes(team, uitslagen) {
  const gespeeld = (uitslagen ?? []).filter((m) => m.thuisScore != null && m.uitScore != null)
  if (!gespeeld.length) return []
  const uit = []

  // Grootste overwinning: meeste doelpunten verschil in het voordeel van Twente
  const zeges = gespeeld.map((m) => ({ m, ...vanTwente(m) })).filter((z) => z.voor > z.tegen)
  if (zeges.length) {
    const beste = zeges.reduce((a, b) => (b.voor - b.tegen > a.voor - a.tegen ? b : a))
    const { m } = beste
    uit.push(
      `De grootste competitiezege van ${ploeg(team)} dit seizoen: ${m.thuisTeam.name} – ${m.uitTeam.name} ${m.thuisScore}-${m.uitScore}, op ${datumTekst(m.kickoff, false)}.`,
    )
  }

  // Topscorer alleen als van elke wedstrijd met Twente-goals de makers bekend zijn
  let compleet = true
  const goals = new Map()
  for (const m of gespeeld) {
    const { voor } = vanTwente(m)
    const twenteId = m.thuisTeam?.isTwente ? m.thuisTeamId : m.uitTeamId
    const eigen = (m.events ?? []).filter((e) => e.type === 'goal' && e.teamId === twenteId)
    if (eigen.length !== voor) compleet = false
    for (const e of eigen) goals.set(e.playerName, (goals.get(e.playerName) ?? 0) + 1)
  }
  if (compleet && goals.size) {
    const [naam, aantal] = [...goals].sort((a, b) => b[1] - a[1])[0]
    uit.push(`Topscorer van ${ploeg(team)} in de competitie: ${naam}, met ${aantal} doelpunt${aantal === 1 ? '' : 'en'}.`)
  }
  return uit
}

function selectieWeetjes(team, spelers) {
  if (!spelers?.length) return []
  const uit = []
  const keepers = spelers.filter((s) => s.positie === 'Keeper').length
  uit.push(`De selectie van ${ploeg(team)} telt ${spelers.length} spelers, van wie ${keepers} keeper${keepers === 1 ? '' : 's'}.`)

  const hoogste = spelers.filter((s) => s.rugnummer != null).sort((a, b) => b.rugnummer - a.rugnummer)[0]
  if (hoogste) uit.push(`Het hoogste rugnummer bij ${ploeg(team)} is ${hoogste.rugnummer}: dat is ${hoogste.naam}.`)

  // Oudste en jongste speler, zodra er geboortedatums in de data staan
  const metDatum = spelers.filter((s) => s.geboortedatum)
  if (metDatum.length >= 2) {
    const opLeeftijd = [...metDatum].sort((a, b) => new Date(a.geboortedatum) - new Date(b.geboortedatum))
    uit.push(`De oudste speler bij ${ploeg(team)} is ${opLeeftijd[0].naam}, de jongste ${opLeeftijd.at(-1).naam}.`)
  }
  return uit
}

// data: per team { spelers, stand, uitslagen, programma } (alles mag ontbreken)
export function maakWeetjes({ mannen = {}, vrouwen = {} } = {}) {
  return [
    ...standWeetjes('vrouwen', vrouwen.stand),
    ...volgendeWeetje('mannen', mannen.programma),
    ...standWeetjes('mannen', mannen.stand),
    ...uitslagWeetjes('vrouwen', vrouwen.uitslagen?.filter((m) => m.matchday != null)),
    ...uitslagWeetjes('mannen', mannen.uitslagen?.filter((m) => m.matchday != null)),
    ...volgendeWeetje('vrouwen', vrouwen.programma),
    ...selectieWeetjes('mannen', mannen.spelers),
    ...selectieWeetjes('vrouwen', vrouwen.spelers),
  ]
}
