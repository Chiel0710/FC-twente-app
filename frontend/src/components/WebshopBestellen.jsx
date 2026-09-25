import { useState } from 'react'
import { Minus, Plus, ShoppingBag } from 'lucide-react'
import { bestel, useDemoDb } from '../lib/demoDb'
import { webshopStats } from '../lib/demoStats'

// Bestellen in de app (demo): de producten uit data/demo-database.json met
// voorraad per maat. Een bestelling haalt voorraad af; zakt een maat onder de
// drempel, dan maakt de Voorraad-agent in de admin een seintje. Er wordt
// niets echt besteld of betaald.
const euro = (n) => n.toLocaleString('nl-NL', { style: 'currency', currency: 'EUR' })

export default function WebshopBestellen({ profileId }) {
  useDemoDb() // voorraad live bijwerken
  const { producten } = webshopStats()
  const [productId, setProductId] = useState(producten[0].id)
  const product = producten.find((p) => p.id === productId)
  const maten = Object.keys(product.voorraad)
  const [maat, setMaat] = useState(maten[Math.min(1, maten.length - 1)])
  const [aantal, setAantal] = useState(1)
  const [bevestiging, setBevestiging] = useState(null)

  const geldigeMaat = maten.includes(maat) ? maat : maten[0]
  const over = product.voorraadNu[geldigeMaat]

  function kiesProduct(id) {
    setProductId(id)
    setAantal(1)
    setBevestiging(null)
  }

  function bestelNu() {
    bestel(profileId, product.id, geldigeMaat, aantal)
    setBevestiging(`${aantal}× ${product.naam} (maat ${geldigeMaat}) besteld — ${euro(aantal * product.prijs)}.`)
    setAantal(1)
  }

  return (
    <section className="bestel" aria-labelledby="bestel-kop">
      <div className="bestel-kop">
        <ShoppingBag size={20} strokeWidth={2.2} aria-hidden="true" />
        <h2 id="bestel-kop">Bestel in de app</h2>
        <span className="bestel-demo">Demo</span>
      </div>

      <div className="bestel-producten" role="radiogroup" aria-label="Product">
        {producten.map((p) => (
          <button
            key={p.id}
            type="button"
            role="radio"
            aria-checked={p.id === productId}
            className={`bestel-product${p.id === productId ? ' aan' : ''}`}
            onClick={() => kiesProduct(p.id)}
          >
            <strong>{p.naam}</strong>
            <span>{euro(p.prijs)}</span>
          </button>
        ))}
      </div>

      <div className="bestel-maten" role="radiogroup" aria-label="Maat">
        {maten.map((m) => (
          <button
            key={m}
            type="button"
            role="radio"
            aria-checked={m === geldigeMaat}
            className={`bestel-maat${m === geldigeMaat ? ' aan' : ''}`}
            onClick={() => setMaat(m)}
            disabled={product.voorraadNu[m] <= 0}
          >
            {m}
          </button>
        ))}
      </div>

      <div className="bestel-rij">
        <div className="bestel-aantal">
          <button type="button" onClick={() => setAantal((a) => Math.max(1, a - 1))} disabled={aantal <= 1} aria-label="Minder">
            <Minus size={16} strokeWidth={2.6} />
          </button>
          <output aria-live="polite">{aantal}</output>
          <button type="button" onClick={() => setAantal((a) => Math.min(over, a + 1))} disabled={aantal >= over} aria-label="Meer">
            <Plus size={16} strokeWidth={2.6} />
          </button>
        </div>
        <button type="button" className="bestel-knop" onClick={bestelNu} disabled={over <= 0}>
          Bestellen · {euro(aantal * product.prijs)}
        </button>
      </div>

      <p className={`bestel-voorraad${over < product.drempel ? ' laag' : ''}`}>
        {over > 0 ? `Nog ${over} op voorraad in maat ${geldigeMaat}` : `Maat ${geldigeMaat} is uitverkocht`}
      </p>
      {bevestiging && (
        <p className="bestel-bevestiging" role="status">
          {bevestiging}
        </p>
      )}
    </section>
  )
}
