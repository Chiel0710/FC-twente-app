import { ArrowLeft, BarChart3, Tag } from 'lucide-react'

// Eenvoudige pagina voor tegels waarvan het scherm nog niet bestaat
// (/aanbiedingen, /analyse). Zegt wat er komt, zodat de tik niet "dood" voelt.
const PAGINAS = {
  aanbiedingen: {
    Icon: Tag,
    eyebrow: 'Rond de wedstrijd',
    titel: 'Aanbiedingen',
    tekst: 'Hier vind je straks de deals van de wedstrijddag, zoals eten en drinken in het stadion.',
  },
  analyse: {
    Icon: BarChart3,
    eyebrow: 'Terugkijken',
    titel: 'Wedstrijdanalyse',
    tekst: 'Hier komt straks de analyse van gespeelde wedstrijden: doelpunten, kansen en de belangrijkste momenten.',
  },
}

export default function BinnenkortPagina({ soort, onTerug }) {
  const { Icon, eyebrow, titel, tekst } = PAGINAS[soort]

  return (
    <div className="subpagina">
      <button type="button" className="meer-terug" onClick={onTerug}>
        <ArrowLeft strokeWidth={2} size={16} />
        Home
      </button>
      <div className="section-heading">
        <span className="eyebrow">{eyebrow}</span>
        <h2>{titel}</h2>
      </div>
      <div className="card binnenkort-kaart">
        <span className="binnenkort-kaart__icoon" aria-hidden="true">
          <Icon strokeWidth={2} />
        </span>
        <h3>Binnenkort</h3>
        <p>{tekst}</p>
      </div>
    </div>
  )
}
