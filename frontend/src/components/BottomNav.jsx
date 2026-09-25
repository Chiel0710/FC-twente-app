import { CreditCard, Ellipsis, House } from 'lucide-react'

// Onderbalk volgens het ontwerp: Home, Wedstrijden (veld), in het midden een
// grotere voetbal naar het Fan-gedeelte (Rossie met de vijf ballen), Tickets
// (kaart) en Meer (puntjes). De tabnavigatie zelf is ongewijzigd: onWissel(tabId).

// Veld-icoon (bovenaanzicht van een voetbalveld), zelfde lijndikte als lucide
function VeldIcoon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" {...props}>
      <rect x="5" y="2.5" width="14" height="19" rx="1" />
      <line x1="5" y1="12" x2="19" y2="12" />
      <circle cx="12" cy="12" r="2.6" />
      <path d="M9 2.5v3h6v-3M9 21.5v-3h6v3" />
    </svg>
  )
}

// Voetbal: vijfhoek in het midden met naden naar de rand
function BalIcoon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" {...props}>
      <circle cx="12" cy="12" r="10" />
      <path d="M12 7.6l4.2 3-1.6 4.9H9.4L7.8 10.6z" fill="currentColor" />
      <path d="M12 7.6V2.2M16.2 10.6l5-1.6M14.6 15.5l3 4.3M9.4 15.5l-3 4.3M7.8 10.6l-5-1.6" />
    </svg>
  )
}

const ITEMS = [
  { id: 'home', label: 'Home', Icon: House },
  { id: 'wedstrijden', label: 'Wedstrijden', Icon: VeldIcoon },
  { id: 'bal', naar: 'fan', label: 'Fan', Icon: BalIcoon, groot: true },
  { id: 'tickets', label: 'Tickets', Icon: CreditCard },
  { id: 'meer', label: 'Meer', Icon: Ellipsis },
]

export default function BottomNav({ actief, onWissel }) {
  return (
    <nav className="onderbalk" aria-label="Hoofdnavigatie">
      {ITEMS.map(({ id, naar, label, Icon, groot }) => {
        const tab = naar ?? id
        const isActief = actief === tab
        return (
          <button
            key={id}
            type="button"
            className={`onderbalk__knop${groot ? ' onderbalk__knop--bal' : ''}${isActief ? ' is-actief' : ''}`}
            aria-label={label}
            aria-current={isActief ? 'page' : undefined}
            onClick={() => onWissel(tab)}
          >
            <Icon className="onderbalk__icoon" aria-hidden="true" />
          </button>
        )
      })}
    </nav>
  )
}
