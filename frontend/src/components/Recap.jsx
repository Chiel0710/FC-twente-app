import { useEffect, useState } from 'react'
import { X } from 'lucide-react'

// "Twente in 60 seconden" — de wedstrijd als story: intro, elk doelpunt,
// eindstand. Alle inhoud komt uit de demo-state (dus uit
// wedstrijd-details-2026-2027.json via de server); hier wordt niets verzonnen.
const DUUR_MS = 60_000
const TWENTE = 'FC Twente'

const datumFormat = new Intl.DateTimeFormat('nl-NL', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
})

// "1-0" uit de server -> "1 – 0" op het scherm
const toonStand = (stand) => stand.replace('-', ' – ')

function uitslagWoord(wedstrijd, stand) {
  const twenteThuis = wedstrijd.thuis === TWENTE
  const wij = twenteThuis ? stand.thuis : stand.uit
  const zij = twenteThuis ? stand.uit : stand.thuis
  if (wij > zij) return 'Gewonnen'
  if (wij < zij) return 'Verloren'
  return 'Gelijkgespeeld'
}

export default function Recap({ state, onSluit }) {
  const { wedstrijd, stand, gebeurtenissen } = state
  const dias = [
    { soort: 'intro' },
    ...gebeurtenissen.map((g) => ({ soort: 'doelpunt', ...g })),
    { soort: 'eind' },
  ]
  const diaDuur = DUUR_MS / dias.length
  const [index, setIndex] = useState(0)
  const laatste = dias.length - 1

  // Automatisch door naar de volgende dia; op de laatste blijft hij staan.
  useEffect(() => {
    if (index >= laatste) return
    const t = setTimeout(() => setIndex((i) => i + 1), diaDuur)
    return () => clearTimeout(t)
  }, [index, laatste, diaDuur])

  // Esc sluit, pijltjes bladeren
  useEffect(() => {
    const toets = (e) => {
      if (e.key === 'Escape') onSluit()
      if (e.key === 'ArrowRight') setIndex((i) => Math.min(i + 1, laatste))
      if (e.key === 'ArrowLeft') setIndex((i) => Math.max(i - 1, 0))
    }
    window.addEventListener('keydown', toets)
    return () => window.removeEventListener('keydown', toets)
  }, [onSluit, laatste])

  const dia = dias[index]
  const voorOns = dia.soort === 'doelpunt' && dia.team === TWENTE

  return (
    <div className="recap" role="dialog" aria-modal="true" aria-label="Twente in 60 seconden">
      <div className="recap__balken" aria-hidden="true">
        {dias.map((_, i) => (
          <span className="recap__balk" key={i}>
            <span
              // key met index: bij elke nieuwe dia start de vul-animatie opnieuw
              key={i === index ? `bezig-${index}` : i}
              className={`recap__vulling${i < index ? ' is-klaar' : ''}${i === index ? ' is-bezig' : ''}`}
              style={{ '--dia-duur': `${diaDuur}ms` }}
            />
          </span>
        ))}
      </div>

      <button type="button" className="recap__sluit" onClick={onSluit} aria-label="Recap sluiten" autoFocus>
        <X strokeWidth={2.2} size={22} />
      </button>

      {/* Tikzones zoals in een story: links terug, rechts verder */}
      <div className="recap__tik">
        <button type="button" aria-label="Vorige" onClick={() => setIndex((i) => Math.max(i - 1, 0))} />
        <button type="button" aria-label="Volgende" onClick={() => setIndex((i) => Math.min(i + 1, laatste))} />
      </div>

      <section
        key={index}
        className={`recap__dia recap__dia--${dia.soort}${dia.soort === 'doelpunt' ? (voorOns ? ' is-ons' : ' is-tegen') : ''}`}
        aria-live="polite"
      >
        {dia.soort === 'intro' && (
          <>
            <p className="recap__eyebrow">Twente in 60 seconden</p>
            <h2 className="recap__kop">
              {wedstrijd.thuis}
              <span> – </span>
              {wedstrijd.uit}
            </h2>
            <p className="recap__sub">{datumFormat.format(new Date(`${wedstrijd.datum}T12:00:00`))}</p>
          </>
        )}

        {dia.soort === 'doelpunt' && (
          <>
            <p className="recap__minuut">{dia.minuut}'</p>
            <p className="recap__eyebrow">Doelpunt {dia.team}</p>
            <h2 className="recap__kop">{dia.speler}</h2>
            <p className="recap__stand">{toonStand(dia.stand)}</p>
          </>
        )}

        {dia.soort === 'eind' && (
          <>
            <p className="recap__eyebrow">Eindstand</p>
            <p className="recap__eindstand">
              {stand.thuis}
              <span>–</span>
              {stand.uit}
            </p>
            <h2 className="recap__kop">{uitslagWoord(wedstrijd, stand)}</h2>
            <p className="recap__sub">
              {wedstrijd.thuis} – {wedstrijd.uit}
            </p>
          </>
        )}
      </section>
    </div>
  )
}
