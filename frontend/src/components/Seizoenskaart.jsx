// Voorkant van de seizoenskaart — vult de hele .flip-zij (100% breed/hoog).
// Geen eigen marge, rotatie of schaduw meer: die staan nu op .flip-scene
// in flipkaart.css, zodat voor- én achterkant precies even groot mee draaien.
export default function Seizoenskaart() {
  return (
    <img
      src="/seizoenskaart.png"
      alt="FC Twente seizoenskaart"
      style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
    />
  )
}
