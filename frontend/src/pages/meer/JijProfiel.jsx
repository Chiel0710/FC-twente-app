import { useEffect, useState } from 'react'
import { Check } from 'lucide-react'
import { getProfiles } from '../../api'
import { HUIDIG_PROFIEL_ID, setHuidigProfielId } from '../../profiel'

// Nederlandse labels voor de fantypes uit sectie 2 van de briefing.
const FANTYPE_LABEL = {
  hardekern: 'Harde kern',
  seizoenskaarthouder: 'Seizoenskaarthouder',
  gemiddeld: 'Gemiddelde supporter',
  losbezoek: 'Losse bezoeker',
  afstand: 'Volger op afstand',
  gezin: 'Gezin',
}

export default function JijProfiel() {
  const [profielen, setProfielen] = useState(undefined)

  useEffect(() => {
    let actief = true
    getProfiles().then((data) => {
      if (actief) setProfielen(data)
    })
    return () => {
      actief = false
    }
  }, [])

  const huidig = profielen?.find((p) => p.id === HUIDIG_PROFIEL_ID)

  return (
    <div className="meer-sub">
      <div className="section-heading">
        <span className="eyebrow">Jij</span>
        <h2>Profiel</h2>
      </div>

      <div className="card jij-huidig">
        <span className="eyebrow">Je kijkt nu als</span>
        <h3>{huidig?.naam ?? '...'}</h3>
        <span className="jij-huidig__fantype">
          {huidig ? (FANTYPE_LABEL[huidig.fantype] ?? huidig.fantype) : ''}
        </span>
      </div>

      <div className="section-heading">
        <span className="eyebrow">Demo-wissel</span>
        <h2>Wissel van fantype</h2>
      </div>

      {profielen === undefined && <div className="card">Profielen laden...</div>}

      {profielen && (
        <div className="jij-lijst">
          {profielen.map((profiel) => {
            const actief = profiel.id === HUIDIG_PROFIEL_ID
            return (
              <button
                type="button"
                key={profiel.id}
                className={`jij-profiel-rij${actief ? ' jij-profiel-rij--actief' : ''}`}
                onClick={() => !actief && setHuidigProfielId(profiel.id)}
                disabled={actief}
              >
                <div className="jij-profiel-rij__tekst">
                  <span className="jij-profiel-rij__naam">{profiel.naam}</span>
                  <span className="jij-profiel-rij__fantype">
                    {FANTYPE_LABEL[profiel.fantype] ?? profiel.fantype}
                  </span>
                </div>
                {actief && <Check strokeWidth={2.5} size={18} />}
              </button>
            )
          })}
        </div>
      )}

      <p className="jij-noot">
        Alleen ter demonstratie voor de jury — er is geen echt account of wachtwoord bij
        betrokken.
      </p>
    </div>
  )
}
