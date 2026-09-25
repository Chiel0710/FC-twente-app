import { CircleUserRound, Mail } from 'lucide-react'
import { useLogoTik } from './LiveDemo'
import { HUIDIGE_PERSONA, IS_BEZOEKER } from '../profiel'

// Kopbalk, vast bovenaan (gedeeld door alle schermen): links de envelop naar
// de berichten (met rood bolletje bij ongelezen), in het midden het clublogo
// dat onder de balk uitsteekt, rechts het profielmenu.
// Eén tik op het logo gaat in de demo door naar de dag erna.
export default function Kopbalk({ fase, ongelezen, inboxOpen, onInbox, profielOpen, onProfiel }) {
  const logoTik = useLogoTik(fase)

  return (
    <header className="kopbalk">
      <button
        type="button"
        className="kopbalk__knop"
        onClick={onInbox}
        aria-label={ongelezen ? 'Berichten, nieuw bericht' : 'Berichten'}
        aria-expanded={inboxOpen}
      >
        <Mail strokeWidth={1.8} />
        {ongelezen && <span className="kopbalk__bolletje" aria-hidden="true" />}
      </button>

      {/* Geen zichtbare knopfunctie voor het publiek; wel tikbaar voor de demo */}
      <button type="button" className="kopbalk__logo" onClick={logoTik} aria-label="FC Twente">
        <img src="/logo.png" alt="" />
      </button>

      <button
        type="button"
        className={`kopbalk__knop kopbalk__knop--profiel${IS_BEZOEKER ? '' : ' is-ingelogd'}`}
        onClick={onProfiel}
        aria-label={`Profielmenu, je bent nu ${HUIDIGE_PERSONA.naam}`}
        aria-expanded={profielOpen}
      >
        {/* Bezoeker = het poppetje; ingelogd als persona = de eerste letter */}
        {IS_BEZOEKER ? <CircleUserRound strokeWidth={1.8} /> : <span>{HUIDIGE_PERSONA.naam[0]}</span>}
      </button>
    </header>
  )
}
