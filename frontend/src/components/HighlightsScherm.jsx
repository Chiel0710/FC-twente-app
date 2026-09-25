import { useEffect, useRef, useState } from 'react'
import { X } from 'lucide-react'
import { getPlayers, getResults } from '../api'
import { datumVan } from '../kaartWedstrijd'
import { stickerSleutel } from '../plakboekUtil'

// /highlights/:datum — "Twente in 60 seconden": de doelpunten van een
// gespeelde wedstrijd als stories. De doelpunten komen uit de database (daar
// geseed uit wedstrijd-details-2026-2027.json); per doelpunt zoeken we de clip
//   /highlights/<datum>/<rugnummer>-<naam>-<minuut>-doelpunt.mp4
// Bij een tegenstander is het rugnummer niet bekend: dan de club, bv.
//   /highlights/2026-09-20/psv-guus-til-26-doelpunt.mp4
// Ontbreekt een clip, dan 4 seconden een kaart met minuut, speler en stand.
// Na de laatste clip: "Claim je sticker" naar het plakboek.
const KAART_MS = 4000

const slug = (tekst) =>
  tekst
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

// Clubnaam als voorvoegsel: "FC Twente" -> "twente", "PSV" -> "psv"
const clubSlug = (naam) => slug(naam).replace(/^(fc|sc)-/, '')

function bouwDoelpunten(match, rugnummerVan, datum) {
  const naamVan = (teamId) => (teamId === match.thuisTeamId ? match.thuisTeam : match.uitTeam)
  let thuis = 0
  let uit = 0
  return match.events
    .filter((e) => e.type === 'goal')
    .sort((a, b) => a.minute - b.minute)
    .map((e) => {
      if (e.teamId === match.thuisTeamId) thuis++
      else uit++
      const team = naamVan(e.teamId)
      const nummer = team.isTwente ? rugnummerVan.get(e.playerName) : undefined
      const voorvoegsel = nummer ? String(nummer).padStart(2, '0') : clubSlug(team.name)
      return {
        minuut: e.minute,
        speler: e.playerName,
        team: team.name,
        voorTwente: team.isTwente,
        stand: `${thuis}-${uit}`,
        clip: `/highlights/${datum}/${voorvoegsel}-${slug(e.playerName)}-${e.minute}-doelpunt.mp4`,
      }
    })
}

export default function HighlightsScherm({ datum, onSluit }) {
  const [data, setData] = useState(undefined) // { match, doelpunten }
  const [index, setIndex] = useState(0) // doelpunten.length = eindscherm
  const [ontbreekt, setOntbreekt] = useState(false) // clip van dit doelpunt niet gevonden
  const vullingRef = useRef(null)

  useEffect(() => {
    let actief = true
    Promise.all([getResults('mannen'), getPlayers('mannen')])
      .then(([uitslagen, spelers]) => {
        if (!actief) return
        const match = uitslagen.find((m) => datumVan(m.kickoff) === datum)
        if (!match) return setData(null)
        const rugnummerVan = new Map(spelers.map((s) => [s.naam, s.rugnummer]))
        setData({ match, doelpunten: bouwDoelpunten(match, rugnummerVan, datum) })
      })
      .catch(() => actief && setData(null))
    return () => {
      actief = false
    }
  }, [datum])

  const aantal = data?.doelpunten.length ?? 0
  const naar = (i) => {
    setOntbreekt(false)
    setIndex(Math.max(0, Math.min(i, aantal)))
  }

  // Ontbrekende clip: kaart 4 seconden laten staan, dan door
  useEffect(() => {
    if (!ontbreekt) return
    const t = setTimeout(() => {
      setOntbreekt(false)
      setIndex((i) => i + 1)
    }, KAART_MS)
    return () => clearTimeout(t)
  }, [ontbreekt, index])

  // Esc sluit, pijltjes bladeren
  useEffect(() => {
    const toets = (e) => {
      if (e.key === 'Escape') onSluit()
      if (e.key === 'ArrowRight') naar(index + 1)
      if (e.key === 'ArrowLeft') naar(index - 1)
    }
    window.addEventListener('keydown', toets)
    return () => window.removeEventListener('keydown', toets)
  })

  // Voortgang van de lopende clip direct op het balkje zetten (geen re-render per frame)
  function opTijd(e) {
    const { currentTime, duration } = e.currentTarget
    if (vullingRef.current && duration) vullingRef.current.style.transform = `scaleX(${currentTime / duration})`
  }

  const huidig = data?.doelpunten[index]
  const klaar = data && index >= aantal

  return (
    <div className="hl" role="dialog" aria-modal="true" aria-label="Twente in 60 seconden">
      <div className="hl__balken" aria-hidden="true">
        {data?.doelpunten.map((_, i) => (
          <span className="hl__balk" key={i}>
            <span
              key={i === index ? `nu-${index}-${ontbreekt}` : i}
              ref={i === index ? vullingRef : undefined}
              className={`hl__vulling${i < index || klaar ? ' is-klaar' : ''}${i === index && ontbreekt ? ' is-kaart' : ''}`}
              style={{ '--kaart-duur': `${KAART_MS}ms` }}
            />
          </span>
        ))}
      </div>

      <header className="hl__kop">
        <div>
          <h2 className="hl__titel">Twente in 60 seconden</h2>
          {data?.match && (
            <p className="hl__uitslag">
              {data.match.thuisTeam.name} – {data.match.uitTeam.name} {data.match.thuisScore}-{data.match.uitScore}
            </p>
          )}
        </div>
        <button type="button" className="hl__sluit" onClick={onSluit} aria-label="Highlights sluiten" autoFocus>
          <X strokeWidth={2.2} size={22} />
        </button>
      </header>

      {data === undefined && <p className="hl__melding">Highlights laden…</p>}
      {data === null && <p className="hl__melding">Voor deze wedstrijd zijn geen highlights.</p>}

      {huidig && !ontbreekt && (
        <video
          key={huidig.clip}
          className="hl__video"
          src={huidig.clip}
          autoPlay
          muted
          playsInline
          preload="auto"
          onTimeUpdate={opTijd}
          onEnded={() => naar(index + 1)}
          onError={() => setOntbreekt(true)}
        />
      )}

      {/* Clip ontbreekt: kaart in huisstijl met minuut, speler en tussenstand */}
      {huidig && ontbreekt && (
        <div className={`hl__kaart${huidig.voorTwente ? ' is-twente' : ''}`}>
          <span className="hl__kaart-minuut">{huidig.minuut}'</span>
          <span className="hl__kaart-speler">{huidig.speler}</span>
          <span className="hl__kaart-stand">{huidig.stand.replace('-', ' – ')}</span>
        </div>
      )}

      {huidig && (
        <div className="hl__onder" aria-live="polite">
          <span className="hl__minuut">{huidig.minuut}'</span>
          <span className="hl__speler">
            {huidig.speler}
            <small>{huidig.team}</small>
          </span>
          <span className="hl__stand">{huidig.stand.replace('-', ' – ')}</span>
        </div>
      )}

      {klaar && (
        <div className="hl__eind">
          <p className="hl__eind-stand">
            {data.match.thuisScore} – {data.match.uitScore}
          </p>
          <p className="hl__eind-tekst">Eindstand</p>
          <button
            type="button"
            className="hl__claim"
            onClick={() => {
              window.location.href = `/plakboek?claim=${stickerSleutel(data.match)}`
            }}
          >
            Claim je sticker
          </button>
          <button type="button" className="hl__opnieuw" onClick={() => naar(0)}>
            Opnieuw bekijken
          </button>
        </div>
      )}

      {/* Tikzones zoals bij stories: links terug, rechts verder */}
      {data && !klaar && (
        <div className="hl__tik">
          <button type="button" aria-label="Vorig doelpunt" onClick={() => naar(index - 1)} />
          <button type="button" aria-label="Volgend doelpunt" onClick={() => naar(index + 1)} />
        </div>
      )}
    </div>
  )
}
