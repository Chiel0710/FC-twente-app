import { useEffect } from 'react'

// Overlay die de actieve tegel omhoog laat schuiven (animatie uit
// fan-wereld.html). Sluiten kan met Escape of door naast de tegel te tikken
// (op de gedempte achtergrond, ook onderin over de onderbalk). Geen
// sluitknop: die stak buiten de kaart en gaf schuifbalken.
export default function TegelOverlay({ onSluit, children }) {
  useEffect(() => {
    function bijToets(e) {
      if (e.key === 'Escape') onSluit()
    }
    document.addEventListener('keydown', bijToets)
    return () => document.removeEventListener('keydown', bijToets)
  }, [onSluit])

  return (
    <div
      className="tegel-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onSluit()
      }}
    >
      <div className="tegel-overlay__kaart" role="dialog" aria-modal="true">
        {children}
      </div>
    </div>
  )
}
