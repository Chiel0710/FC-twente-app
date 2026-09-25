import { useState } from 'react'
import PlaatjesTegel from '../components/PlaatjesTegel'
import QrSheet from '../components/QrSheet'
import { useTegels } from '../featureVolgorde'
import { dealCodeVoor } from '../profiel'

// /aanbiedingen — de deals van de wedstrijd als plaatjes-tegels, in de volgorde
// van volgorde.aanbiedingen in public/home/tegels.json (ontwerp/aanbiedingen.png).
// Tegels met actie "toon-qr" openen onderin een QR-code om te laten scannen.
// Geen terugknop, zoals in het ontwerp: terug naar Home gaat via de onderbalk.

// Naam van de deal zoals op het QR-scherm; totAftrap = "een helft eerder"-deal
const DEALS = {
  'deal-broodje-beenham': { naam: '2+1 gratis broodje beenham' },
  'deal-twentsen-halven': { naam: 'Halve prijs: Twentsen halven, 0,5 L Grolsch', totAftrap: true },
}

export default function AanbiedingenPagina({ demo, demoActief }) {
  const tegels = useTegels()
  const [open, setOpen] = useState(null) // { id, code } van de deal met open QR-scherm

  const volgorde = tegels?.volgorde?.aanbiedingen ?? []
  const fase = demoActief ? demo?.fase : null

  return (
    <div className="aanbiedingen">
      {volgorde.map((id) => {
        const tegel = tegels.tegels.find((t) => t.id === id)
        if (!tegel) return null
        return (
          <PlaatjesTegel
            key={id}
            id={id}
            titel={DEALS[id]?.naam ?? tegel.omschrijving}
            // code bij de tik ophalen of maken (niet tijdens het renderen: hij wordt bewaard)
            onTik={tegel.actie === 'toon-qr' ? () => setOpen({ id, code: dealCodeVoor(id) }) : undefined}
          />
        )
      })}

      {open && (
        <QrSheet
          code={open.code}
          naam={DEALS[open.id]?.naam ?? open.id}
          // "een helft eerder": geldig tot de aftrap, daarna verlopen
          geldigheid={DEALS[open.id]?.totAftrap ? (fase && fase !== 'voor' ? 'verlopen' : 'tot-aftrap') : null}
          onSluit={() => setOpen(null)}
        />
      )}
    </div>
  )
}
