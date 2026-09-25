import { useCallback, useEffect, useState } from 'react'
import { getSeizoenskaartQr } from './api'

// QR van de seizoenskaart, van de server (nooit alleen in de client).
// Verhuisd uit SeizoenskaartKaart, zodat ook de nieuwe flipkaart op Tickets hem
// gebruikt. FlipKaart.jsx heeft geen onFlip-callback — we volgen daarom van
// buitenaf, niet-invasief, het aria-pressed-attribuut dat hij zelf op
// .flip-kaart zet, met een MutationObserver. Zolang de kaart omgedraaid is,
// halen we elke 60 seconden een nieuwe QR op; draait hij terug, dan stopt dat.
//
// scèneRef: ref op een element waarbinnen de .flip-kaart staat
// geeft: undefined = laden, null = geen kaart, anders { qr, naam, vak, ... }
export function useSeizoenskaartQr(profielId, sceneRef, { transparant = false } = {}) {
  const [kaart, setKaart] = useState(undefined)

  const ververs = useCallback(() => {
    getSeizoenskaartQr(profielId, { transparant })
      .then(setKaart)
      .catch(() => setKaart(null))
  }, [profielId, transparant])

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
  }, [ververs, sceneRef])

  return kaart
}
