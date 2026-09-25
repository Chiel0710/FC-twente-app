import { useDemoDb, START } from '../../lib/demoDb'
import { HUIDIGE_PERSONA, HUIDIG_PROFIEL_ID } from '../../profiel'
import { spelersVan, wedstrijdMetId } from '../../sportData'
import { QUIZ_WEEK, QUIZVRAGEN } from '../../quizData'
import '../../mijntwente.css'

// Mijn Twente (profielmenu): wat de app van jou weet.
//  - Daan: zijn historie uit data/demo-database.json (tickets, ook bij de
//    Vrouwen, stickers, gedrag, webshop) + wat hij nu in de app doet
//  - bezoeker: geen historie, alleen wat je in deze sessie doet
const euro = (n) => n.toLocaleString('nl-NL', { style: 'currency', currency: 'EUR' })
const datum = (iso) => new Date(iso).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', year: 'numeric' })
const productNaam = (id) => START.webshop.producten.find((p) => p.id === id)?.naam ?? id

// Nette naam van een wedstrijd-id uit de database ("2026-08-16-twente-pec-zwolle")
function wedstrijdNaam(id) {
  const ticket = START.daan.ticketHistorie.find((t) => t.wedstrijdId === id)
  if (ticket) return ticket.wedstrijd
  const m = wedstrijdMetId(`mannen-${id.slice(0, 10)}`)
  return m ? `${m.thuisTeam.name} – ${m.uitTeam.name}` : id
}

function Blok({ titel, children, leeg }) {
  return (
    <section className="mt-blok">
      <h3>{titel}</h3>
      {children ?? <p className="mt-leeg">{leeg}</p>}
    </section>
  )
}

export default function MijnTwente() {
  const w = useDemoDb()
  const isDaan = HUIDIGE_PERSONA.id === 'daan'
  const daan = START.daan
  const eigen = w.fan.profielen[HUIDIG_PROFIEL_ID] ?? {}
  const spelers = spelersVan('mannen')

  // Deze sessie: wat je in de app deed
  const sessie = []
  for (const [matchId, spelerId] of Object.entries(eigen.motm ?? {})) {
    const m = wedstrijdMetId(matchId)
    sessie.push(`Man of the Match gestemd: ${spelers.find((s) => s.id === spelerId)?.naam ?? spelerId}${m ? ` (tegen ${m.thuisTeam.isTwente ? m.uitTeam.name : m.thuisTeam.name})` : ''}`)
  }
  for (const [matchId, uitslag] of Object.entries(eigen.voorspelling ?? {})) {
    const m = wedstrijdMetId(matchId)
    sessie.push(`Voorspeld: ${m ? `${m.thuisTeam.name} – ${m.uitTeam.name}` : matchId} ${uitslag}`)
  }
  const quiz = eigen.quiz?.[String(QUIZ_WEEK)]
  if (quiz) sessie.push(`Weekquiz: ${quiz.antwoorden.filter(Boolean).length} van de ${QUIZVRAGEN.length} goed`)
  if (Object.keys(eigen.poll ?? {}).length) sessie.push(`Gestemd in ${Object.keys(eigen.poll).length} poll(s)`)
  for (const [matchId, waarde] of Object.entries(eigen.aanwezigheid ?? {})) {
    const m = wedstrijdMetId(matchId)
    sessie.push(`Ben je erbij${m ? ` (${m.thuisTeam.name} – ${m.uitTeam.name})` : ''}: ${waarde === 'ja' ? 'ja' : 'nee'}`)
  }
  const stickersNu = w.fan.stickers.filter((s) => s.profileId === HUIDIG_PROFIEL_ID && s.claimedAt)
  const bestellingenNu = w.winkel.bestellingen.filter((b) => b.profielId === HUIDIG_PROFIEL_ID)
  const vragenNu = w.rossie.filter((r) => r.profielId === HUIDIG_PROFIEL_ID)

  return (
    <div className="mijn-twente">
      <div className="section-heading">
        <span className="eyebrow">{HUIDIGE_PERSONA.naam}</span>
        <h2>Mijn Twente</h2>
      </div>

      {isDaan ? (
        <>
          <div className="mt-kerncijfers">
            <div>
              <strong>{daan.gedrag.wedstrijdenGevolgdInApp}</strong>
              <span>wedstrijden gevolgd in de app</span>
            </div>
            <div>
              <strong>{daan.gedrag.highlightsBekeken}</strong>
              <span>keer highlights bekeken</span>
            </div>
            <div>
              <strong>{daan.gedrag.quizScoreGemiddeld}</strong>
              <span>gemiddeld in de quiz</span>
            </div>
          </div>

          <Blok titel="Mijn tickets">
            <ul className="mt-tickets">
              {daan.ticketHistorie.map((t) => (
                <li key={t.wedstrijdId}>
                  <span className={`mt-team mt-team--${t.team}`}>{t.team === 'vrouwen' ? 'Vrouwen' : 'Mannen'}</span>
                  <strong>{t.wedstrijd}</strong>
                  <span className="mt-sub">
                    {datum(t.datum)} · {t.uitslag} · vak {t.vak}, rij {t.rij}, stoel {t.stoel}
                  </span>
                  <span className="mt-prijs">{euro(t.prijs)}</span>
                </li>
              ))}
            </ul>
          </Blok>

          <Blok titel="Mijn stickers">
            <ul className="mt-lijst">
              {daan.gedrag.stickersGeclaimd.map((id) => (
                <li key={id}>{wedstrijdNaam(id)}</li>
              ))}
              {stickersNu.map((s) => (
                <li key={s.id} className="mt-nieuw">
                  {wedstrijdNaam(s.matchId.slice(-10))} <em>#{s.serialNumber} · net geclaimd</em>
                </li>
              ))}
            </ul>
          </Blok>

          <Blok titel="Webshop">
            <ul className="mt-lijst">
              {daan.gedrag.webshop.map((b, i) => (
                <li key={i}>
                  {b.product} (maat {b.maat}) · {datum(b.datum)} · {euro(b.bedrag)}
                </li>
              ))}
              {bestellingenNu.map((b) => (
                <li key={b.id} className="mt-nieuw">
                  {b.aantal}× {productNaam(b.productId)} (maat {b.maat}) <em>net besteld</em>
                </li>
              ))}
            </ul>
          </Blok>

          <Blok titel="Zo gebruik ik de app">
            <ul className="mt-lijst">
              <li>Meest gebruikt: {daan.gedrag.meestGebruikteFeature}</li>
              <li>{daan.gedrag.stemmenGegeven} keer gestemd, {daan.gedrag.quizGespeeld} keer de quiz gespeeld</li>
              <li>
                {daan.gedrag.voorspellingenGedaan} voorspellingen, waarvan {daan.gedrag.voorspellingenGoed} goed
              </li>
              <li>Meldingen aan voor: {daan.gedrag.notificaties}</li>
            </ul>
          </Blok>
        </>
      ) : (
        <p className="mt-uitleg">
          Je bent niet ingelogd, dus er is geen historie. Hieronder zie je wat je in deze sessie doet. Log in via het
          profielmenu om je tickets en stickers te bewaren.
        </p>
      )}

      <Blok titel="Deze sessie" leeg="Nog niets gedaan. Stem, speel de quiz of claim een sticker, dan zie je het hier.">
        {sessie.length + stickersNu.length + bestellingenNu.length + vragenNu.length > 0 ? (
          <ul className="mt-lijst">
            {sessie.map((regel) => (
              <li key={regel}>{regel}</li>
            ))}
            {!isDaan && stickersNu.map((s) => <li key={s.id}>Sticker geclaimd: {wedstrijdNaam(s.matchId.slice(-10))}</li>)}
            {!isDaan && bestellingenNu.map((b) => <li key={b.id}>Besteld: {b.aantal}× {productNaam(b.productId)} (maat {b.maat})</li>)}
            {vragenNu.map((r, i) => (
              <li key={i}>Aan Rossie gevraagd: “{r.vraag}”</li>
            ))}
          </ul>
        ) : undefined}
      </Blok>
    </div>
  )
}
