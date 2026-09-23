// "Sticker"-achtige spelerskaart (geen cirkel) met de echte foto uit de
// selectie. Ontbreekt de foto in de bron (fotoUrl === null), dan een
// streepje — nooit een verzonnen of generieke foto.
export default function SpelerAvatar({ speler }) {
  return (
    <span className="speler-avatar">
      {speler.fotoUrl ? (
        <img src={speler.fotoUrl} alt={speler.naam} />
      ) : (
        <span className="speler-avatar__streepje" aria-hidden="true">–</span>
      )}
    </span>
  )
}
