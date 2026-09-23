import { useState } from 'react'

// Losse, speelse tegel op Home: ben je bij de volgende wedstrijd? Puur voor
// de sfeer (Twents "jao"/"neej") — geen backend-opslag, geen punten.
export default function BenJeErbijTegel() {
  const [keuze, setKeuze] = useState(null)

  return (
    <div className="ben-je-erbij">
      <div className="ben-je-erbij__overlay">
        {keuze === null && (
          <>
            <h3 className="ben-je-erbij__titel">Ben je erbij?</h3>
            <div className="ben-je-erbij__knoppen">
              <button type="button" className="ben-je-erbij__knop ben-je-erbij__knop--ja" onClick={() => setKeuze('ja')}>
                Jao
              </button>
              <button type="button" className="ben-je-erbij__knop ben-je-erbij__knop--nee" onClick={() => setKeuze('nee')}>
                Neej
              </button>
            </div>
          </>
        )}

        {keuze === 'ja' && <p className="ben-je-erbij__reactie">Mooi zo, tot dan!</p>}
        {keuze === 'nee' && <p className="ben-je-erbij__reactie">Jammer — volgende keer weer!</p>}
      </div>
    </div>
  )
}
