import { Bar, BarChart, Cell, LabelList, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { START, useDemoDb } from '../lib/demoDb'
import { dealStats, motmStats, pollStats, quizStats, rossieStats, stickerStats, ticketStats, voorspelStats, webshopStats } from '../lib/demoStats'
import { KLEUR, Kaart, Kop, Kpi, TOOLTIP, euro, getal, procent } from './ui'

// Data: alle cijfers = startwaarden (demo-database.json) + wat er live in de
// app gebeurt. Stem, speel de quiz of bestel in de app en het verschuift hier.
const PSV = 'mannen-2026-09-20'
const FORTUNA = 'mannen-2026-10-10'
const achternaam = (naam) => naam.split(' ').slice(1).join(' ') || naam

// Liggende staafgrafiek met labels, clubrood voor de hoogste
function Staven({ data, sleutel = 'waarde', label = 'naam', hoogte, eenheid = '', breedteLabel = 120 }) {
  const max = Math.max(...data.map((d) => d[sleutel]))
  return (
    <div className="adm-grafiek">
      <ResponsiveContainer width="100%" height={hoogte ?? Math.max(120, data.length * 38)}>
        <BarChart data={data} layout="vertical" margin={{ top: 4, right: 56, left: 0, bottom: 4 }}>
          <XAxis type="number" hide />
          <YAxis type="category" dataKey={label} width={breedteLabel} tickLine={false} axisLine={false} fontSize={12} />
          <Tooltip {...TOOLTIP} formatter={(v) => [`${getal(v)}${eenheid}`, '']} />
          <Bar dataKey={sleutel} radius={[0, 6, 6, 0]} isAnimationActive={false}>
            {data.map((d, i) => (
              <Cell key={i} fill={d[sleutel] === max ? KLEUR.rood : KLEUR.grijs} />
            ))}
            <LabelList dataKey={sleutel} position="right" fontSize={12} fontWeight={700} formatter={(v) => `${getal(v)}${eenheid}`} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

export default function Data() {
  const w = useDemoDb()
  const motm = motmStats(PSV, w)
  const polls = pollStats(w)
  const quiz = quizStats(w)
  const voorspel = voorspelStats(FORTUNA, w)
  const psvGoed = START.voorspellingen.uitslagTwentePsvGoedVoorspeld
  const tickets = ticketStats(w)
  const shop = webshopStats(w)
  const deals = dealStats(w)
  const rossie = rossieStats(w)
  const stickers = stickerStats(w)

  const benJeErbij = [
    { naam: 'Ja', waarde: tickets.benJeErbij.ja },
    { naam: 'Nee', waarde: tickets.benJeErbij.nee },
    { naam: 'Nog niet', waarde: tickets.benJeErbij.nogNiet },
  ]

  return (
    <>
      <Kop titel="Data" uitleg="Startwaarden plus alles wat er live in de app gebeurt." />

      <h2 className="adm-sectie">Stemmen & polls</h2>
      <div className="adm-raster">
        <Kaart titel="Man of the Match · Twente – PSV" actie={<span className="adm-tag">{getal(motm.totaal)} stemmen</span>}>
          <Staven data={[...motm.rijen.map((r) => ({ naam: achternaam(r.speler.naam), waarde: r.aantal })), ...(motm.overig ? [{ naam: 'Overig', waarde: motm.overig }] : [])]} />
        </Kaart>
        {polls.map((p) => (
          <Kaart key={p.id} titel={p.vraag} actie={<span className="adm-tag">{getal(p.totaal)} stemmen</span>}>
            <Staven data={p.opties.map((o, i) => ({ naam: o, waarde: p.telling[i] }))} breedteLabel={150} />
          </Kaart>
        ))}
      </div>

      <h2 className="adm-sectie">Weekquiz</h2>
      <div className="adm-kpis">
        <Kpi label="Deelnemers" waarde={getal(quiz.deelnemers)} />
        <Kpi label="Alles goed" waarde={procent(quiz.procentAllesGoed)} sub={`${getal(quiz.allesGoed)} spelers`} accent />
        <Kpi label="Gemiddelde score" waarde={START.quiz.gemiddeldeScore} sub="startwaarde" />
      </div>
      <Kaart titel="Per vraag: % goed">
        <Staven data={quiz.perVraag.map((v) => ({ naam: v.vraag, waarde: v.procent }))} eenheid="%" breedteLabel={260} />
      </Kaart>

      <h2 className="adm-sectie">Voorspellingen</h2>
      <div className="adm-raster">
        <Kaart titel="Fortuna Sittard – FC Twente" actie={<span className="adm-tag">{getal(voorspel.voorspellers)} voorspellers</span>}>
          <Staven data={voorspel.top.slice(0, 8).map((t) => ({ naam: t.uitslag, waarde: t.aantal }))} breedteLabel={60} />
        </Kaart>
        <Kaart titel="Twente – PSV (3-2) goed voorspeld">
          <div className="adm-kpis adm-kpis--klein">
            <Kpi label="Voorspellers" waarde={getal(psvGoed.voorspellers)} />
            <Kpi label="Winnaar goed" waarde={getal(psvGoed.winnaarGoed)} sub={procent((psvGoed.winnaarGoed / psvGoed.voorspellers) * 100)} />
            <Kpi label="Precies 3-2" waarde={getal(psvGoed['exactGoed(3-2)'])} sub={procent((psvGoed['exactGoed(3-2)'] / psvGoed.voorspellers) * 100)} accent />
          </div>
        </Kaart>
      </div>

      <h2 className="adm-sectie">Tickets</h2>
      <div className="adm-raster">
        <Kaart titel="Losse tickets via de app">
          <div className="adm-kpis adm-kpis--klein">
            <Kpi label="Mannen" waarde={getal(tickets.losMannen)} />
            <Kpi label="Vrouwen" waarde={getal(tickets.losVrouwen)} />
          </div>
        </Kaart>
        <Kaart titel="Doorverkoop">
          <div className="adm-kpis adm-kpis--klein">
            <Kpi label="Aangeboden" waarde={getal(tickets.aangeboden)} accent />
            <Kpi label="Verkocht" waarde={getal(tickets.verkocht)} sub={`gem. binnen ${tickets.binnenUur.toLocaleString('nl-NL')} uur`} />
          </div>
        </Kaart>
        <Kaart titel={`Ben je erbij? · ${tickets.benJeErbij.wedstrijd}`}>
          <div className="adm-grafiek">
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={benJeErbij} dataKey="waarde" nameKey="naam" innerRadius={44} outerRadius={72} isAnimationActive={false}>
                  <Cell fill="#1f7a3f" />
                  <Cell fill={KLEUR.rood} />
                  <Cell fill={KLEUR.grijs} />
                </Pie>
                <Tooltip {...TOOLTIP} formatter={(v, n) => [getal(v), n]} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <p className="adm-sub">
            Ja {getal(tickets.benJeErbij.ja)} · Nee {getal(tickets.benJeErbij.nee)} · Nog niet {getal(tickets.benJeErbij.nogNiet)}
          </p>
        </Kaart>
      </div>

      <h2 className="adm-sectie">Webshop</h2>
      <div className="adm-kpis">
        <Kpi label="Omzet deze maand" waarde={euro(shop.omzet)} accent />
        <Kpi label="Bestellingen in de app (live)" waarde={getal(shop.bestellingen.length)} />
      </div>
      <Kaart titel="Voorraad per maat" actie={<span className="adm-tag is-rood">Rood = onder de drempel</span>}>
        <div className="adm-tabel-wrap">
          <table className="adm-tabel">
            <thead>
              <tr>
                <th>Product</th>
                <th>Besteld</th>
                <th>Voorraad per maat</th>
                <th>Drempel</th>
              </tr>
            </thead>
            <tbody>
              {shop.producten.map((p) => (
                <tr key={p.id}>
                  <td>{p.naam}</td>
                  <td>{getal(p.besteld)}</td>
                  <td>
                    <div className="adm-maten">
                      {Object.entries(p.voorraadNu).map(([maat, n]) => (
                        <span key={maat} className={n < p.drempel ? 'is-laag' : ''}>
                          {maat} <strong>{n}</strong>
                        </span>
                      ))}
                    </div>
                  </td>
                  <td>{p.drempel}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Kaart>

      <h2 className="adm-sectie">Deals</h2>
      <Kaart titel="Codes aangemaakt en ingewisseld">
        <Staven data={deals.map((d) => ({ naam: d.titel, waarde: d.codesAangemaakt }))} breedteLabel={220} />
        <p className="adm-sub">Ingewisseld: {deals.map((d) => `${d.titel} ${getal(d.ingewisseld)}`).join(' · ')}</p>
      </Kaart>

      <h2 className="adm-sectie">Rossie</h2>
      <div className="adm-kpis">
        <Kpi label="Gesprekken" waarde={getal(rossie.gesprekken)} accent />
      </div>
      <Kaart titel="Top 10 meest gestelde vragen" actie={<span className="adm-tag">live aangevuld</span>}>
        <ol className="adm-toplijst">
          {rossie.top.map((v) => (
            <li key={v.vraag}>
              <span>{v.vraag}</span>
              {v.nieuw && <span className="adm-tag is-rood">Nieuw</span>}
              <strong>{getal(v.aantal)}</strong>
            </li>
          ))}
        </ol>
      </Kaart>

      <h2 className="adm-sectie">Stickers</h2>
      <Kaart titel="Geclaimd per wedstrijd">
        <table className="adm-tabel">
          <thead>
            <tr>
              <th>Wedstrijd</th>
              <th>Geclaimd</th>
              <th>Waarvan op afstand</th>
            </tr>
          </thead>
          <tbody>
            {stickers.map((s) => (
              <tr key={s.id}>
                <td>{s.id.replace(/^\d{4}-\d{2}-\d{2}-?/, '').replace(/-/g, ' ') || s.datum} <small className="adm-sub">{s.datum}</small></td>
                <td>{getal(s.geclaimd)}</td>
                <td>
                  {getal(s.waarvanOpAfstand)} <small className="adm-sub">({procent((s.waarvanOpAfstand / Math.max(1, s.geclaimd)) * 100)})</small>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Kaart>
    </>
  )
}
