import { useRef } from 'react'
import { useSeizoenskaartQr } from '../seizoenskaartQr'
import { HUIDIG_PROFIEL_ID } from '../profiel'
import { FlipKaart, SeizoenskaartAchterkant } from '../FlipKaart'
import Seizoenskaart from './Seizoenskaart'
import '../flipkaart.css'

const datumFormat = new Intl.DateTimeFormat('nl-NL', { day: '2-digit', month: '2-digit', year: 'numeric' })

// Verbindt de aangeleverde FlipKaart/SeizoenskaartAchterkant met echte data.
// De QR ververst elke 60 seconden zolang de kaart omgedraaid is (zie
// useSeizoenskaartQr in seizoenskaartQr.js).
// profielId: wiens kaart (standaard die van de huidige persona). Tickets geeft
// hier het profiel van Johan mee als voorbeeld voor fans zonder seizoenskaart.
export default function SeizoenskaartKaart({ profielId = HUIDIG_PROFIEL_ID }) {
  const sceneRef = useRef(null)
  // Ophalen en verversen van de QR zit nu in de gedeelde hook (seizoenskaartQr.js)
  const kaart = useSeizoenskaartQr(profielId, sceneRef)

  const achterkant =
    kaart === undefined ? (
      <div className="kaart-achter">
        <p className="ka-sub">Laden...</p>
      </div>
    ) : kaart === null ? (
      <div className="kaart-achter">
        <p className="ka-sub">Geen seizoenskaart gevonden voor dit profiel.</p>
      </div>
    ) : (
      <SeizoenskaartAchterkant
        qr={<img src={kaart.qr} alt="Toegangs-QR" />}
        kaartnummer={kaart.kaartnummer}
        naam={kaart.naam}
        vak={kaart.vak}
        rij={kaart.rij}
        stoel={kaart.stoel}
        geldigTot={datumFormat.format(new Date(kaart.geldigTot))}
      />
    )

  return (
    <div ref={sceneRef} style={{ width: '100%', maxWidth: 280 }}>
      <FlipKaart voorkant={<Seizoenskaart />} achterkant={achterkant} />
    </div>
  )
}
