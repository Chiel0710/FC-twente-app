import { useState } from 'react'
import { AlertTriangle, CheckCircle2, Info } from 'lucide-react'
import { alleAgents, handelAgentAf, publiceerWeetje, useDemoDb } from '../lib/demoDb'
import { Kop } from './ui'

// Agents: seintjes van de "agents" (startwaarden + live uit de app). Elk
// seintje heeft een niveau en soms een actie. Live ontstaan er nieuwe:
// voorraad onder de drempel (bestellingen) en een aangeboden kaart.
const NIVEAU = {
  info: { Icon: Info, label: 'Info' },
  waarschuwing: { Icon: AlertTriangle, label: 'Waarschuwing' },
  succes: { Icon: CheckCircle2, label: 'Succes' },
}

const tijdTekst = (iso) =>
  new Date(iso).toLocaleString('nl-NL', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })

// Het weetje staat tussen enkele aanhalingstekens in het bericht
const weetjeUit = (bericht) => bericht.match(/'(.+)'/)?.[1] ?? bericht

export default function Agents({ ga }) {
  const w = useDemoDb()
  const agents = alleAgents(w)
  const [bevestiging, setBevestiging] = useState({})

  function doe(a) {
    let tekst = 'Afgehandeld.'
    if (a.actie === 'Bijbestellen') tekst = `Voorraad aangevuld (+50${a.doel ? ` in maat ${a.doel.maat}` : ''}).`
    if (a.actie === 'Publiceren') {
      publiceerWeetje(weetjeUit(a.bericht))
      tekst = 'Weetje gepubliceerd: staat nu in het Weetje-schermpje van de Fan-tab.'
    }
    if (a.actie === 'Toepassen') tekst = 'Toegepast: Waar te kijken staat voor volgers op afstand al bovenaan Home.'
    handelAgentAf(a.id)
    setBevestiging((b) => ({ ...b, [a.id]: tekst }))
    if (a.actie === 'Bekijk concepten') ga('publiceren/nieuws')
  }

  return (
    <>
      <Kop titel="Agents" uitleg="Seintjes van de agents die de data in de gaten houden. Nieuwe seintjes ontstaan live uit wat fans in de app doen." />
      <ol className="adm-tijdlijn">
        {agents.map((a) => {
          const { Icon, label } = NIVEAU[a.niveau] ?? NIVEAU.info
          return (
            <li key={a.id} className={`adm-seintje is-${a.niveau}${a.afgehandeld ? ' is-klaar' : ''}`}>
              <span className="adm-seintje__icoon" aria-label={label}>
                <Icon size={16} strokeWidth={2.4} />
              </span>
              <div className="adm-seintje__inhoud">
                <div className="adm-seintje__kop">
                  <strong>{a.agent}</strong>
                  <time dateTime={a.tijd}>{tijdTekst(a.tijd)}</time>
                  {a.id.startsWith('agent-') && <span className="adm-tag is-rood">Live</span>}
                </div>
                <p>{a.bericht}</p>
                {bevestiging[a.id] && <p className="adm-ok" role="status">{bevestiging[a.id]}</p>}
              </div>
              <div className="adm-seintje__actie">
                {a.actie && !a.afgehandeld && (
                  <button type="button" className="adm-knop adm-knop--primair" onClick={() => doe(a)}>
                    {a.actie}
                  </button>
                )}
                {a.actie && a.afgehandeld && <span className="adm-tag">Afgehandeld</span>}
              </div>
            </li>
          )
        })}
      </ol>
    </>
  )
}
