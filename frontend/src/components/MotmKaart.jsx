import { useEffect, useState } from 'react'
import { CASTORE_COLLECTIE_URL, getMotm, stemMotm, stuurShopKlik } from '../api'
import { HUIDIG_PROFIEL_ID } from '../profiel'
import SpelerAvatar from './SpelerAvatar'
import StemBalk from './StemBalk'

// "Man of the Match" — stemmen op de laatst gespeelde wedstrijd, voor de lol.
// Spelerskeuze gebeurt met de echte foto's uit de selectie (of een streepje
// als de foto in de bron ontbreekt).
//
// Zou eigenlijk moeten filteren op wie er die wedstrijd echt in de basis of
// als wissel stond (opstellingTwente in wedstrijd-details.json). Die velden
// zijn in de bron nog overal leeg (formatie/basis/wissels = null/[]), dus we
// kunnen dat nu niet echt bepalen — we tonen daarom de volledige selectie.
// Zodra de bron dit invult: hier filteren op basis + wissels i.p.v. spelers.
export default function MotmKaart({ match, spelers }) {
  const [resultaat, setResultaat] = useState(undefined)
  const [wijzigen, setWijzigen] = useState(false)

  useEffect(() => {
    if (!match) return
    getMotm(match.id, HUIDIG_PROFIEL_ID).then(setResultaat)
  }, [match])

  if (!match) return null

  async function stem(playerId) {
    await stemMotm(match.id, HUIDIG_PROFIEL_ID, playerId)
    const vers = await getMotm(match.id, HUIDIG_PROFIEL_ID)
    setResultaat(vers)
    setWijzigen(false)
  }

  const opponent = match.uitTeam.isTwente ? match.thuisTeam.name : match.uitTeam.name
  const toontKeuze = resultaat === undefined || resultaat.eigenKeuze === null || wijzigen
  const eigenSpeler = resultaat?.resultaten.find((r) => r.player.id === resultaat.eigenKeuze)?.player

  // Geen shirt-per-speler-product bij Castore — we meten de interesse onder
  // een eigen productId en linken naar de algemene collectie.
  function naarShirt(speler) {
    stuurShopKlik(HUIDIG_PROFIEL_ID, 'motm-shirt', `Shirt van ${speler.naam}`, 'motm')
    window.open(CASTORE_COLLECTIE_URL, '_blank', 'noopener,noreferrer')
  }

  return (
    <div className="card fan-card fan-card--motm">
      <div className="fan-card__intro">
        <span className="eyebrow">Man of the Match</span>
        <p>Wie was volgens jou de beste Twente-speler tegen {opponent}?</p>
      </div>

      {toontKeuze && (
        <div className="motm-grid">
          {spelers.map((speler) => (
            <button
              key={speler.id}
              type="button"
              className="motm-speler"
              onClick={() => stem(speler.id)}
            >
              <SpelerAvatar speler={speler} />
              <span className="motm-speler__naam">{speler.naam}</span>
              <span className="motm-speler__rugnummer">#{speler.rugnummer}</span>
            </button>
          ))}
        </div>
      )}

      {!toontKeuze && resultaat && eigenSpeler && (
        <>
          <div className="motm-eigen-keuze">
            <SpelerAvatar speler={eigenSpeler} />
            <div className="motm-eigen-keuze__tekst">
              <span className="eyebrow">Jouw stem</span>
              <h3>{eigenSpeler.naam}</h3>
              <span className="motm-eigen-keuze__rugnummer">#{eigenSpeler.rugnummer}</span>
            </div>
          </div>
          <div className="stembalk-lijst">
            {resultaat.resultaten.slice(0, 5).map((r) => (
              <StemBalk
                key={r.player.id}
                label={r.player.naam}
                percentage={r.percentage}
                actief={resultaat.eigenKeuze === r.player.id}
              />
            ))}
          </div>
          <button type="button" className="motm-shirt-knop" onClick={() => naarShirt(eigenSpeler)}>
            Shirt van {eigenSpeler.naam}
          </button>
          <button type="button" className="fan-card__wijzig" onClick={() => setWijzigen(true)}>
            Wijzig je stem
          </button>
        </>
      )}
    </div>
  )
}
