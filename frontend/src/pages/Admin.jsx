import { useEffect, useState } from 'react'
import { getMatches, getShopStats, simuleerCheckIn } from '../api'
import { HUIDIG_PROFIEL_ID } from '../profiel'

const BRON_LABEL = { fanshop: 'Fanshop', motm: 'Man of the Match', plakboek: 'Plakboek' }

const datumFormat = new Intl.DateTimeFormat('nl-NL', {
  weekday: 'short',
  day: 'numeric',
  month: 'short',
})

// Minimale adminkant — voor nu alleen de demoknop voor het plakboek, zodat
// de check-in-flow tijdens de pitch te tonen is. De volledige adminkant
// (dashboard, AI-functie, sectie 8 uit de briefing) is toekomstige scope.
export default function Admin() {
  const [matches, setMatches] = useState([])
  const [matchId, setMatchId] = useState('')
  const [bezig, setBezig] = useState(false)
  const [melding, setMelding] = useState(null)
  const [shopStats, setShopStats] = useState(undefined)

  useEffect(() => {
    getMatches().then((data) => {
      setMatches(data)
      if (data[0]) setMatchId(data[0].id)
    })
    getShopStats()
      .then(setShopStats)
      .catch(() => setShopStats(null))
  }, [])

  async function simuleer() {
    if (!matchId) return
    setBezig(true)
    setMelding(null)
    const match = matches.find((m) => m.id === matchId)
    const tegenstander = match.thuisTeam.isTwente ? match.uitTeam.name : match.thuisTeam.name
    await simuleerCheckIn(HUIDIG_PROFIEL_ID, matchId, 'attended')
    setMelding(`Check-in gesimuleerd voor ${tegenstander}. Ga naar de Fan-tab om 'm te claimen.`)
    setBezig(false)
  }

  return (
    <div className="admin-pagina">
      <header className="admin-pagina__header">
        <img src="/logo.png" alt="FC Twente" className="admin-pagina__logo" />
        <span>Adminkant (demo)</span>
      </header>

      <div className="card admin-kaart">
        <div className="section-heading">
          <span className="eyebrow">Plakboek</span>
          <h2>Simuleer check-in</h2>
        </div>
        <p className="admin-kaart__uitleg">
          Simuleert een check-in van het profiel "{HUIDIG_PROFIEL_ID}" voor de gekozen wedstrijd —
          zo verschijnt er meteen een claimbare sticker in de Fan-tab, handig tijdens de pitch.
        </p>

        <select
          className="admin-select"
          value={matchId}
          onChange={(e) => setMatchId(e.target.value)}
        >
          {matches.map((m) => {
            const tegenstander = m.thuisTeam.isTwente ? m.uitTeam.name : m.thuisTeam.name
            return (
              <option key={m.id} value={m.id}>
                {m.thuisTeam.isTwente ? 'Thuis' : 'Uit'} vs {tegenstander} —{' '}
                {datumFormat.format(new Date(m.kickoff))} ({m.competition})
              </option>
            )
          })}
        </select>

        <button type="button" className="vote-button vote-button--primary" onClick={simuleer} disabled={bezig}>
          {bezig ? 'Bezig...' : 'Simuleer check-in'}
        </button>

        {melding && <p className="admin-kaart__melding">{melding}</p>}
      </div>

      <div className="card admin-kaart">
        <div className="section-heading">
          <span className="eyebrow">Fanshop</span>
          <h2>Doorklikken naar de fanshop</h2>
        </div>

        {shopStats === undefined && <p className="admin-kaart__uitleg">Laden...</p>}
        {shopStats === null && (
          <p className="admin-kaart__uitleg">Kon de fanshop-statistieken niet ophalen.</p>
        )}

        {shopStats && (
          <>
            <div className="admin-shop-bronnen">
              {shopStats.perBron.length === 0 && (
                <p className="admin-kaart__uitleg">Nog geen doorklikken gemeten.</p>
              )}
              {shopStats.perBron.map((rij) => (
                <div className="admin-shop-bron" key={rij.bron}>
                  <span className="admin-shop-bron__aantal">{rij._count._all}</span>
                  <span className="admin-shop-bron__label">{BRON_LABEL[rij.bron] ?? rij.bron}</span>
                </div>
              ))}
            </div>

            {shopStats.perProduct.length > 0 && (
              <>
                <p className="admin-kaart__subkop">Meest aangeklikt</p>
                <ol className="admin-shop-producten">
                  {shopStats.perProduct.map((rij) => (
                    <li key={rij.naam}>
                      <span>{rij.naam ?? 'Onbekend product'}</span>
                      <span className="admin-shop-producten__aantal">{rij._count._all}×</span>
                    </li>
                  ))}
                </ol>
              </>
            )}
          </>
        )}
      </div>
    </div>
  )
}
