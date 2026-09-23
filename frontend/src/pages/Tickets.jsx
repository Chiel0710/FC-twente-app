import { Ticket } from 'lucide-react'
import Placeholder from '../components/Placeholder'
import AlbumPromo from '../components/AlbumPromo'
import SeizoenskaartKaart from '../components/SeizoenskaartKaart'

export default function Tickets() {
  return (
    <div className="placeholder-page">
      <div className="seizoenskaart-hero">
        <SeizoenskaartKaart />
        <div className="seizoenskaart-hero__tekst">
          <span className="eyebrow">Jouw kaart</span>
          <h2>Seizoenskaart</h2>
          <p>
            Tik de kaart om voor je toegangs-QR bij de poort. Log je straks in met je naam, dan
            wordt dit echt jouw kaart.
          </p>
        </div>
      </div>

      <AlbumPromo onKlik={() => { window.location.href = '/plakboek' }} />

      <Placeholder
        Icon={Ticket}
        titel="Losse kaarten & fanshop"
        tekst="Hier komt straks de losse kaartverkoop voor de eerstvolgende wedstrijd en een link naar de fanshop. Binnenkort beschikbaar."
      />
    </div>
  )
}
