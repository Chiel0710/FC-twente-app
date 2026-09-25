import { useState } from 'react'
import { Ban, Search, Send, X } from 'lucide-react'
import { START } from '../lib/demoDb'
import { Kaart, Kop, euro } from './ui'

// Gebruikers: Daan bovenaan, daarna de 40 voorbeeldgebruikers uit de
// demo-database. Zoeken, filteren op fantype, klik voor het gedrag. De acties
// (pushbericht, blokkeren) zijn demo: ze tonen alleen een bevestiging.
const FANTYPES = ['alle', 'afstand', 'hardekern', 'seizoenskaart', 'gemiddeld', 'losse', 'gezin']
const FANTYPE_NAAM = { afstand: 'Op afstand', hardekern: 'Harde kern', seizoenskaart: 'Seizoenskaart', gemiddeld: 'Gemiddeld', losse: 'Losse bezoeker', gezin: 'Gezin' }

// Daan in dezelfde vorm als de andere gebruikers (plus zijn historie)
const DAAN = {
  ...START.daan,
  stemmenGegeven: START.daan.gedrag.stemmenGegeven,
  quizGespeeld: START.daan.gedrag.quizGespeeld,
  ticketsGekocht: START.daan.ticketHistorie.length,
  stickers: START.daan.gedrag.stickersGeclaimd.length,
}
const ALLEN = [DAAN, ...START.gebruikers]

function Detail({ g, onSluit }) {
  const [push, setPush] = useState('')
  const [bevestiging, setBevestiging] = useState('')
  const isDaan = g.id === 'daan'
  return (
    <aside className="adm-detail" aria-label={`Details ${g.naam}`}>
      <header>
        <div>
          <h2>{g.naam}</h2>
          <p className="adm-sub">
            {FANTYPE_NAAM[g.fantype] ?? g.fantype} · {g.woonplaats} · lid sinds {g.lidSinds}
          </p>
        </div>
        <button type="button" className="adm-knop adm-knop--licht adm-knop--icoon" onClick={onSluit} aria-label="Sluiten">
          <X size={18} />
        </button>
      </header>

      {isDaan && <p className="adm-inzicht">{g.inzicht}</p>}

      <dl className="adm-gegevens">
        <div><dt>Laatst actief</dt><dd>{g.laatstActief}</dd></div>
        <div><dt>Stemmen</dt><dd>{g.stemmenGegeven}</dd></div>
        <div><dt>Quiz gespeeld</dt><dd>{g.quizGespeeld}</dd></div>
        <div><dt>Tickets gekocht</dt><dd>{g.ticketsGekocht}</dd></div>
        <div><dt>Seizoenskaart</dt><dd>{g.seizoenskaart ? 'Ja' : 'Nee'}</dd></div>
        <div><dt>Stickers</dt><dd>{g.stickers}</dd></div>
      </dl>

      {isDaan && (
        <>
          <h3>Tickets</h3>
          <ul className="adm-lijstje">
            {g.ticketHistorie.map((t) => (
              <li key={t.wedstrijdId}>
                <strong>{t.wedstrijd}</strong> ({t.team}) · {t.datum} · {t.uitslag} · vak {t.vak}, rij {t.rij}, stoel {t.stoel} · {euro(t.prijs)} via {t.gekochtVia}
              </li>
            ))}
          </ul>
          <h3>Gedrag</h3>
          <ul className="adm-lijstje">
            <li>{g.gedrag.wedstrijdenGevolgdInApp} wedstrijden gevolgd in de app, gemiddeld {g.gedrag.gemiddeldeMinutenPerWedstrijd} min</li>
            <li>{g.gedrag.highlightsBekeken} keer highlights bekeken · meest gebruikt: {g.gedrag.meestGebruikteFeature}</li>
            <li>Quiz: {g.gedrag.quizGespeeld} keer, gemiddeld {g.gedrag.quizScoreGemiddeld}</li>
            <li>Voorspellingen: {g.gedrag.voorspellingenGedaan}, waarvan {g.gedrag.voorspellingenGoed} goed</li>
            <li>Meldingen: {g.gedrag.notificaties}</li>
          </ul>
          <h3>Webshop</h3>
          <ul className="adm-lijstje">
            {g.gedrag.webshop.map((b, i) => (
              <li key={i}>{b.product} (maat {b.maat}) · {b.datum} · {euro(b.bedrag)}</li>
            ))}
          </ul>
          <h3>Vragen aan Rossie</h3>
          <ul className="adm-lijstje">
            {g.gedrag.rossieVragen.map((v) => (
              <li key={v}>“{v}”</li>
            ))}
          </ul>
        </>
      )}

      <h3>Acties (demo)</h3>
      <form
        className="adm-form"
        onSubmit={(e) => {
          e.preventDefault()
          if (!push.trim()) return
          setBevestiging(`Pushbericht verstuurd naar ${g.naam} (demo, er gaat niets echt de deur uit).`)
          setPush('')
        }}
      >
        <label>
          Pushbericht
          <input value={push} onChange={(e) => setPush(e.target.value)} placeholder="bv. Nog kaarten voor Twente – Thun!" />
        </label>
        <div className="adm-knoppenrij">
          <button type="submit" className="adm-knop adm-knop--primair"><Send size={16} /> Versturen</button>
          <button type="button" className="adm-knop adm-knop--licht" onClick={() => setBevestiging(`${g.naam} is geblokkeerd (demo, er verandert niets).`)}>
            <Ban size={16} /> Blokkeren
          </button>
        </div>
      </form>
      {bevestiging && <p className="adm-ok" role="status">{bevestiging}</p>}
    </aside>
  )
}

export default function Gebruikers() {
  const [zoek, setZoek] = useState('')
  const [fantype, setFantype] = useState('alle')
  const [gekozen, setGekozen] = useState(null)

  const lijst = ALLEN.filter(
    (g) =>
      (fantype === 'alle' || g.fantype === fantype) &&
      `${g.naam} ${g.woonplaats}`.toLowerCase().includes(zoek.trim().toLowerCase()),
  )

  return (
    <>
      <Kop titel="Gebruikers" uitleg={`${START.overzicht.gebruikers.toLocaleString('nl-NL')} gebruikers; hieronder Daan en 40 voorbeeldgebruikers.`} />
      <div className={`adm-gebruikers${gekozen ? ' met-detail' : ''}`}>
        <Kaart
          titel={`${lijst.length} gebruikers`}
          actie={
            <div className="adm-rij">
              <label className="adm-zoek">
                <Search size={16} aria-hidden="true" />
                <input value={zoek} onChange={(e) => setZoek(e.target.value)} placeholder="Zoek op naam of plaats" aria-label="Zoeken" />
              </label>
              <select className="adm-select" value={fantype} onChange={(e) => setFantype(e.target.value)} aria-label="Filter op fantype">
                {FANTYPES.map((f) => (
                  <option key={f} value={f}>{f === 'alle' ? 'Alle fantypes' : FANTYPE_NAAM[f]}</option>
                ))}
              </select>
            </div>
          }
        >
          <div className="adm-tabel-wrap">
            <table className="adm-tabel adm-tabel--klik">
              <thead>
                <tr>
                  <th>Naam</th>
                  <th>Fantype</th>
                  <th>Woonplaats</th>
                  <th>Laatst actief</th>
                  <th>Tickets</th>
                  <th>Stickers</th>
                </tr>
              </thead>
              <tbody>
                {lijst.map((g) => (
                  <tr key={g.id} onClick={() => setGekozen(g)} className={gekozen?.id === g.id ? 'is-actief' : ''}>
                    <td>
                      <button type="button" className="adm-tabel__naam" onClick={() => setGekozen(g)}>
                        {g.naam}
                      </button>
                      {g.id === 'daan' && <span className="adm-tag is-rood">Persona</span>}
                    </td>
                    <td>{FANTYPE_NAAM[g.fantype] ?? g.fantype}</td>
                    <td>{g.woonplaats}</td>
                    <td>{g.laatstActief}</td>
                    <td>{g.ticketsGekocht}</td>
                    <td>{g.stickers}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Kaart>
        {gekozen && <Detail key={gekozen.id} g={gekozen} onSluit={() => setGekozen(null)} />}
      </div>
    </>
  )
}
