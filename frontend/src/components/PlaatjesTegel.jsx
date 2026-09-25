import { useEffect, useRef, useState } from 'react'
import { useTegels } from '../featureVolgorde'

// Eén plaatjes-tegel uit public/home/tegels.json. Alle maten komen uit dat
// bestand, nooit uit losse CSS per tegel:
//  - de container heeft aspect-ratio = kaartVerhouding (dat is de kaart zelf)
//  - het plaatje staat absolute met width/left/top uit img{} in procenten,
//    zodat de kaart in het plaatje precies op de container valt
//  - popOut: het figuur steekt bewust buiten de kaart; de tegel krijgt boven
//    (en onder) ruimte voor steektUit en wordt nooit afgesneden
//  - klikbaar: hele tegel tikbaar met een lichte indruk; anders geen animatie
//
// props: id (uit tegels.json), titel (voor schermlezers), label (klein rood
// label, bv. "Stemmen open"), onTik, binnenkort (kort "Binnenkort" tonen),
// alsKnop (false = tegel zelf is geen knop, bv. omdat er knoppen óp liggen),
// children (iets óver het plaatje, bv. tikvlakken; valt precies op de kaart).
// De tegel krijgt id="tegel-<id>", zodat je er naartoe kunt scrollen.
// Geen schuif-animatie bij prefers-reduced-motion of zonder IntersectionObserver
const STATISCH =
  typeof window === 'undefined' ||
  window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ||
  !('IntersectionObserver' in window)

export default function PlaatjesTegel({ id, titel, label, onTik, binnenkort, alsKnop = true, children }) {
  const tegels = useTegels()
  const tegel = tegels?.tegels?.find((t) => t.id === id)
  const ref = useRef(null)
  const [inBeeld, setInBeeld] = useState(false)

  // Uitstekend figuur schuift een paar pixels omhoog zodra de tegel in beeld
  // komt (niet bij prefers-reduced-motion: dan staat het meteen goed)
  useEffect(() => {
    if (!tegel?.popOut || !ref.current || STATISCH) return
    const waarnemer = new IntersectionObserver(
      ([item]) => {
        if (item.isIntersecting) {
          setInBeeld(true)
          waarnemer.disconnect()
        }
      },
      { threshold: 0.35 },
    )
    waarnemer.observe(ref.current)
    return () => waarnemer.disconnect()
  }, [tegel])

  if (!tegel) return null

  const stijl = {
    '--verhouding': tegel.kaartVerhouding,
    '--boven': tegel.steektUit?.boven ?? 0,
    '--onder': tegel.steektUit?.onder ?? 0,
  }
  const klassen = [
    'plaatjes-tegel',
    `plaatjes-tegel--${tegel.vorm}`,
    tegel.popOut ? 'is-popout' : '',
    tegel.popOut && (inBeeld || STATISCH) ? 'is-in-beeld' : '',
    tegel.klikbaar ? 'is-klikbaar' : '',
  ]
    .filter(Boolean)
    .join(' ')

  const inhoud = (
    <span className="plaatjes-tegel__kaart">
      {tegel.type === 'video' ? (
        <VideoBeeld tegel={tegel} />
      ) : (
        <img
          className="plaatjes-tegel__beeld"
          src={tegel.afbeelding}
          alt=""
          loading="lazy"
          decoding="async"
          style={{ width: `${tegel.img['breedte%']}%`, left: `${tegel.img['links%']}%`, top: `${tegel.img['boven%']}%` }}
        />
      )}
      {children}
      {label && <span className="plaatjes-tegel__label">{label}</span>}
      {binnenkort && (
        <span className="plaatjes-tegel__binnenkort" role="status">
          Binnenkort
        </span>
      )}
    </span>
  )

  const naam = titel ?? tegel.omschrijving

  const domId = `tegel-${id}`

  if (tegel.klikbaar && alsKnop) {
    return (
      <button ref={ref} id={domId} type="button" className={klassen} style={stijl} onClick={onTik} aria-label={label ? `${naam} — ${label}` : naam}>
        {inhoud}
      </button>
    )
  }
  // Niet klikbaar, of er liggen eigen knoppen op (children): gewone groep
  return (
    <div
      ref={ref}
      id={domId}
      className={klassen.replace(' is-klikbaar', '')}
      style={stijl}
      role={children ? 'group' : 'img'}
      aria-label={naam}
    >
      {inhoud}
    </div>
  )
}

// Video-tegel (type "video" in tegels.json, bv. Webshop): speelt zonder geluid
// in een lus en pauzeert als hij uit beeld is. Bij prefers-reduced-motion
// alleen de poster. Hoeken volgens hoekRadius% (van de kaartbreedte).
function VideoBeeld({ tegel }) {
  const ref = useRef(null)
  const stil = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  const r = tegel['hoekRadius%'] ?? 0
  // % in border-radius: horizontaal van de breedte, verticaal van de hoogte
  const hoek = `${r}% / ${r * tegel.kaartVerhouding}%`

  useEffect(() => {
    const video = ref.current
    if (!video || !('IntersectionObserver' in window)) return
    const waarnemer = new IntersectionObserver(
      ([item]) => {
        if (item.isIntersecting) video.play().catch(() => {})
        else video.pause()
      },
      { threshold: 0.2 },
    )
    waarnemer.observe(video)
    return () => waarnemer.disconnect()
  }, [])

  if (stil) {
    return <img className="plaatjes-tegel__video" src={tegel.poster} alt="" style={{ borderRadius: hoek }} />
  }
  return (
    <video
      ref={ref}
      className="plaatjes-tegel__video"
      src={tegel.video}
      poster={tegel.poster}
      autoPlay
      muted
      loop
      playsInline
      preload="metadata"
      aria-hidden="true"
      style={{ borderRadius: hoek }}
    />
  )
}
