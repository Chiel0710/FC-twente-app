import { useEffect, useState } from 'react'
import { ArrowLeft, Bell, ChevronRight, Map as MapIcoon, MessageCircle, ShoppingBag, Sparkles, Users } from 'lucide-react'
import SelectieOverzicht from './meer/SelectieOverzicht'
import Fanshop from './meer/Fanshop'
import MeldingenOverzicht from './meer/MeldingenOverzicht'
import Plattegrond from './meer/Plattegrond'
import { HUIDIG_PROFIEL_ID } from '../profiel'
import { laadRossieVooraf } from '../rossieVooraf'
import { FEATURES } from '../featureVolgorde'
import { useNavigatie } from '../navigatie'

const ONDERDELEN = [
  // Bovenaan: hoe kom je bij je plek in De Grolsch Veste (route /plattegrond)
  { id: 'plattegrond', Icon: MapIcoon, label: 'Plattegrond', Component: Plattegrond },
  { id: 'selectie', Icon: Users, label: 'Selectie', Component: SelectieOverzicht },
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
  // Geen Component: Rossie opent als eigen scherm (/rossie), zie App.jsx
  { id: 'rossie', Icon: MessageCircle, label: 'Vraag aan Rossie!' },
  { id: 'meldingen', Icon: Bell, label: 'Meldingen', Component: MeldingenOverzicht },
  // "Jij / profiel" is vervallen: het profielmenu achter het poppetje rechtsboven neemt het over
]

// startOnderdeel: opent meteen een onderdeel (deeplink vanuit de app)
// startSpeler: rugnummer om in de selectie naartoe te scrollen (vanuit Nieuws)
// onOpenRossie: opent het chatscherm van Rossie
export default function Meer({ startOnderdeel = null, startSpeler = null, onOpenRossie }) {
  const [actiefId, setActiefId] = useState(startOnderdeel)
  const actiefOnderdeel = ONDERDELEN.find((o) => o.id === actiefId && o.Component)
  const { openFeature, kanOpenen } = useNavigatie()

  // Rossie's mondstanden alvast inladen zodra het menu in beeld is
  useEffect(() => {
    laadRossieVooraf()
  }, [])

  if (actiefOnderdeel) {
    const { Component } = actiefOnderdeel
    return (
      <div className="placeholder-page">
        <button type="button" className="meer-terug" onClick={() => setActiefId(null)}>
          <ArrowLeft strokeWidth={2} size={16} />
          Meer
        </button>
        <Component startSpeler={startSpeler} />
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
          <button type="button" className="meer-list__item meer-list__item--klikbaar" key={id} onClick={() => (id === 'rossie' ? onOpenRossie?.() : setActiefId(id))}>
            <Icon strokeWidth={2} />
            <span>{label}</span>
            <ChevronRight strokeWidth={2} size={16} className="meer-list__pijl" />
          </button>
        ))}
      </div>

      {/* Alle features uit data/features.json — ook die met relevantie 0 op
          Home blijven zo bereikbaar. Nog geen scherm = "Binnenkort". */}
      <div className="section-heading meer-alle">
        <span className="eyebrow">Alles in de app</span>
        <h2>Alle onderdelen</h2>
      </div>
      <div className="meer-list">
        {/* Alleen onderdelen met een eigen scherm; tegels zonder route (Waar te
            kijken, Ben je erbij?) horen alleen op Home en Tickets */}
        {FEATURES.filter((f) => f.route).map((f) => {
          const open = kanOpenen(f.route)
          return open ? (
            <button
              type="button"
              className="meer-list__item meer-list__item--klikbaar"
              key={f.id}
              onClick={() => openFeature(f.route)}
            >
              <Sparkles strokeWidth={2} />
              <span>{f.titel}</span>
              <ChevronRight strokeWidth={2} size={16} className="meer-list__pijl" />
            </button>
          ) : (
            <div className="meer-list__item meer-list__item--binnenkort" key={f.id} aria-disabled="true">
              <Sparkles strokeWidth={2} />
              <span>{f.titel}</span>
              <span className="meer-list__badge">Binnenkort</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
