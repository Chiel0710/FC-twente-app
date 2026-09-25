import SeizoenskaartFlip from '../components/SeizoenskaartFlip'
import TegelZone from '../components/TegelZone'
import BenJeErbij from '../components/BenJeErbij'
import RouteKnop from '../components/RouteKnop'
import { useKaartWedstrijd } from '../kaartWedstrijd'
import { useNavigatie } from '../navigatie'
import { HUIDIGE_PERSONA, IS_BEZOEKER } from '../profiel'
import '../tickets.css'

// Tickets volgens het Canva-ontwerp (tickets-1-boven + tickets-2-onder):
//   1. seizoenskaart (flipkaart), altijd bovenaan
//   2–5. tegels uit tegels.json via het featuresysteem (zone "tickets"):
//        als bezoeker precies het ontwerp — Ticket, Ben je erbij?, Plakboek,
//        Verkoop je kaart; met een persona in de volgorde van zijn fantype
// Kopbalk, onderbalk en scrollgedrag zijn dezelfde als op Home (App.jsx).
//
// props (uit App.jsx): demo, demoActief — voor "de wedstrijd van je kaartje"
export default function Tickets({ demo, demoActief }) {
  const wedstrijd = useKaartWedstrijd(demo, demoActief)
  // Eigen seizoenskaart, of (alleen voor de bezoeker) de voorbeeldkaart;
  // een ingelogde fan zonder kaart (Daan) krijgt het blok hieronder
  const toonKaart = Boolean(HUIDIGE_PERSONA.seizoenskaart) || IS_BEZOEKER

  return (
    <div className="tickets">
      {toonKaart ? <SeizoenskaartFlip /> : <GeenSeizoenskaart />}
      <RouteKnop />
      <TegelZone zone="tickets" eigen={{ 'ben-je-erbij': <BenJeErbij wedstrijd={wedstrijd} demoActief={demoActief} /> }} />
    </div>
  )
}

// In plaats van de seizoenskaart, voor een fan zonder kaart (Daan)
function GeenSeizoenskaart() {
  const { openFeature } = useNavigatie()
  return (
    <section className="geen-kaart" aria-labelledby="geen-kaart-kop">
      <h2 id="geen-kaart-kop">Geen seizoenskaart</h2>
      <p>Koop een los ticket of volg Twente via de app.</p>
      <button type="button" className="geen-kaart__knop" onClick={() => openFeature('/tickets/ticket')}>
        Naar tickets
      </button>
    </section>
  )
}
