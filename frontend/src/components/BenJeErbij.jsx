import { useRef, useState } from 'react'
import { Check } from 'lucide-react'
import PlaatjesTegel from './PlaatjesTegel'
import { useTegels } from '../featureVolgorde'
import { useAanwezigheid } from '../profiel'
import { datumTekst } from '../wedstrijdTekst'

// "Ben je erbij?" op Tickets: het plaatje uit tegels.json met daarop twee
// onzichtbare ronde knoppen, precies over de groene en rode bol. Plek en
// grootte komen uit tikvlakken in tegels.json (x/y = middelpunt in % van de
// kaart, diameter in % van de kaartbreedte).
//  - groen (ja): aanwezigheid "ja", "Top, tot dan!" en een vinkje op de bol
//  - rood (nee): aanwezigheid "nee", melding, en soepel naar "Verkoop je kaart"
//    scrollen; die tegel licht kort op
// De gekozen bol blijft vol, de andere wordt gedimd; opnieuw tikken mag altijd.
const MELDING = {
  ja: 'Top, tot dan!',
  nee: 'Jammer! Verkoop je kaart zodat je stoel niet leeg blijft',
}

// demoActief: tijdens de demo is de wedstrijd "vandaag" (zoals op het kaartje)
export default function BenJeErbij({ wedstrijd, demoActief = false }) {
  const tegels = useTegels()
  const vlakken = tegels?.tegels?.find((t) => t.id === 'ben-je-erbij')?.tikvlakken ?? []
  const [antwoord, zetAntwoord] = useAanwezigheid(wedstrijd?.id ?? 'onbekend')
  const [melding, setMelding] = useState('')
  const timer = useRef(null)

  const wedstrijdNaam = wedstrijd ? `${wedstrijd.thuisTeam.name} – ${wedstrijd.uitTeam.name}` : 'de volgende wedstrijd'

  function kies(keuze) {
    zetAntwoord(keuze)
    setMelding(MELDING[keuze])
    if (keuze !== 'nee') return

    // Naar "Verkoop je kaart" (staat die niet op dit scherm, bv. bij Volger op
    // afstand, dan blijft het bij de melding)
    const verkoop = document.getElementById('tegel-verkoop-je-kaart')
    if (!verkoop) return
    const minderBeweging = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    verkoop.scrollIntoView({ behavior: minderBeweging ? 'auto' : 'smooth', block: 'center' })
    verkoop.classList.remove('is-oplichtend')
    // opnieuw starten van de animatie, ook bij twee keer snel op "nee"
    void verkoop.offsetWidth
    verkoop.classList.add('is-oplichtend')
    clearTimeout(timer.current)
    timer.current = setTimeout(() => verkoop.classList.remove('is-oplichtend'), 2200)
  }

  return (
    <div className="bje">
      <PlaatjesTegel id="ben-je-erbij" titel={`Ben je erbij bij ${wedstrijdNaam}?`} alsKnop={false}>
        {vlakken.map((v) => {
          const gekozen = antwoord === v.id
          return (
            <button
              key={v.id}
              type="button"
              className={`bje__bol bje__bol--${v.id}${gekozen ? ' is-gekozen' : ''}${antwoord && !gekozen ? ' is-gedimd' : ''}`}
              style={{ left: `${v.x}%`, top: `${v.y}%`, width: `${v.diameter}%` }}
              aria-pressed={gekozen}
              aria-label={v.id === 'ja' ? 'Ja, ik ben erbij' : 'Nee, ik ben er niet bij'}
              onClick={() => kies(v.id)}
            >
              {gekozen && v.id === 'ja' && <Check className="bje__vink" strokeWidth={3} aria-hidden="true" />}
            </button>
          )
        })}
      </PlaatjesTegel>

      <p className="bje__melding" role="status" aria-live="polite">
        {melding ||
          (antwoord === 'ja'
            ? 'Je bent erbij · tik op rood om te wijzigen'
            : antwoord === 'nee'
              ? 'Je bent er niet bij · tik op groen om te wijzigen'
              : '')}
      </p>
      {wedstrijd && (
        <p className="bje__over">
          Gaat over {wedstrijdNaam} · {demoActief ? 'vandaag' : datumTekst(wedstrijd)}
        </p>
      )}
    </div>
  )
}
