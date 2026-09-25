import { Bar, BarChart, Cell, LabelList, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { START, useDemoDb } from '../lib/demoDb'
import { dealStats, motmStats, openAgents, quizStats, stickerStats, ticketStats, voorspelStats, webshopStats } from '../lib/demoStats'
import { KLEUR, REEKS, Kaart, Kop, Kpi, TOOLTIP, getal, procent } from './ui'

// Dashboard: kerncijfers en de laatste resultaten. Alles = startwaarden +
// wat er live in de app gebeurt; stem in de app en het getal loopt hier op.
const PSV = 'mannen-2026-09-20'
const FORTUNA = 'mannen-2026-10-10'
const FANTYPE_NAAM = {
  hardekern: 'Harde kern',
  seizoenskaart: 'Seizoenskaart',
  gemiddeld: 'Gemiddeld',
  losse: 'Losse bezoeker',
  gezin: 'Gezin',
  afstand: 'Op afstand',
}
const achternaam = (naam) => naam.split(' ').slice(1).join(' ') || naam

export default function Dashboard({ ga }) {
  const w = useDemoDb()
  const o = START.overzicht
  const motm = motmStats(PSV, w)
  const quiz = quizStats(w)
  const voorspel = voorspelStats(FORTUNA, w)
  const tickets = ticketStats(w)
  const shop = webshopStats(w)
  const stickers = stickerStats(w).reduce((a, s) => a + s.geclaimd, 0)
  const deals = dealStats(w)
  const open = openAgents(w)

  const fantypes = Object.entries(o.fantypes).map(([id, n]) => ({ naam: FANTYPE_NAAM[id] ?? id, waarde: n }))
  const motmData = motm.rijen.slice(0, 6).map((r) => ({ naam: achternaam(r.speler.naam), stemmen: r.aantal }))
  const topUitslag = voorspel.top[0]

  return (
    <>
      <Kop titel="Dashboard" uitleg="Startwaarden van de demo plus alles wat er nu live in de app gebeurt." />

      <div className="adm-kpis">
        <Kpi label="Gebruikers" waarde={getal(o.gebruikers)} accent />
        <Kpi label="Actief deze week" waarde={getal(o.actiefDezeWeek)} sub={procent((o.actiefDezeWeek / o.gebruikers) * 100)} />
        <Kpi label="Actief vandaag" waarde={getal(o.actiefVandaag)} sub={`${o.gemiddeldeSessieMin.toLocaleString('nl-NL')} min per sessie`} />
        <Kpi label="Pushmeldingen aan" waarde={procent(o['pushOptIn%'])} />
      </div>

      <div className="adm-raster">
        <Kaart titel="Man of the Match · Twente – PSV" className="adm-breed" actie={<span className="adm-tag">{getal(motm.totaal)} stemmen</span>}>
          <div className="adm-grafiek">
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={motmData} margin={{ top: 22, right: 8, left: -18, bottom: 0 }}>
                <XAxis dataKey="naam" tickLine={false} axisLine={false} fontSize={12} />
                <YAxis tickLine={false} axisLine={false} fontSize={11} />
                <Tooltip {...TOOLTIP} formatter={(v) => [getal(v), 'stemmen']} />
                <Bar dataKey="stemmen" radius={[6, 6, 0, 0]} isAnimationActive={false}>
                  {motmData.map((d, i) => (
                    <Cell key={d.naam} fill={i === 0 ? KLEUR.rood : KLEUR.grijs} />
                  ))}
                  <LabelList dataKey="stemmen" position="top" fontSize={12} fontWeight={700} formatter={getal} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Kaart>

        <Kaart titel="Fantypes">
          <div className="adm-grafiek">
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={fantypes} dataKey="waarde" nameKey="naam" innerRadius={52} outerRadius={88} paddingAngle={2} isAnimationActive={false}>
                  {fantypes.map((f, i) => (
                    <Cell key={f.naam} fill={REEKS[i % REEKS.length]} />
                  ))}
                </Pie>
                <Tooltip {...TOOLTIP} formatter={(v, n) => [getal(v), n]} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <ul className="adm-legenda">
            {fantypes.map((f, i) => (
              <li key={f.naam}>
                <i style={{ background: REEKS[i % REEKS.length] }} />
                {f.naam} <strong>{getal(f.waarde)}</strong>
              </li>
            ))}
          </ul>
        </Kaart>

        <Kaart titel="Weekquiz">
          <p className="adm-groot">{procent(quiz.procentAllesGoed)}</p>
          <p className="adm-sub">had alles goed · {getal(quiz.allesGoed)} van {getal(quiz.deelnemers)} spelers</p>
        </Kaart>

        <Kaart titel="Meest voorspeld · Fortuna – Twente">
          <p className="adm-groot">{topUitslag?.uitslag ?? '–'}</p>
          <p className="adm-sub">
            {topUitslag ? `${getal(topUitslag.aantal)} keer (${procent(topUitslag.procent)})` : ''} · {getal(voorspel.voorspellers)} voorspellers
          </p>
        </Kaart>

        <Kaart titel="Doorverkoop tickets">
          <p className="adm-groot">
            {getal(tickets.verkocht)}
            <small> / {getal(tickets.aangeboden)}</small>
          </p>
          <p className="adm-sub">verkocht van aangeboden · gemiddeld binnen {tickets.binnenUur.toLocaleString('nl-NL')} uur</p>
        </Kaart>

        <Kaart titel="Shirts besteld">
          <p className="adm-groot">{getal(shop.shirtsBesteld)}</p>
          <p className="adm-sub">thuis, uit en Vrouwen samen</p>
        </Kaart>

        <Kaart titel="Stickers geclaimd">
          <p className="adm-groot">{getal(stickers)}</p>
          <p className="adm-sub">in het digitale plakboek</p>
        </Kaart>

        <Kaart titel="Deals ingewisseld">
          <p className="adm-groot">{getal(deals.reduce((a, d) => a + d.ingewisseld, 0))}</p>
          <p className="adm-sub">van {getal(deals.reduce((a, d) => a + d.codesAangemaakt, 0))} codes aangemaakt</p>
        </Kaart>

        <Kaart titel="Agents" actie={<button type="button" className="adm-link" onClick={() => ga('agents')}>Bekijk</button>}>
          <p className={`adm-groot${open ? ' is-rood' : ''}`}>{open}</p>
          <p className="adm-sub">open {open === 1 ? 'seintje' : 'seintjes'} met een actie</p>
        </Kaart>
      </div>
    </>
  )
}
