import { useState } from 'react'
import { Apple, Check, LogOut, Mail, UserRound, X } from 'lucide-react'
import { HUIDIGE_PERSONA, IS_BEZOEKER, PERSONAS, kiesPersona } from '../profiel'

// Profielmenu achter het poppetje rechtsboven. Er is bewust geen echte inlog:
// de app is altijd te openen als bezoeker. De inlogknoppen zien er echt uit,
// maar doen in deze demo niets. Onder "Log in als fan (demo)" kies je een
// persona; de app herlaadt dan en past zich aan (naam, fantype, kaart, tegels).
const INLOGGEN = [
  { id: 'email', label: 'Inloggen met e-mail', Icon: Mail },
  { id: 'google', label: 'Inloggen met Google', Icon: null, letter: 'G' },
  { id: 'apple', label: 'Inloggen met Apple', Icon: Apple },
]

export default function ProfielMenu({ onSluit }) {
  const [melding, setMelding] = useState('')
  const fans = PERSONAS.filter((p) => p.id !== 'bezoeker')

  function kies(id) {
    if (id === HUIDIGE_PERSONA.id) return onSluit()
    kiesPersona(id)
  }

  return (
    <div className="profiel-laag" onClick={onSluit}>
      <section
        className="profiel-paneel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="profiel-kop"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="profiel-paneel__kop">
          <span className="profiel-paneel__avatar" aria-hidden="true">
            {IS_BEZOEKER ? <UserRound size={22} strokeWidth={2} /> : HUIDIGE_PERSONA.naam[0]}
          </span>
          <div className="profiel-paneel__wie">
            <span className="profiel-paneel__label">Je bent nu</span>
            <h2 id="profiel-kop">{HUIDIGE_PERSONA.naam}</h2>
            <span className="profiel-paneel__sub">
              {HUIDIGE_PERSONA.omschrijving}
              {HUIDIGE_PERSONA.woonplaats && ` · ${HUIDIGE_PERSONA.woonplaats}`}
            </span>
          </div>
          <button type="button" className="profiel-paneel__sluit" onClick={onSluit} aria-label="Sluiten" autoFocus>
            <X size={20} strokeWidth={2.2} />
          </button>
        </header>

        {!IS_BEZOEKER && (
          <button type="button" className="profiel-knop profiel-knop--uitloggen" onClick={() => kiesPersona('bezoeker')}>
            <LogOut size={18} strokeWidth={2} />
            Uitloggen
          </button>
        )}

        <button
          type="button"
          className="profiel-knop profiel-knop--bezoeker"
          aria-pressed={IS_BEZOEKER}
          onClick={() => kies('bezoeker')}
        >
          <UserRound size={18} strokeWidth={2} />
          Doorgaan als bezoeker
          {IS_BEZOEKER && <Check size={18} strokeWidth={2.4} className="profiel-knop__vink" />}
        </button>

        <div className="profiel-inloggen">
          {INLOGGEN.map(({ id, label, Icon, letter }) => (
            <button
              key={id}
              type="button"
              className={`profiel-knop profiel-knop--inlog profiel-knop--${id}`}
              onClick={() => setMelding('In deze demo niet actief')}
            >
              {Icon ? <Icon size={18} strokeWidth={2} /> : <span className="profiel-knop__letter" aria-hidden="true">{letter}</span>}
              {label}
            </button>
          ))}
          <p className="profiel-melding" role="status">
            {melding}
          </p>
        </div>

        <h3 className="profiel-paneel__kopje">Log in als fan (demo)</h3>
        <ul className="persona-lijst">
          {fans.map((p) => {
            const actief = p.id === HUIDIGE_PERSONA.id
            return (
              <li key={p.id}>
                <button type="button" className="persona-knop" aria-pressed={actief} onClick={() => kies(p.id)}>
                  <span className="persona-knop__avatar" aria-hidden="true">{p.naam[0]}</span>
                  <span className="persona-knop__tekst">
                    <strong>{p.naam}</strong>
                    <span>
                      {p.omschrijving}
                      {p.woonplaats && ` · ${p.woonplaats}`}
                    </span>
                  </span>
                  {actief && <Check size={18} strokeWidth={2.4} className="persona-knop__vink" />}
                </button>
              </li>
            )
          })}
        </ul>
      </section>
    </div>
  )
}
