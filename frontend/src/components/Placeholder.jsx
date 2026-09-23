// Herbruikbare lege-staat kaart voor tabs die deze stap nog niet gebouwd worden.
export default function Placeholder({ Icon, titel, tekst }) {
  return (
    <div className="placeholder-page">
      <div className="card placeholder-card">
        <span className="placeholder-card__icon">
          <Icon strokeWidth={2} />
        </span>
        <h2>{titel}</h2>
        <p>{tekst}</p>
      </div>
    </div>
  )
}
