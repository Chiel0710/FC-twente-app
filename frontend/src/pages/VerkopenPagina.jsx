import { ArrowLeft, CircleCheck } from 'lucide-react'
import { useKaartWedstrijd } from '../kaartWedstrijd'
import { HUIDIGE_PERSONA, VOORBEELD_HOUDER, useAangeboden } from '../profiel'
import { datumTekst, tijdTekst } from '../wedstrijdTekst'

// /tickets/verkopen — kaart aanbieden op de doorverkoopmarkt. Alleen demo:
// er wordt niets echt verkocht of betaald. De status wordt per persona en
// wedstrijd onthouden; Reset op het regiepaneel zet hem terug.
const VOORBEELD = VOORBEELD_HOUDER // data/voorbeeld-seizoenskaart.json

export default function VerkopenPagina({ demo, demoActief, onTerug }) {
  const wedstrijd = useKaartWedstrijd(demo, demoActief)
  const [aangeboden, zetAangeboden] = useAangeboden(wedstrijd?.id ?? 'onbekend')
  const eigen = Boolean(HUIDIGE_PERSONA.seizoenskaart)
  const { vak, rij, stoel } = (eigen ? HUIDIGE_PERSONA : VOORBEELD).seizoenskaart

  return (
    <div className="subpagina">
      <button type="button" className="meer-terug" onClick={onTerug}>
        <ArrowLeft strokeWidth={2} size={16} />
        Tickets
      </button>
      <div className="section-heading">
        <span className="eyebrow">Doorverkoopmarkt</span>
        <h2>Verkoop je kaart</h2>
      </div>

      {wedstrijd === undefined && <div className="card">Wedstrijd laden...</div>}
      {wedstrijd === null && <div className="card">Er is nu geen thuiswedstrijd om een kaart voor aan te bieden.</div>}

      {wedstrijd && (
        <div className="card verkopen">
          {!eigen && <span className="voorbeeld-label verkopen__voorbeeld">Voorbeeld</span>}
          <span className="eyebrow">{wedstrijd.competition}</span>
          <h3>
            {wedstrijd.thuisTeam.name} – {wedstrijd.uitTeam.name}
          </h3>
          <p className="verkopen__wanneer">
            {demoActief ? 'Vandaag' : datumTekst(wedstrijd)} · {tijdTekst(wedstrijd)}
          </p>
          <p className="verkopen__plaats">
            Vak {vak} · Rij {rij} · Stoel {stoel}
          </p>

          {aangeboden ? (
            <p className="verkopen__status" role="status">
              <CircleCheck strokeWidth={2.2} aria-hidden="true" />
              Aangeboden. Je ontvangt je geld terug zodra hij verkocht is
            </p>
          ) : (
            <button type="button" className="verkopen__knop" onClick={() => zetAangeboden(true)}>
              Bied aan op de doorverkoopmarkt
            </button>
          )}

          <p className="verkopen__demo">Dit is een demo: er wordt niets echt verkocht of betaald.</p>
        </div>
      )}
    </div>
  )
}
