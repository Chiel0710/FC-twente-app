import { useEffect, useRef, useState } from 'react'
import QRCode from 'qrcode'

// QR-scherm van een deal: schuift van onderen omhoog, binnen het telefoonvak.
// De code (bv. FCT-7K3Q-92XD) komt uit het profiel (dealCodeVoor in
// profiel.js), zodat je bij opnieuw openen dezelfde ziet; de QR bevat precies die tekst en wordt in de browser
// gemaakt (SVG, dus scherp op elk scherm). Het scherm zelf feller zetten kan
// niet vanuit een browser: daarom een helder wit vlak met ruime witte rand.
//
// geldigheid: null | "tot-aftrap" | "verlopen" (de "een helft eerder"-deal)
const UIT_MS = 260 // duur van de schuif naar beneden bij sluiten

export default function QrSheet({ code, naam, geldigheid, onSluit }) {
  const [svg, setSvg] = useState('')
  const [sluitend, setSluitend] = useState(false)
  const knopRef = useRef(null)
  const verlopen = geldigheid === 'verlopen'

  useEffect(() => {
    let actief = true
    QRCode.toString(code, { type: 'svg', margin: 0, errorCorrectionLevel: 'M', color: { dark: '#101010', light: '#ffffff' } })
      .then((s) => actief && setSvg(s))
      .catch(() => {})
    return () => {
      actief = false
    }
  }, [code])

  // Eerst naar beneden schuiven, dan pas weg
  function sluit() {
    if (sluitend) return
    setSluitend(true)
    const snel = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    setTimeout(onSluit, snel ? 0 : UIT_MS)
  }

  // Bij openen de focus op "Sluiten"
  useEffect(() => {
    knopRef.current?.focus()
  }, [])

  // Esc sluit
  useEffect(() => {
    const toets = (e) => e.key === 'Escape' && sluit()
    window.addEventListener('keydown', toets)
    return () => window.removeEventListener('keydown', toets)
  })

  return (
    <div
      className={`qr-laag${sluitend ? ' is-sluitend' : ''}`}
      onClick={(e) => e.target === e.currentTarget && sluit()}
    >
      <section className="qr-sheet" role="dialog" aria-modal="true" aria-labelledby="qr-sheet-naam">
        <span className="qr-sheet__greep" aria-hidden="true" />

        {geldigheid && (
          <p className={`qr-sheet__geldig${verlopen ? ' is-verlopen' : ''}`}>
            {verlopen ? 'Verlopen' : 'Geldig tot de aftrap'}
          </p>
        )}
        <h2 className="qr-sheet__naam" id="qr-sheet-naam">
          {naam}
        </h2>

        <div className={`qr-sheet__vlak${verlopen ? ' is-verlopen' : ''}`}>
          <div
            className="qr-sheet__qr"
            role="img"
            aria-label={`QR-code ${code}`}
            // SVG komt uit de qrcode-bibliotheek, niet van buiten
            dangerouslySetInnerHTML={{ __html: svg }}
          />
        </div>

        <p className="qr-sheet__code">{code}</p>
        <p className="qr-sheet__tijd">Geldig tot en met vandaag</p>
        <p className="qr-sheet__uitleg">
          {verlopen ? 'De aftrap is geweest: deze deal is niet meer te gebruiken.' : 'Laat deze code scannen bij het afrekenen'}
        </p>

        <button ref={knopRef} type="button" className="qr-sheet__sluit" onClick={sluit}>
          Sluiten
        </button>
      </section>
    </div>
  )
}
