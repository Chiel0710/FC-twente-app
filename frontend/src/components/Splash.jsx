import { useEffect, useRef, useState } from 'react'

// Opstartscherm: 2 seconden de clubafbeelding, daarna zacht uitfaden naar de
// app. Tikken (of Enter/spatie) slaat hem over. Bij prefers-reduced-motion
// geen animatie: hij verdwijnt dan gewoon. App.jsx toont hem alleen bij het
// eerste bezoek per sessie.
const TOON_MS = 2000
const UITFADEN_MS = 500

export default function Splash({ onKlaar }) {
  const [weg, setWeg] = useState(false)
  const klaarRef = useRef(false)

  function sluit() {
    if (klaarRef.current) return
    klaarRef.current = true
    const minderBeweging = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    setWeg(true)
    setTimeout(onKlaar, minderBeweging ? 0 : UITFADEN_MS)
  }

  useEffect(() => {
    const t = setTimeout(sluit, TOON_MS)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div
      className={`splash${weg ? ' is-weg' : ''}`}
      role="button"
      tabIndex={0}
      aria-label="Opstartscherm FC Twente. Tik om verder te gaan."
      onClick={sluit}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && sluit()}
    >
      <img className="splash__beeld" src="/splash.png" alt="FC Twente — Veur altied" />
      <p className="splash__disclaimer">Studentproject Fontys — geen officiële app van FC Twente</p>
    </div>
  )
}
