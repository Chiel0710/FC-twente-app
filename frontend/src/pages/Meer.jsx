import { useState } from 'react'
import { ArrowLeft, Bell, ChevronRight, Newspaper, ShoppingBag, UserCircle, Users } from 'lucide-react'
import SelectieOverzicht from './meer/SelectieOverzicht'
import MediaOverzicht from './meer/MediaOverzicht'
import Fanshop from './meer/Fanshop'
import MeldingenOverzicht from './meer/MeldingenOverzicht'
import JijProfiel from './meer/JijProfiel'
import { HUIDIG_PROFIEL_ID } from '../profiel'

const ONDERDELEN = [
  { id: 'selectie', Icon: Users, label: 'Selectie', Component: SelectieOverzicht },
  { id: 'media', Icon: Newspaper, label: 'Media & interviews', Component: MediaOverzicht },
  {
    id: 'fanshop',
    Icon: ShoppingBag,
    label: 'Fanshop',
    // fanshop.css gaat uit van een lichte pagina-achtergrond (donkere tekst,
    // geen eigen witte kaart) — deze wikkel geeft 'm die achtergrond, zonder
    // fanshop.css zelf aan te passen.
    Component: () => (
      <div className="fanshop-achtergrond">
        <Fanshop profileId={HUIDIG_PROFIEL_ID} />
      </div>
    ),
  },
  { id: 'meldingen', Icon: Bell, label: 'Meldingen', Component: MeldingenOverzicht },
  { id: 'jij', Icon: UserCircle, label: 'Jij / profiel', Component: JijProfiel },
]

export default function Meer() {
  const [actiefId, setActiefId] = useState(null)
  const actiefOnderdeel = ONDERDELEN.find((o) => o.id === actiefId)

  if (actiefOnderdeel) {
    const { Component } = actiefOnderdeel
    return (
      <div className="placeholder-page">
        <button type="button" className="meer-terug" onClick={() => setActiefId(null)}>
          <ArrowLeft strokeWidth={2} size={16} />
          Meer
        </button>
        <Component />
      </div>
    )
  }

  return (
    <div className="placeholder-page">
      <div className="section-heading">
        <span className="eyebrow">Overzicht</span>
        <h2>Meer</h2>
      </div>

      <div className="meer-list">
        {ONDERDELEN.map(({ id, Icon, label }) => (
          <button type="button" className="meer-list__item meer-list__item--klikbaar" key={id} onClick={() => setActiefId(id)}>
            <Icon strokeWidth={2} />
            <span>{label}</span>
            <ChevronRight strokeWidth={2} size={16} className="meer-list__pijl" />
          </button>
        ))}
      </div>
    </div>
  )
}
