import { useEffect, useRef, useState } from 'react'
import { claimSticker, getMatches, getStickers, simuleerCheckIn } from '../api'
import { HUIDIG_PROFIEL_ID, leesAanwezigheid } from '../profiel'
import { bouwStickerObject, stickerSleutel } from '../plakboekUtil'
import { eigenStickerVoor } from '../eigenStickers'
import { useStickerPlak, ClaimOverlay } from '../StickerPlak'
import '../plakboek.css'
import StickerSlot from './StickerSlot'
import ClaimBalk from './ClaimBalk'

// Digitaal plakboek — raster van alle 40 wedstrijden. Een vakje is leeg
// (geen check-in), claimbaar (sticker gewacht op claimen) of geplakt.
//
// Belangrijk: StickerKaart toont #volgnummer zonder fallback, en de opdracht
// eist dat de server het volgnummer bepaalt — dus de échte claim-API-call
// gebeurt hier vóórdat de overlay opengaat (hook.claim opent alleen de
// overlay, die doet zelf geen netwerkverkeer).
export default function Plakboek() {
  const [matches, setMatches] = useState([])
  const [claimbareKaarten, setClaimbareKaarten] = useState([])
  const [geplakteStickers, setGeplakteStickers] = useState({}) // matchId -> sticker-object
  const [fout, setFout] = useState(null)
  const gridRef = useRef(null)

  useEffect(() => {
    let actief = true

    Promise.all([getMatches(), getStickers(HUIDIG_PROFIEL_ID)])
      .then(([alleMatches, stickers]) => {
        if (!actief) return
        setMatches(alleMatches)
        setClaimbareKaarten(stickers.filter((s) => s.claimedAt === null))

        const geplakt = {}
        for (const s of stickers.filter((s) => s.claimedAt !== null)) {
          geplakt[s.matchId] = bouwStickerObject(s)
        }
        setGeplakteStickers(geplakt)
      })
      .catch((err) => {
        if (!actief) return
        setFout(err.message)
      })

    return () => {
      actief = false
    }
  }, [])

  // Scroll naar het vakje van een wedstrijd; oplichten = even laten oplichten
  function naarVakje(matchId, oplichten = false) {
    setTimeout(() => {
      const vakje = gridRef.current?.querySelector(`#s-${matchId}`)
      if (!vakje) return
      const minderBeweging = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
      vakje.scrollIntoView({ behavior: minderBeweging ? 'auto' : 'smooth', block: 'center' })
      if (oplichten) {
        vakje.classList.add('is-oplichtend')
        setTimeout(() => vakje.classList.remove('is-oplichtend'), 2200)
      }
    }, 60) // eerst de vakjes laten tekenen
  }

  // /plakboek?claim=2026-09-20-twente-psv — sleutel -> wedstrijd -> sticker van
  // dit profiel. Nog geen sticker? Dan eerst inchecken (groen bij "Ben je
  // erbij?" = aanwezig, anders gevolgd). Daarna na ~400 ms de bestaande
  // claim-animatie. Al geclaimd: alleen ernaartoe en even laten oplichten.
  async function verwerkClaim(sleutel) {
    const match = matches.find((m) => stickerSleutel(m) === sleutel)
    // sleutel uit de adresbalk, zodat herladen niet opnieuw claimt
    window.history.replaceState(null, '', window.location.pathname)
    if (!match) return

    if (geplakteStickers[match.id]) {
      naarVakje(match.id, true)
      return
    }
    let kaart = claimbareKaarten.find((s) => s.matchId === match.id)
    if (!kaart) {
      const type = leesAanwezigheid(match.id) === 'ja' ? 'attended' : 'followed'
      // Verse sticker (zonder wedstrijdgegevens) niet in de claimbalk zetten:
      // die leest match.thuisTeam. Hij wordt hieronder meteen geclaimd.
      const { stickerCard } = await simuleerCheckIn(HUIDIG_PROFIEL_ID, match.id, type)
      kaart = stickerCard
    }
    naarVakje(match.id)
    setTimeout(() => claimEnOpen(kaart), 400)
  }

  function onGeplakt(sticker) {
    setGeplakteStickers((prev) => ({ ...prev, [sticker.matchId]: sticker }))
  }

  const { actief: overlaySticker, kaartRef, claim, plak, sluit } = useStickerPlak({
    vindSlot: (matchId) => gridRef.current?.querySelector(`#s-${matchId}`),
    onGeplakt,
  })

  async function claimEnOpen(rawStickerCard) {
    const geclaimd = await claimSticker(rawStickerCard.id)
    claim(bouwStickerObject(geclaimd))
    setClaimbareKaarten((prev) => prev.filter((s) => s.id !== rawStickerCard.id))
  }

  // Sluit je de onthulling zonder te plakken? De sticker is server-side al
  // geclaimd (volgnummer is al toegekend) — dan toch meteen plaatsen i.p.v.
  // 'm kwijtraken uit beeld.
  function sluitZonderPlakken() {
    if (overlaySticker) onGeplakt(overlaySticker)
    sluit()
  }

  // ?claim=<sleutel> (vanuit een melding of het highlights-scherm): één keer
  // uitvoeren zodra de wedstrijden en stickers geladen zijn
  const claimGedaan = useRef(false)
  useEffect(() => {
    const sleutel = new URLSearchParams(window.location.search).get('claim')
    if (!sleutel || claimGedaan.current || matches.length === 0) return
    claimGedaan.current = true
    verwerkClaim(sleutel)
    // alleen afhankelijk van het laden; verwerkClaim leest de state van dat moment
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matches])

  if (fout) {
    return (
      <div className="card">
        <p>Kan het plakboek nu niet laden. Controleer of de backend draait.</p>
      </div>
    )
  }

  return (
    <div className="plakboek">
      <ClaimBalk stickers={claimbareKaarten} onClaim={claimEnOpen} />

      <div className="section-heading">
        <span className="eyebrow">Digitaal plakboek</span>
        <h2>Seizoen 2026/2027</h2>
      </div>

      <div className="plakboek-raster" ref={gridRef}>
        {matches.map((match) => {
          const eigenBeeld = eigenStickerVoor(match.kickoff)
          if (eigenBeeld) {
            return <StickerSlot key={match.id} match={match} toestand="geplakt" eigenBeeld={eigenBeeld} />
          }

          const sticker = geplakteStickers[match.id]
          if (sticker) {
            return <StickerSlot key={match.id} match={match} toestand="geplakt" sticker={sticker} />
          }
          const claimbareKaart = claimbareKaarten.find((s) => s.matchId === match.id)
          if (claimbareKaart) {
            return (
              <StickerSlot
                key={match.id}
                match={match}
                toestand="claimbaar"
                onClaimKlik={() => claimEnOpen(claimbareKaart)}
              />
            )
          }
          return <StickerSlot key={match.id} match={match} toestand="leeg" />
        })}
      </div>

      <ClaimOverlay
        sticker={overlaySticker}
        kaartRef={kaartRef}
        onPlak={plak}
        onSluit={sluitZonderPlakken}
      />
    </div>
  )
}
