import { useEffect, useRef, useState } from 'react'
import { RotateCcw } from 'lucide-react'
import FAN from '../../data/fan-ballen.json'

// Fan-tab: Rossie loopt het veld op, vijf ballen staan vanaf het eerste beeld
// stil in beeld. De tikvlakken komen uit src/data/fan-ballen.json (x/y =
// middelpunt in % van de video, diameter in % van de videobreedte) en staan
// in % over de videocontainer, dus ze kloppen op elk schermformaat.
// De video speelt één keer, zonder geluid, en blijft op het laatste beeld.

// Ids uit de JSON naar de tegels in Fan.jsx ("motm" gebruiken de meldingen al)
const TEGEL_VAN = { 'man-of-the-match': 'motm' }

// Blijft bestaan zolang de app open is (ook na een tabwissel): de tweede keer
// in deze sessie meteen het eindbeeld, niet opnieuw afspelen.
let alAfgespeeld = false

const minderBeweging = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
// Ontwikkelaarsschakelaar: ?tikvlakken=1 toont de tikvlakken als rode cirkels
const toonTikvlakken = () => new URLSearchParams(window.location.search).get('tikvlakken') === '1'

export default function FanRossie({ onKies }) {
  const videoRef = useRef(null)
  const [stil] = useState(minderBeweging)
  const [debug] = useState(toonTikvlakken)
  const [speelt, setSpeelt] = useState(!alAfgespeeld && !stil)
  const [getikt, setGetikt] = useState(null)

  useEffect(() => {
    const video = videoRef.current
    if (!video || !speelt) return
    video.play().catch(() => {
      // autoplay geblokkeerd: dan maar het eindbeeld
      alAfgespeeld = true
      setSpeelt(false)
    })
  }, [speelt])

  function klaar() {
    alAfgespeeld = true
    setSpeelt(false)
  }

  function opnieuw() {
    const video = videoRef.current
    if (!video) return
    video.currentTime = 0
    setSpeelt(true)
    video.play().catch(() => setSpeelt(false))
  }

  // Tik: de bal veert kort in met een rode gloed, daarna opent het schermpje
  function kies(bal) {
    setGetikt(bal.id)
    setTimeout(() => {
      setGetikt(null)
      onKies(TEGEL_VAN[bal.id] ?? bal.id)
    }, 180)
  }

  return (
    <div className="fan-rossie">
      <div className="fan-rossie__podium">
        <div className="fan-rossie__beeld" style={{ '--verhouding': FAN.verhouding }}>
          {stil ? (
            <img className="fan-rossie__media" src={FAN.laatsteBeeld} alt="" />
          ) : (
            <video
              ref={videoRef}
              className="fan-rossie__media"
              src={FAN.video}
              // eerste keer: poster = eerste beeld; daarna meteen het eindbeeld
              poster={alAfgespeeld && !speelt ? FAN.laatsteBeeld : FAN.eersteBeeld}
              muted
              playsInline
              preload="auto"
              onEnded={klaar}
              aria-hidden="true"
            />
          )}

          {FAN.ballen.map((bal) => (
            <button
              key={bal.id}
              type="button"
              className={`fan-rossie__bal${getikt === bal.id ? ' is-getikt' : ''}${debug ? ' is-zichtbaar' : ''}`}
              style={{ left: `${bal.x}%`, top: `${bal.y}%`, width: `${bal.diameter}%` }}
              aria-label={bal.titel}
              onClick={() => kies(bal)}
            />
          ))}

          {!stil && !speelt && (
            <button type="button" className="fan-rossie__opnieuw" onClick={opnieuw} aria-label="Video opnieuw afspelen">
              <RotateCcw size={16} strokeWidth={2.4} aria-hidden="true" />
              <span>Opnieuw</span>
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
