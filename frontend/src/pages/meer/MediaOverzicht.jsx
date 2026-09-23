import { Camera, Mic, Video } from 'lucide-react'

// Bewust generieke placeholders (geen clubfoto's, geen verzonnen content) —
// dit onderdeel wacht op een echte media-bron.
const CATEGORIEEN = [
  { Icon: Video, label: 'Video-interviews' },
  { Icon: Camera, label: "Foto's" },
  { Icon: Mic, label: 'Podcast' },
]

export default function MediaOverzicht() {
  return (
    <div className="meer-sub">
      <div className="section-heading">
        <span className="eyebrow">Terugkijken & lezen</span>
        <h2>Media & interviews</h2>
      </div>

      <div className="media-raster">
        {CATEGORIEEN.map(({ Icon, label }) => (
          <div className="media-tegel" key={label}>
            <img src="https://placehold.co/400x300?text=FC+Twente" alt="" />
            <div className="media-tegel__label">
              <Icon strokeWidth={2} size={16} />
              <span>{label}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="card">
        <p className="admin-kaart__uitleg">
          Hier komt straks echte media — interviews, foto's en podcastafleveringen. Binnenkort
          beschikbaar.
        </p>
      </div>
    </div>
  )
}
