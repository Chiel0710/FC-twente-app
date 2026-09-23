import { useCallback, useEffect, useRef, useState } from 'react'
import { getSeizoenskaartQr } from '../api'
import { HUIDIG_PROFIEL_ID } from '../profiel'
import { FlipKaart, SeizoenskaartAchterkant } from '../FlipKaart'
import Seizoenskaart from './Seizoenskaart'
import '../flipkaart.css'

const datumFormat = new Intl.DateTimeFormat('nl-NL', { day: '2-digit', month: '2-digit', year: 'numeric' })

// Verbindt de aangeleverde FlipKaart/SeizoenskaartAchterkant met echte data.
// FlipKaart.jsx heeft geen onFlip-callback — we volgen daarom van buitenaf,
// niet-invasief, het aria-pressed-attribuut dat de hook zelf al op de
// .flip-kaart-knop zet, met een MutationObserver. Zolang die op "true"
// staat ververst dit component de QR elke 60 seconden; bij "false" stopt
// het interval meteen weer.
export default function SeizoenskaartKaart() {
  const [kaart, setKaart] = useState(undefined) // undefined = laden, null = geen kaart
  const sceneRef = useRef(null)

  const ververs = useCallback(() => {
    getSeizoenskaartQr(HUIDIG_PROFIEL_ID)
      .then(setKaart)
      .catch(() => setKaart(null))
  }, [])

  useEffect(() => {
    ververs()
  }, [ververs])

  useEffect(() => {
    const knop = sceneRef.current?.querySelector('.flip-kaart')
    if (!knop) return

    let interval = null
    const opFlipVeranderd = () => {
      const omgedraaid = knop.getAttribute('aria-pressed') === 'true'
      if (omgedraaid) {
        ververs()
        interval = setInterval(ververs, 60_000)
      } else if (interval) {
        clearInterval(interval)
        interval = null
      }
    }

    const observer = new MutationObserver(opFlipVeranderd)
    observer.observe(knop, { attributes: true, attributeFilter: ['aria-pressed'] })

    return () => {
      observer.disconnect()
      if (interval) clearInterval(interval)
    }
  }, [ververs])

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
