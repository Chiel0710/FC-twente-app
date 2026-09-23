import { useEffect } from 'react'
import { X } from 'lucide-react'

// Overlay die de actieve tegel omhoog laat schuiven (animatie uit
// fan-wereld.html). Sluiten kan met de knop, met Escape, of door naast de
// tegel te tikken (op de gedempte achtergrond, niet op de tegel zelf).
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
      <div className="tegel-overlay__kaart">
        <button type="button" className="tegel-overlay__sluit" onClick={onSluit} aria-label="Sluiten">
          <X strokeWidth={2.5} size={18} />
        </button>
        {children}
      </div>
    </div>
  )
}
