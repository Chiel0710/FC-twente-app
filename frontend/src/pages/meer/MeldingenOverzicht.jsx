import { useEffect, useState } from 'react'

// Instelbaar per categorie, zoals de briefing vraagt — gesimuleerd (alleen
// lokaal opgeslagen), geen echte pushmeldingen.
const OPSLAGSLEUTEL = 'fctwente_meldingen'

const CATEGORIEEN = [
  { id: 'wedstrijddag', label: 'Wedstrijddag', uitleg: 'Opstelling, aftrap en de uitslag' },
  { id: 'nieuws', label: 'Nieuws', uitleg: 'Nieuwe artikelen van de club' },
  { id: 'fan', label: 'Voorspellen & polls', uitleg: 'Nieuwe poll, quiz of Man of the Match' },
  { id: 'tickets', label: 'Tickets', uitleg: 'Verkoop losse kaarten gestart' },
]

function leesInstellingen() {
  try {
    const opgeslagen = JSON.parse(localStorage.getItem(OPSLAGSLEUTEL) ?? '{}')
    return { wedstrijddag: true, nieuws: true, fan: false, tickets: true, ...opgeslagen }
  } catch {
    return { wedstrijddag: true, nieuws: true, fan: false, tickets: true }
  }
}

export default function MeldingenOverzicht() {
  const [instellingen, setInstellingen] = useState(leesInstellingen)

  useEffect(() => {
    try {
      localStorage.setItem(OPSLAGSLEUTEL, JSON.stringify(instellingen))
    } catch {
      // localStorage niet beschikbaar — instelling blijft dan alleen in deze sessie staan
    }
  }, [instellingen])

  function wissel(id) {
    setInstellingen((huidig) => ({ ...huidig, [id]: !huidig[id] }))
  }

  return (
    <div className="meer-sub">
      <div className="section-heading">
        <span className="eyebrow">Instellingen</span>
        <h2>Meldingen</h2>
      </div>

      <div className="card">
        <p className="admin-kaart__uitleg" style={{ marginBottom: 'var(--sp-3)' }}>
          Gesimuleerd — er worden geen echte pushmeldingen verstuurd, je voorkeuren blijven op dit
          toestel bewaard.
        </p>

        <div className="meldingen-lijst">
          {CATEGORIEEN.map(({ id, label, uitleg }) => (
            <div className="meldingen-rij" key={id}>
              <div className="meldingen-rij__tekst">
                <span className="meldingen-rij__label">{label}</span>
                <span className="meldingen-rij__uitleg">{uitleg}</span>
              </div>
              <button
                type="button"
                className={`meldingen-toggle${instellingen[id] ? ' meldingen-toggle--aan' : ''}`}
                role="switch"
                aria-checked={instellingen[id]}
                aria-label={label}
                onClick={() => wissel(id)}
              >
                <span className="meldingen-toggle__bol" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
