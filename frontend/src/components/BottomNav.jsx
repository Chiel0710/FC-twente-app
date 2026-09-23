import { CalendarDays, Flame, Home, Menu, Ticket } from 'lucide-react'

// De 5 vaste tabs uit de briefing. "Flame" voor Fan verwijst bewust naar de
// vlam in het clubwapen — geen willekeurig icoon.
const TABS = [
  { id: 'home', label: 'Home', Icon: Home },
  { id: 'wedstrijden', label: 'Wedstrijden', Icon: CalendarDays },
  { id: 'fan', label: 'Fan', Icon: Flame },
  { id: 'tickets', label: 'Tickets', Icon: Ticket },
  { id: 'meer', label: 'Meer', Icon: Menu },
]

export default function BottomNav({ actief, onWissel }) {
  return (
    <nav className="bottom-nav" aria-label="Hoofdnavigatie">
      {TABS.map(({ id, label, Icon }) => (
        <button
          key={id}
          type="button"
          className={`bottom-nav__item${actief === id ? ' bottom-nav__item--active' : ''}`}
          aria-current={actief === id ? 'page' : undefined}
          onClick={() => onWissel(id)}
        >
          <Icon strokeWidth={2} />
          <span>{label}</span>
        </button>
      ))}
    </nav>
  )
}
