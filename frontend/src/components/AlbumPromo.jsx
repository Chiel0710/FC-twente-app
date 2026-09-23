// Klikbare knop naar het digitale plakboek — de afbeelding zelf bevat al
// alle tekst ("Plakboek / Bekijk je wedstrijdalbum / Spaar & Plak").
export default function AlbumPromo({ onKlik }) {
  return (
    <button type="button" className="album-promo" onClick={onKlik}>
      <img className="album-promo__beeld" src="/plakboek-tegel.png" alt="Bekijk je wedstrijdalbum" />
    </button>
  )
}
