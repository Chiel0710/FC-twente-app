// "Sticker"-achtige spelerskaart (geen cirkel) met de echte foto uit de
// selectie. Vaste 3:4-verhouding met object-fit: cover, dus nooit vervormd.
// Ontbreekt de foto in de bron (foto === null), dan een neutrale plaat met
// het rugnummer — nooit een verzonnen of generieke foto.
export default function SpelerAvatar({ speler }) {
  return (
    <span className={`speler-avatar${speler.foto ? '' : ' speler-avatar--leeg'}`}>
      {speler.foto ? (
        <img src={speler.foto} alt={speler.naam} loading="lazy" />
      ) : (
        <span className="speler-avatar__nummer" aria-hidden="true">
          {speler.rugnummer}
        </span>
      )}
    </span>
  )
}
