import { useEffect, useState } from 'react'
import { Clock, Flag, Play, RotateCcw, Sunrise, UserX } from 'lucide-react'
import { berekenDemo, naarDagErna, naarEindstand, startNu, startPitch } from '../demoKlok'
import { reset, resetFan } from '../lib/demoDb'
import { Kaart, Kop } from './ui'

// /admin/demo — de bediening van de pitch-demo (FC Twente – PSV). Alles staat
// in de demoDb, dus de app in een ander tabblad of iframe volgt meteen mee.
const FASE_NAAM = { voor: 'Voor de wedstrijd', live: 'Live', rust: 'Rust', na: 'Eindstand', dagerna: 'De dag erna' }

export default function DemoBediening() {
  const [demo, setDemo] = useState(berekenDemo)
  const [melding, setMelding] = useState('')

  useEffect(() => {
    const t = setInterval(() => setDemo(berekenDemo()), 500)
    return () => clearInterval(t)
  }, [])

  function doe(actie, tekst) {
    actie()
    setDemo(berekenDemo())
    setMelding(tekst)
  }

  const knoppen = [
    { label: 'Voor de wedstrijd', uitleg: 'Afteller van 20 seconden, daarna begint de wedstrijd vanzelf', Icon: Clock, actie: () => startPitch(0), tekst: 'Afteller gestart.' },
    { label: 'Start de wedstrijd', uitleg: 'Meteen de aftrap', Icon: Play, actie: startNu, tekst: 'Wedstrijd gestart.', primair: true },
    { label: 'Naar eindstand', uitleg: 'Eindsignaal; highlights, stemmen en sticker volgen vanzelf', Icon: Flag, actie: naarEindstand, tekst: 'Naar de eindstand.' },
    { label: 'Naar dag erna', uitleg: 'Gewone dag, Fortuna – Twente op Home', Icon: Sunrise, actie: naarDagErna, tekst: 'Naar de dag erna.' },
    { label: 'Fan-acties wissen', uitleg: 'Stemmen, quiz, sticker, Ben je erbij, dealcodes, inbox', Icon: UserX, actie: resetFan, tekst: 'Wat fans deden is gewist; publicaties blijven staan.' },
  ]

  return (
    <>
      <Kop titel="Demo" uitleg="Bediening van de pitch. De app volgt meteen mee, ook in een ander tabblad." />
      <div className="adm-kpis">
        <div className="adm-kpi is-accent">
          <span className="adm-kpi__label">Fase nu</span>
          <strong className="adm-kpi__waarde">{FASE_NAAM[demo.fase] ?? demo.fase}</strong>
          <span className="adm-kpi__sub">
            {demo.fase === 'voor' && demo.restMs != null ? `aftrap over ${Math.ceil(demo.restMs / 1000)} s` : `${demo.stand.thuis}-${demo.stand.uit} · ${demo.minuut}'`}
          </span>
        </div>
      </div>
      <Kaart titel="Bediening">
        <div className="adm-demoknoppen">
          {knoppen.map(({ label, uitleg, Icon, actie, tekst, primair }) => (
            <button key={label} type="button" className={`adm-demoknop${primair ? ' is-primair' : ''}`} onClick={() => doe(actie, tekst)}>
              <Icon size={20} />
              <strong>{label}</strong>
              <span>{uitleg}</span>
            </button>
          ))}
          <button
            type="button"
            className="adm-demoknop is-reset"
            onClick={() => {
              if (window.confirm('Alles terug naar de startwaarden? Publicaties, bestellingen, agents en stemmen worden gewist.')) {
                doe(reset, 'Reset: alles staat weer op de startwaarden.')
              }
            }}
          >
            <RotateCcw size={20} />
            <strong>Reset</strong>
            <span>Alles terug naar de startwaarden</span>
          </button>
        </div>
        {melding && <p className="adm-ok" role="status">{melding}</p>}
      </Kaart>
    </>
  )
}
