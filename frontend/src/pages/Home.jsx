import { useEffect, useState } from 'react'
import { getMatches, getNews } from '../api'
import Countdown from '../components/Countdown'
import TeamBadge from '../components/TeamBadge'
import AlbumPromo from '../components/AlbumPromo'
import JouwSpelerKaart from '../components/JouwSpelerKaart'
import BenJeErbijTegel from '../components/BenJeErbijTegel'

const datumFormat = new Intl.DateTimeFormat('nl-NL', {
  weekday: 'short',
  day: 'numeric',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
})

const datumNieuwsFormat = new Intl.DateTimeFormat('nl-NL', {
  day: 'numeric',
  month: 'short',
})

export default function Home() {
  const [volgende, setVolgende] = useState(undefined)
  const [nieuws, setNieuws] = useState([])
  const [fout, setFout] = useState(null)

  useEffect(() => {
    let actief = true

    Promise.all([getMatches('gepland'), getNews()])
      .then(([geplande, nieuwsItems]) => {
        if (!actief) return
        setVolgende(geplande[0] ?? null)
        setNieuws(nieuwsItems)
      })
      .catch((err) => {
        if (!actief) return
        setFout(err.message)
      })

    return () => {
      actief = false
    }
  }, [])

  if (fout) {
    return (
      <div className="card">
        <p>Kan de gegevens nu niet ophalen. Controleer of de backend draait.</p>
      </div>
    )
  }

  return (
    <>
      <section>
        <div className="section-heading">
          <span className="eyebrow">Eerstvolgend</span>
          <h2>Volgende wedstrijd</h2>
        </div>

        {volgende === undefined && <div className="card">Wedstrijd laden...</div>}

        {volgende === null && (
          <div className="scoreboard">
            <p className="scoreboard__empty">Er staat momenteel geen wedstrijd gepland.</p>
          </div>
        )}

        {volgende && (
          <div className="scoreboard">
            <span className="eyebrow scoreboard__eyebrow">
              {volgende.competition}
              {volgende.matchday ? ` · speelronde ${volgende.matchday}` : ''}
            </span>
            <div className="scoreboard__teams">
              <div className="scoreboard__team">
                <TeamBadge team={volgende.thuisTeam} />
                <span className="scoreboard__team-name">{volgende.thuisTeam.name}</span>
              </div>
              <span className="scoreboard__vs">VS</span>
              <div className="scoreboard__team">
                <TeamBadge team={volgende.uitTeam} />
                <span className="scoreboard__team-name">{volgende.uitTeam.name}</span>
              </div>
            </div>

            <Countdown kickoff={volgende.kickoff} />

            <div className="scoreboard__meta">
              <span>
                {datumFormat.format(new Date(volgende.kickoff))}
                {!volgende.aftrapBekend && ' (tijd n.n.b.)'}
              </span>
              <span>{volgende.venue}</span>
            </div>
          </div>
        )}
      </section>

      <section>
        <BenJeErbijTegel />
      </section>

      <section>
        <JouwSpelerKaart />
      </section>

      <section>
        <AlbumPromo onKlik={() => { window.location.href = '/plakboek' }} />
      </section>

      <section>
        <div className="section-heading">
          <span className="eyebrow">Actueel</span>
          <h2>Laatste nieuws</h2>
        </div>

        {nieuws.length === 0 && <div className="card">Nieuws laden...</div>}

        {nieuws.length > 0 && (
          <div className="news-list">
            {nieuws.map((item) => (
              <article className="news-card" key={item.id}>
                <img className="news-card__image" src={item.imageUrl} alt="" />
                <div className="news-card__body">
                  <span className="news-card__meta">
                    {datumNieuwsFormat.format(new Date(item.publishedAt))}
                  </span>
                  <h3 className="news-card__title">{item.title}</h3>
                  <p className="news-card__summary">{item.summary}</p>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </>
  )
}
