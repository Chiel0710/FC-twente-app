import { useEffect, useMemo, useState } from 'react'
import { Wand2 } from 'lucide-react'
import {
  START,
  publiceerDeal,
  publiceerNieuws,
  publiceerOpstelling,
  publiceerWeetje,
  useDemoDb,
  verbergWeetje,
  zetDealAan,
} from '../lib/demoDb'
import { dealStats } from '../lib/demoStats'
import { spelersVan } from '../sportData'
import { opstellingVan } from '../components/OpstellingTegel'
import { laadDataWeetjes } from '../components/fan/WeetjeTegel'
import { Kaart, Kop } from './ui'

// Publiceren: wat de admin hier publiceert, staat meteen in de app (en in de
// inbox van de fan): opstelling op Home, nieuws bovenaan /nieuws, deals op
// /aanbiedingen, weetjes in het Weetje-schermpje van de Fan-tab.
const TABS = [
  { id: 'opstelling', label: 'Opstelling' },
  { id: 'nieuws', label: 'Nieuws' },
  { id: 'deals', label: 'Deals' },
  { id: 'weetjes', label: 'Weetjes' },
]

export default function Publiceren({ delen, ga }) {
  const tab = TABS.find((t) => t.id === delen[0]) ?? TABS[0]
  return (
    <>
      <Kop titel="Publiceren" uitleg="Wat je hier publiceert, staat direct in de app, met een melding voor de fans." />
      <div className="adm-tabs" role="tablist">
        {TABS.map((t) => (
          <button key={t.id} type="button" role="tab" aria-selected={t.id === tab.id} className={t.id === tab.id ? 'is-actief' : ''} onClick={() => ga(`publiceren/${t.id}`)}>
            {t.label}
          </button>
        ))}
      </div>
      {tab.id === 'opstelling' && <Opstelling />}
      {tab.id === 'nieuws' && <Nieuws />}
      {tab.id === 'deals' && <Deals />}
      {tab.id === 'weetjes' && <Weetjes />}
    </>
  )
}

/* ---------------- Opstelling ---------------- */

// Per formatie de rijen van keeper naar spits, met de positie die past
const FORMATIES = {
  '4-2-3-1': [['Keeper'], Array(4).fill('Verdediger'), Array(2).fill('Middenvelder'), Array(3).fill('Middenvelder'), ['Aanvaller']],
  '4-3-3': [['Keeper'], Array(4).fill('Verdediger'), Array(3).fill('Middenvelder'), Array(3).fill('Aanvaller')],
  '3-5-2': [['Keeper'], Array(3).fill('Verdediger'), Array(5).fill('Middenvelder'), Array(2).fill('Aanvaller')],
}
const RIJNAAM = { Keeper: 'Keeper', Verdediger: 'Verdediging', Middenvelder: 'Middenveld', Aanvaller: 'Aanval' }

// Vorm van de formatie met rugnummers (null = leeg); bestaande keuzes blijven waar het kan
function leegVolgens(formatie, oud = []) {
  const alle = oud.flat().filter(Boolean)
  return FORMATIES[formatie].map((rij) => rij.map(() => alle.shift() ?? null))
}

function Opstelling() {
  const w = useDemoDb()
  const [team, setTeam] = useState('mannen')
  const spelers = useMemo(() => spelersVan(team), [team])
  const huidig = opstellingVan(team, w)
  const [formatie, setFormatie] = useState(huidig?.formatie ?? '4-2-3-1')
  const [rijen, setRijen] = useState(() => (huidig ? huidig.rijen : leegVolgens('4-2-3-1')))
  const [melding, setMelding] = useState('')
  const [sleep, setSleep] = useState(null) // rugnummer dat versleept wordt

  const posities = FORMATIES[formatie]
  const gebruikt = new Set(rijen.flat().filter(Boolean))
  const bank = spelers.filter((s) => !gebruikt.has(s.rugnummer))
  const naam = (nr) => spelers.find((s) => s.rugnummer === nr)?.naam ?? ''

  function wisselTeam(nieuw) {
    setTeam(nieuw)
    const pub = opstellingVan(nieuw, w)
    setFormatie(pub?.formatie ?? '4-2-3-1')
    setRijen(pub ? pub.rijen : leegVolgens('4-2-3-1'))
    setMelding('')
  }

  function wisselFormatie(nieuw) {
    setFormatie(nieuw)
    setRijen((oud) => leegVolgens(nieuw, oud))
    setMelding('')
  }

  // Eén speler op één plek; staat hij al ergens anders, dan daar weg (elke speler één keer)
  function zet(r, i, nr) {
    setRijen((oud) => oud.map((rij, ri) => rij.map((x, ii) => (ri === r && ii === i ? nr : x === nr ? null : x))))
    setMelding('')
  }

  // Lege plekken vullen met de eerstvolgende speler van de passende positie
  function vulAan() {
    const vrij = new Set(spelers.map((s) => s.rugnummer).filter((nr) => !gebruikt.has(nr)))
    setRijen((oud) =>
      oud.map((rij, r) =>
        rij.map((nr, i) => {
          if (nr) return nr
          const pos = posities[r][i]
          const kandidaat = spelers.find((s) => vrij.has(s.rugnummer) && s.positie === pos) ?? spelers.find((s) => vrij.has(s.rugnummer))
          if (!kandidaat) return null
          vrij.delete(kandidaat.rugnummer)
          return kandidaat.rugnummer
        }),
      ),
    )
  }

  function publiceer() {
    if (rijen.flat().some((x) => !x)) return setMelding('Vul eerst alle 11 plekken.')
    publiceerOpstelling(team, formatie, rijen)
    setMelding(`Gepubliceerd: de opstelling van ${team === 'vrouwen' ? 'FC Twente Vrouwen' : 'FC Twente'} staat nu op Home, met een melding in de app.`)
  }

  return (
    <div className="adm-opstelling">
      <Kaart
        titel="Opstelling"
        actie={
          <div className="adm-rij">
            <div className="adm-segment" role="radiogroup" aria-label="Team">
              {['mannen', 'vrouwen'].map((t) => (
                <button key={t} type="button" role="radio" aria-checked={team === t} className={team === t ? 'is-actief' : ''} onClick={() => wisselTeam(t)}>
                  {t === 'mannen' ? 'Mannen' : 'Vrouwen'}
                </button>
              ))}
            </div>
            <select value={formatie} onChange={(e) => wisselFormatie(e.target.value)} aria-label="Formatie" className="adm-select">
              {Object.keys(FORMATIES).map((f) => (
                <option key={f}>{f}</option>
              ))}
            </select>
          </div>
        }
      >
        {/* Het veld: spits bovenaan, keeper onderaan */}
        <div className="adm-veld">
          {[...rijen.keys()].reverse().map((r) => (
            <div className="adm-veld__rij" key={r}>
              {rijen[r].map((nr, i) => {
                const pos = posities[r][i]
                const passend = spelers.filter((s) => s.positie === pos)
                const overig = spelers.filter((s) => s.positie !== pos)
                return (
                  <div
                    key={i}
                    className={`adm-plek${nr ? ' is-gevuld' : ''}${sleep ? ' is-doel' : ''}`}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault()
                      const n = Number(e.dataTransfer.getData('text/plain'))
                      if (n) zet(r, i, n)
                      setSleep(null)
                    }}
                  >
                    <span className="adm-plek__pos">{pos === 'Middenvelder' && r === rijen.length - 2 && formatie === '4-2-3-1' ? 'Aanv. middenveld' : RIJNAAM[pos]}</span>
                    <span className="adm-plek__nr">{nr ?? '–'}</span>
                    <select value={nr ?? ''} onChange={(e) => zet(r, i, Number(e.target.value) || null)} aria-label={`${RIJNAAM[pos]}, plek ${i + 1}`}>
                      <option value="">Kies speler</option>
                      <optgroup label={`Past hier (${pos.toLowerCase()})`}>
                        {passend.map((s) => (
                          <option key={s.rugnummer} value={s.rugnummer} disabled={gebruikt.has(s.rugnummer) && s.rugnummer !== nr}>
                            {s.rugnummer} {s.naam}
                          </option>
                        ))}
                      </optgroup>
                      <optgroup label="Overige spelers">
                        {overig.map((s) => (
                          <option key={s.rugnummer} value={s.rugnummer} disabled={gebruikt.has(s.rugnummer) && s.rugnummer !== nr}>
                            {s.rugnummer} {s.naam} ({s.positie?.toLowerCase() ?? 'positie onbekend'})
                          </option>
                        ))}
                      </optgroup>
                    </select>
                    <span className="adm-plek__naam">{nr ? naam(nr) : 'Sleep of kies'}</span>
                  </div>
                )
              })}
            </div>
          ))}
        </div>

        <div className="adm-knoppenrij">
          <button type="button" className="adm-knop adm-knop--licht" onClick={vulAan}>
            <Wand2 size={16} /> Vul aan met suggesties
          </button>
          <button type="button" className="adm-knop adm-knop--primair" onClick={publiceer}>
            Publiceren
          </button>
        </div>
        {melding && <p className={melding.startsWith('Gepubliceerd') ? 'adm-ok' : 'adm-fout'} role="status">{melding}</p>}
      </Kaart>

      <Kaart titel={`Selectie (${bank.length} over)`}>
        <p className="adm-sub">Sleep een speler op een plek, of kies hem in het veld.</p>
        <ul className="adm-bank">
          {bank.map((s) => (
            <li key={s.rugnummer} draggable onDragStart={(e) => { e.dataTransfer.setData('text/plain', String(s.rugnummer)); setSleep(s.rugnummer) }} onDragEnd={() => setSleep(null)}>
              <span className="adm-bank__nr">{s.rugnummer}</span>
              <span>{s.naam}</span>
              <small>{s.positie ?? '–'}</small>
            </li>
          ))}
        </ul>
      </Kaart>
    </div>
  )
}

/* ---------------- Nieuws ---------------- */

const CATEGORIEEN = ['Selectie', 'Club', 'Academie', 'Conference League', 'Vrouwen']

function Nieuws() {
  const w = useDemoDb()
  const [bestand, setBestand] = useState(null)
  const [form, setForm] = useState({ titel: '', categorie: 'Club', samenvatting: '', bron: '', url: '', spelers: [] })
  const [melding, setMelding] = useState('')
  const spelers = spelersVan('mannen')

  useEffect(() => {
    fetch('/nieuws/nieuws.json').then((r) => r.json()).then(setBestand).catch(() => setBestand({ berichten: [] }))
  }, [])

  const gepubliceerd = w.admin.nieuws.gepubliceerd
  const concepten = (bestand?.berichten ?? []).filter((b) => b.status === 'concept' && !gepubliceerd[b.id])
  const zet = (veld, waarde) => setForm((f) => ({ ...f, [veld]: waarde }))

  function verstuur(e) {
    e.preventDefault()
    if (!form.titel.trim() || !form.samenvatting.trim()) return setMelding('Vul minstens een titel en een samenvatting in.')
    publiceerNieuws({ ...form, titel: form.titel.trim(), samenvatting: form.samenvatting.trim(), bron: form.bron.trim() || 'FC Twente', url: form.url.trim() || null })
    setForm({ titel: '', categorie: 'Club', samenvatting: '', bron: '', url: '', spelers: [] })
    setMelding('Gepubliceerd: het bericht staat bovenaan Nieuws, met een melding in de app.')
  }

  return (
    <div className="adm-twee">
      <Kaart titel={`Concepten van de Nieuws-agent (${concepten.length})`}>
        {concepten.length === 0 && <p className="adm-sub">Geen concepten meer. Alles is gepubliceerd.</p>}
        <ul className="adm-concepten">
          {concepten.map((b) => (
            <li key={b.id}>
              <span className="adm-tag">{b.categorie}</span>
              <strong>{b.titel}</strong>
              <p>{b.samenvatting}</p>
              <small>Bron: {b.bron}</small>
              <button type="button" className="adm-knop adm-knop--primair" onClick={() => { publiceerNieuws(b.id); setMelding(`Gepubliceerd: "${b.titel}" staat bovenaan Nieuws.`) }}>
                Publiceren
              </button>
            </li>
          ))}
        </ul>
      </Kaart>

      <Kaart titel="Nieuw bericht">
        <form className="adm-form" onSubmit={verstuur}>
          <label>
            Titel
            <input value={form.titel} onChange={(e) => zet('titel', e.target.value)} maxLength={90} />
          </label>
          <label>
            Categorie
            <select value={form.categorie} onChange={(e) => zet('categorie', e.target.value)}>
              {CATEGORIEEN.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </label>
          <label>
            Samenvatting
            <textarea rows={4} value={form.samenvatting} onChange={(e) => zet('samenvatting', e.target.value)} maxLength={400} />
          </label>
          <div className="adm-form__twee">
            <label>
              Bron
              <input value={form.bron} onChange={(e) => zet('bron', e.target.value)} placeholder="bv. FC Twente" />
            </label>
            <label>
              Bronlink
              <input type="url" value={form.url} onChange={(e) => zet('url', e.target.value)} placeholder="https://…" />
            </label>
          </div>
          <fieldset>
            <legend>Gekoppelde spelers</legend>
            <div className="adm-chips">
              {spelers.map((s) => {
                const aan = form.spelers.includes(s.rugnummer)
                return (
                  <button
                    key={s.rugnummer}
                    type="button"
                    className={`adm-chip${aan ? ' is-actief' : ''}`}
                    aria-pressed={aan}
                    onClick={() => zet('spelers', aan ? form.spelers.filter((n) => n !== s.rugnummer) : [...form.spelers, s.rugnummer])}
                  >
                    {s.rugnummer} {s.naam.split(' ').slice(1).join(' ') || s.naam}
                  </button>
                )
              })}
            </div>
          </fieldset>
          <button type="submit" className="adm-knop adm-knop--primair">Publiceren</button>
        </form>
        {melding && <p className={melding.startsWith('Gepubliceerd') ? 'adm-ok' : 'adm-fout'} role="status">{melding}</p>}
      </Kaart>
    </div>
  )
}

/* ---------------- Deals ---------------- */

const AFBEELDINGEN = [
  { id: '', label: 'Effen tegel met titel' },
  { id: 'deal-broodje-beenham', label: 'Broodje beenham', src: '/home/deal-broodje-beenham.png' },
  { id: 'deal-twentsen-halven', label: 'Twentsen halven', src: '/home/deal-twentsen-halven.png' },
]

function Deals() {
  const w = useDemoDb()
  const deals = dealStats(w)
  const [form, setForm] = useState({ titel: '', omschrijving: '', geldigTot: '', afbeelding: '' })
  const [melding, setMelding] = useState('')
  const zet = (veld, waarde) => setForm((f) => ({ ...f, [veld]: waarde }))

  function verstuur(e) {
    e.preventDefault()
    if (!form.titel.trim()) return setMelding('Geef de deal een titel.')
    publiceerDeal({ ...form, titel: form.titel.trim(), afbeelding: form.afbeelding || null })
    setForm({ titel: '', omschrijving: '', geldigTot: '', afbeelding: '' })
    setMelding('Gepubliceerd: de deal staat op Aanbiedingen, met eigen QR-codes.')
  }

  return (
    <div className="adm-twee">
      <Kaart titel="Nieuwe deal">
        <form className="adm-form" onSubmit={verstuur}>
          <label>
            Titel
            <input value={form.titel} onChange={(e) => zet('titel', e.target.value)} maxLength={60} placeholder="bv. Gratis koffie bij de rust" />
          </label>
          <label>
            Omschrijving
            <textarea rows={3} value={form.omschrijving} onChange={(e) => zet('omschrijving', e.target.value)} maxLength={160} />
          </label>
          <label>
            Geldig tot
            <input type="date" value={form.geldigTot} onChange={(e) => zet('geldigTot', e.target.value)} />
          </label>
          <fieldset>
            <legend>Afbeelding</legend>
            <div className="adm-afbeeldingen">
              {AFBEELDINGEN.map((a) => (
                <label key={a.id} className={`adm-afbeelding${form.afbeelding === a.id ? ' is-actief' : ''}`}>
                  <input type="radio" name="afbeelding" value={a.id} checked={form.afbeelding === a.id} onChange={() => zet('afbeelding', a.id)} />
                  {a.src ? <img src={a.src} alt="" /> : <span className="adm-afbeelding__effen">{form.titel || 'Titel'}</span>}
                  <small>{a.label}</small>
                </label>
              ))}
            </div>
          </fieldset>
          <button type="submit" className="adm-knop adm-knop--primair">Publiceren</button>
        </form>
        {melding && <p className={melding.startsWith('Gepubliceerd') ? 'adm-ok' : 'adm-fout'} role="status">{melding}</p>}
      </Kaart>

      <Kaart titel="Deals in de app">
        <table className="adm-tabel">
          <thead>
            <tr>
              <th>Deal</th>
              <th>Codes</th>
              <th>Ingewisseld</th>
              <th>Zichtbaar</th>
            </tr>
          </thead>
          <tbody>
            {deals.map((d) => (
              <tr key={d.id}>
                <td>
                  {d.titel} {d.eigen && <span className="adm-tag">Nieuw</span>}
                </td>
                <td>{d.codesAangemaakt.toLocaleString('nl-NL')}</td>
                <td>{d.ingewisseld.toLocaleString('nl-NL')}</td>
                <td>
                  <button type="button" role="switch" aria-checked={d.aan} className={`adm-schakel${d.aan ? ' is-aan' : ''}`} onClick={() => zetDealAan(d.id, !d.aan)} aria-label={`${d.titel} ${d.aan ? 'uitzetten' : 'aanzetten'}`}>
                    <i />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Kaart>
    </div>
  )
}

/* ---------------- Weetjes ---------------- */

function Weetjes() {
  const w = useDemoDb()
  const [uitData, setUitData] = useState([])
  useEffect(() => {
    laadDataWeetjes().then(setUitData).catch(() => {})
  }, [])

  const { gepubliceerd, verborgen } = w.admin.weetjes
  // Van de Weetjes-agent: het weetje tussen aanhalingstekens in het seintje
  const vanAgent = START.agents.filter((a) => a.agent === 'Weetjes-agent').map((a) => a.bericht.match(/'(.+)'/)?.[1]).filter(Boolean)
  const rijen = [
    ...vanAgent.filter((t) => !uitData.includes(t)).map((t) => ({ tekst: t, bron: 'Weetjes-agent', zichtbaar: gepubliceerd.includes(t) })),
    ...gepubliceerd.filter((t) => !uitData.includes(t) && !vanAgent.includes(t)).map((t) => ({ tekst: t, bron: 'Admin', zichtbaar: true })),
    ...uitData.map((t) => ({ tekst: t, bron: 'maakWeetjes()', zichtbaar: !verborgen.includes(t) })),
  ]

  return (
    <Kaart titel={`Weetjes (${rijen.filter((r) => r.zichtbaar).length} zichtbaar)`}>
      <ul className="adm-weetjes">
        {rijen.map((r) => (
          <li key={r.tekst} className={r.zichtbaar ? '' : 'is-verborgen'}>
            <span className="adm-tag">{r.bron}</span>
            <p>{r.tekst}</p>
            {r.zichtbaar ? (
              <button type="button" className="adm-knop adm-knop--licht" onClick={() => verbergWeetje(r.tekst)}>Verbergen</button>
            ) : (
              <button type="button" className="adm-knop adm-knop--primair" onClick={() => publiceerWeetje(r.tekst)}>Publiceren</button>
            )}
          </li>
        ))}
      </ul>
    </Kaart>
  )
}
