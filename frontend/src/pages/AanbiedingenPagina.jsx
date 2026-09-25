import { useState } from 'react'
import PlaatjesTegel from '../components/PlaatjesTegel'
import QrSheet from '../components/QrSheet'
import { useTegels } from '../featureVolgorde'
import { dealCodeVoor } from '../profiel'
import { useDemoDb } from '../lib/demoDb'

// /aanbiedingen — de deals van de wedstrijd als plaatjes-tegels, in de volgorde
// van volgorde.aanbiedingen in public/home/tegels.json (ontwerp/aanbiedingen.png).
// Tegels met actie "toon-qr" openen onderin een QR-code om te laten scannen.
// Geen terugknop, zoals in het ontwerp: terug naar Home gaat via de onderbalk.
// Deals die de admin publiceert (Publiceren > Deals) komen erbij; deals die
// de admin uitzet, verdwijnen.

// Eigen deal uit de admin: het plaatje van een bestaande deal, of een effen tegel met de titel
function EigenDeal({ deal, afbeelding, onTik }) {
  return (
    <button type="button" className={`eigen-deal${afbeelding ? ' met-beeld' : ''}`} onClick={onTik} aria-label={deal.titel}>
      {afbeelding ? (
        <img src={afbeelding} alt="" />
      ) : (
        <span className="eigen-deal__tekst">
          <span className="eigen-deal__label">Deal</span>
          <strong>{deal.titel}</strong>
          {deal.omschrijving && <span>{deal.omschrijving}</span>}
          {deal.geldigTot && <small>Geldig t/m {new Date(deal.geldigTot).toLocaleDateString('nl-NL', { day: 'numeric', month: 'long' })}</small>}
        </span>
      )}
    </button>
  )
}

// Naam van de deal zoals op het QR-scherm; totAftrap = "een helft eerder"-deal
const DEALS = {
  'deal-broodje-beenham': { naam: '2+1 gratis broodje beenham' },
  'deal-twentsen-halven': { naam: 'Halve prijs: Twentsen halven, 0,5 L Grolsch', totAftrap: true },
}

export default function AanbiedingenPagina({ demo, demoActief }) {
  const tegels = useTegels()
  const w = useDemoDb()
  const [open, setOpen] = useState(null) // { id, naam, code } van de deal met open QR-scherm

  const uit = w.admin.deals.uit
  const volgorde = (tegels?.volgorde?.aanbiedingen ?? []).filter((id) => !uit.includes(id))
  const eigen = w.admin.deals.eigen.filter((d) => !uit.includes(d.id))
  const naamVan = (id) => DEALS[id]?.naam ?? eigen.find((d) => d.id === id)?.titel ?? id
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

      {tegels &&
        eigen.map((deal) => (
          <EigenDeal
            key={deal.id}
            deal={deal}
            afbeelding={tegels.tegels.find((t) => t.id === deal.afbeelding)?.afbeelding}
            onTik={() => setOpen({ id: deal.id, code: dealCodeVoor(deal.id) })}
          />
        ))}

      {open && (
        <QrSheet
          code={open.code}
          naam={naamVan(open.id)}
          // "een helft eerder": geldig tot de aftrap, daarna verlopen
          geldigheid={DEALS[open.id]?.totAftrap ? (fase && fase !== 'voor' ? 'verlopen' : 'tot-aftrap') : null}
          onSluit={() => setOpen(null)}
        />
      )}
    </div>
  )
}
