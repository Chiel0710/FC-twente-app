// Herbruikbare percentage-balk voor voorspellingen, MOTM en polls.
export default function StemBalk({ label, percentage, actief }) {
  return (
    <div className={`stembalk${actief ? ' stembalk--actief' : ''}`}>
      <div className="stembalk__label">
        <span>{label}</span>
        <span>{percentage}%</span>
      </div>
      <div className="stembalk__track">
        <div className="stembalk__fill" style={{ width: `${percentage}%` }} />
      </div>
    </div>
  )
}
