import { useEffect, useState } from 'react'
import { ArrowLeft } from 'lucide-react'
import { getWedstrijdTicketQr } from '../api'
import { useKaartWedstrijd } from '../kaartWedstrijd'
import { HUIDIGE_PERSONA, VOORBEELD_HOUDER } from '../profiel'
import { datumTekst, tijdTekst } from '../wedstrijdTekst'
import RouteKnop from '../components/RouteKnop'

// /tickets/ticket — je kaartje voor de eerstvolgende thuiswedstrijd (tijdens
// de demo: Twente – PSV). Stoel uit de seizoenskaart van de persona; zonder
// eigen kaart die van Johan de Heer, met het label "Voorbeeld".
// De QR komt van de server, net als bij de seizoenskaart.
const VOORBEELD = VOORBEELD_HOUDER // data/voorbeeld-seizoenskaart.json

export default function TicketPagina({ demo, demoActief, onTerug }) {
  const wedstrijd = useKaartWedstrijd(demo, demoActief)
  const eigen = Boolean(HUIDIGE_PERSONA.seizoenskaart)
  const houder = eigen ? HUIDIGE_PERSONA : VOORBEELD
  const [ticket, setTicket] = useState(undefined)

  useEffect(() => {
    if (!wedstrijd) return
    let actief = true
    getWedstrijdTicketQr(wedstrijd.id, `demo-${houder.id}`)
      .then((t) => actief && setTicket(t))
      .catch(() => actief && setTicket(null))
    return () => {
      actief = false
    }
  }, [wedstrijd, houder.id])

  const { vak, rij, stoel } = houder.seizoenskaart

  return (
    <div className="subpagina">
      <button type="button" className="meer-terug" onClick={onTerug}>
        <ArrowLeft strokeWidth={2} size={16} />
        Tickets
      </button>
      <div className="section-heading">
        <span className="eyebrow">{eigen ? 'Jouw kaartje' : 'Zo ziet een kaartje eruit'}</span>
        <h2>Je kaartje</h2>
      </div>

      {wedstrijd === undefined && <div className="card">Kaartje laden...</div>}
      {wedstrijd === null && <div className="card">Er is nu geen thuiswedstrijd gepland.</div>}

      {wedstrijd && (
        <article className="kaartje">
          {!eigen && <span className="voorbeeld-label kaartje__voorbeeld">Voorbeeld</span>}

          <div className="kaartje__kop">
            <img src={wedstrijd.thuisTeam.logoUrl.replace('/logos/', '/logos-transparant/')} alt="" />
            <div className="kaartje__wedstrijd">
              <span className="kaartje__competitie">{wedstrijd.competition}</span>
              <strong>
                {wedstrijd.thuisTeam.name} – {wedstrijd.uitTeam.name}
              </strong>
              <span>
                {demoActief ? 'Vandaag' : datumTekst(wedstrijd)} · {tijdTekst(wedstrijd)}
              </span>
            </div>
            <img src={wedstrijd.uitTeam.logoUrl.replace('/logos/', '/logos-transparant/')} alt="" />
          </div>

          {/* Scheurlijn zoals bij een papieren kaartje */}
          <div className="kaartje__scheur" aria-hidden="true" />

          <div className="kaartje__lijf">
            <dl className="kaartje__plaats">
              <div>
                <dt>Vak</dt>
                <dd>{vak}</dd>
              </div>
              <div>
                <dt>Rij</dt>
                <dd>{rij}</dd>
              </div>
              <div>
                <dt>Stoel</dt>
                <dd>{stoel}</dd>
              </div>
            </dl>

            <div className="kaartje__qr">
              {ticket ? (
                <img src={ticket.qr} alt="Toegangs-QR voor deze wedstrijd" />
              ) : (
                <span>{ticket === null ? 'QR niet beschikbaar' : 'QR laden…'}</span>
              )}
            </div>
            <p className="kaartje__nummer">{ticket?.kaartnummer ?? ' '}</p>
            <p className="kaartje__naam">
              {houder.naam} · De Grolsch Veste, Enschede
            </p>
          </div>
        </article>
      )}

      {wedstrijd && <RouteKnop />}
    </div>
  )
}
