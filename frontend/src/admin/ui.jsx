// Kleine bouwstenen voor de admin: kaarten, kerncijfers en de grafiekkleuren.
export const KLEUR = {
  rood: '#d81e1e',
  roodDiep: '#a6120c',
  roodLicht: '#f4b8b4',
  grijs: '#c9c2bb',
  donker: '#1b1717',
  groen: '#1f7a3f',
}

// Reeks kleuren voor taartdiagrammen: clubrood eerst, dan rustige tinten
export const REEKS = ['#d81e1e', '#1b1717', '#a6120c', '#8b8178', '#f08a83', '#c9c2bb']

export const getal = (n) => Math.round(n).toLocaleString('nl-NL')
export const euro = (n) => n.toLocaleString('nl-NL', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })
export const procent = (n) => `${n.toLocaleString('nl-NL', { maximumFractionDigits: 1 })}%`

export function Kaart({ titel, actie, children, className = '' }) {
  return (
    <section className={`adm-kaart ${className}`}>
      {(titel || actie) && (
        <header className="adm-kaart__kop">
          {titel && <h3>{titel}</h3>}
          {actie}
        </header>
      )}
      {children}
    </section>
  )
}

export function Kpi({ label, waarde, sub, accent }) {
  return (
    <div className={`adm-kpi${accent ? ' is-accent' : ''}`}>
      <span className="adm-kpi__label">{label}</span>
      <strong className="adm-kpi__waarde">{waarde}</strong>
      {sub && <span className="adm-kpi__sub">{sub}</span>}
    </div>
  )
}

// Paginakop binnen de admin
export function Kop({ titel, uitleg, children }) {
  return (
    <div className="adm-paginakop">
      <div>
        <h1>{titel}</h1>
        {uitleg && <p>{uitleg}</p>}
      </div>
      {children}
    </div>
  )
}

// Tooltip-stijl voor recharts, passend bij de admin
export const TOOLTIP = {
  contentStyle: { borderRadius: 10, border: '1px solid #e6e1dc', boxShadow: '0 8px 24px -12px rgba(40,10,10,.35)', fontSize: 13 },
  cursor: { fill: 'rgba(216,30,30,0.06)' },
}
