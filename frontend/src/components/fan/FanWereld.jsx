import { useEffect, useRef, useState } from 'react'

// Exact gemeten uit het eindframe van de video (percentages van het beeld,
// 1080x1350 — vandaar object-fit:fill i.p.v. cover, anders kloppen deze
// posities niet meer).
const PLEKKEN = [
  { id: 'quiz', label: 'Weekquiz', x: 73.3, y: 27.2 },
  { id: 'motm', label: 'Man of the Match', x: 41.2, y: 43.2 },
  { id: 'poll', label: 'Poll van de week', x: 76.9, y: 57.9 },
  { id: 'voorspel', label: 'Voorspel de uitslag', x: 20.7, y: 73.6 },
]

// Module-scope i.p.v. React-state: blijft bestaan zolang de app open is
// (ook als je van tab wisselt en terugkomt — Fan.jsx wordt dan opnieuw
// gemount, maar deze module blijft geladen), en is dus precies "deze
// sessie" zonder dat er iets in localStorage/sessionStorage hoeft.
let laatAlAfgespeeld = false

// Video op het veld met vier tikbare ballen. De video speelt bij het openen
// van de tab en blijft daarna op het laatste frame staan; speelde hij deze
// sessie al eerder af, dan begint hij meteen op het eindframe.
export default function FanWereld({ onKies }) {
  const videoRef = useRef(null)
  const [zichtbaar, setZichtbaar] = useState(laatAlAfgespeeld)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    // Zet 'm daadwerkelijk op het laatste frame. Bij een vers gemount
    // <video>-element (bv. na terugkomst op deze tab) is de duur nog niet
    // bekend (readyState < 1) — dan wachten we alsnog even op de metadata
    // i.p.v. stil bij currentTime 0 te blijven hangen.
    function naarEindframe() {
      video.pause()
      laatAlAfgespeeld = true
      setZichtbaar(true)
      if (video.readyState >= 1) {
        video.currentTime = Math.max(0, video.duration - 0.05)
      } else {
        video.addEventListener(
          'loadedmetadata',
          () => {
            video.currentTime = Math.max(0, video.duration - 0.05)
          },
          { once: true },
        )
      }
    }

    if (laatAlAfgespeeld) {
      naarEindframe()
      return
    }

    setZichtbaar(false)
    video.addEventListener('ended', naarEindframe)

    function bijLaden() {
      video.pause()
      video.currentTime = 0
      const p = video.play()
      if (p?.catch) p.catch(() => naarEindframe()) // autoplay geblokkeerd: meteen eindframe
    }
    video.addEventListener('loadeddata', bijLaden)

    return () => {
      video.removeEventListener('ended', naarEindframe)
      video.removeEventListener('loadeddata', bijLaden)
    }
  }, [])

  return (
    <div className="fan-wereld">
      <div className="fan-wereld__scene">
        <video
          ref={videoRef}
          className="fan-wereld__video"
          src="/rossie-veld.mp4"
          muted
          playsInline
          preload="auto"
          aria-hidden="true"
        />

        <div className="fan-wereld__overlay">
          {PLEKKEN.map((plek) => (
            <button
              key={plek.id}
              type="button"
              className={`fan-plek${zichtbaar ? ' zicht' : ''}`}
              style={{ left: `${plek.x}%`, top: `${plek.y}%` }}
              aria-label={plek.label}
              onClick={() => onKies(plek.id)}
            >
              <span className="fan-plek__ring" />
            </button>
          ))}

          {PLEKKEN.map((plek) => (
            <span
              key={plek.id}
              className={`fan-label${zichtbaar ? ' zicht' : ''}`}
              style={{ left: `${plek.x}%`, top: `${plek.y - 7}%` }}
            >
              {plek.label}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
