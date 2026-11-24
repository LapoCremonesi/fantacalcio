import { useState } from 'react'
import type { League, Matchday, Team } from '../types'
import { articlesFor, fmt } from '../lib/autonews'
import { shortDate } from '../lib/dates'
import { href } from '../lib/route'
import { dayStats, playedDays, positionHistory, scored, standings, teamMap } from '../lib/standings'
import { Badge } from './Badge'
import { Delta, Form, Scoreline, StandingsTable } from './Tables'

/* ──────────────────────────────── Articolo ──────────────────────────────── */

export function ArticlePage({ league, day, id }: { league: League; day: Matchday; id?: string }) {
  const teams = teamMap(league)
  const all = articlesFor(day, league)
  const a = all.find((x) => x.id === id)
  if (!a) {
    return (
      <div className="empty-page">
        <h2>Articolo non trovato</h2>
        <p>Forse è stato censurato dal presidente di lega.</p>
        <a href={href({ section: 'prima', day: day.number })}>← Torna alla prima pagina</a>
      </div>
    )
  }
  const others = all.filter((x) => x !== a).slice(0, 4)
  return (
    <div className="article-page">
      <article className="article">
        <a className="back" href={href({ section: 'prima', day: day.number })}>
          ← Prima pagina · {day.number}ª giornata
        </a>
        {a.kicker && <p className="kicker">{a.kicker}</p>}
        <h2 className="article-title">{a.title}</h2>
        {a.subtitle && <p className="lead-sub">{a.subtitle}</p>}
        <div className="article-meta">
          <span className="byline">{a.author}</span>
          {!!a.teams?.length && (
            <span className="article-teams">
              {a.teams.map((t) => {
                const team = teams.get(t)
                return team ? (
                  <span key={t} className="team-tag">
                    <Badge team={team} size={16} />
                    {team.name}
                  </span>
                ) : null
              })}
            </span>
          )}
        </div>
        <div className="article-body">
          {a.body.map((p, i) => (
            <p key={i} className={i === 0 ? 'dropcap' : ''}>
              {p}
            </p>
          ))}
          {a.quote && (
            <blockquote className="pull">
              «{a.quote.text}»<cite>{a.quote.by}</cite>
            </blockquote>
          )}
        </div>
      </article>
      {others.length > 0 && (
        <aside className="article-more">
          <h4 className="section-title">Leggi anche</h4>
          {others.map((o) => (
            <a key={o.id} className="more-link" href={href({ section: 'articolo', day: day.number, articleId: o.id })}>
              {o.kicker && <span className="kicker">{o.kicker}</span>}
              <span>{o.title}</span>
            </a>
          ))}
        </aside>
      )}
    </div>
  )
}

/* ─────────────────────────────── Classifica ─────────────────────────────── */

function lineColor(t: Team): string {
  const lum = (hex: string) => {
    const h = hex.replace('#', '')
    const [r, g, b] = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255)
    return 0.2126 * r + 0.7152 * g + 0.0722 * b
  }
  return lum(t.colors[0]) > 0.7 ? t.colors[1] : t.colors[0]
}

function BumpChart({ league, upTo }: { league: League; upTo: number }) {
  const [hover, setHover] = useState<string | null>(null)
  const hist = positionHistory(league, upTo)
  const n = league.teams.length
  const days = playedDays(league).filter((d) => d.number <= upTo)
  if (days.length < 2) return null
  const W = 760
  const H = 34 * n + 40
  const padL = 30
  const padR = 60
  const padT = 20
  const x = (i: number) => padL + (i * (W - padL - padR)) / (days.length - 1)
  const y = (pos: number) => padT + (pos - 1) * ((H - padT - 26) / (n - 1))
  return (
    <figure className="bump">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Andamento delle posizioni in classifica giornata per giornata">
        {Array.from({ length: n }, (_, i) => (
          <g key={i}>
            <line x1={padL} x2={W - padR} y1={y(i + 1)} y2={y(i + 1)} className="bump-grid" />
            <text x={padL - 12} y={y(i + 1) + 4} className="bump-axis" textAnchor="end">
              {i + 1}
            </text>
          </g>
        ))}
        {days.map((d, i) => (
          <text key={d.number} x={x(i)} y={H - 6} className="bump-axis" textAnchor="middle">
            {d.number}
          </text>
        ))}
        {league.teams.map((t) => {
          const ps = hist.get(t.id) ?? []
          const dim = hover && hover !== t.id
          const c = lineColor(t)
          return (
            <g
              key={t.id}
              className="bump-line"
              style={{ opacity: dim ? 0.12 : 1 }}
              onMouseEnter={() => setHover(t.id)}
              onMouseLeave={() => setHover(null)}
            >
              <polyline
                points={ps.map((p, i) => `${x(i)},${y(p)}`).join(' ')}
                fill="none"
                stroke={c}
                strokeWidth={hover === t.id ? 4 : 2.5}
                strokeLinejoin="round"
                strokeLinecap="round"
              />
              {ps.map((p, i) => (
                <circle key={i} cx={x(i)} cy={y(p)} r={3.5} fill={c} stroke="var(--paper)" strokeWidth="1.5">
                  <title>
                    {t.name} · {days[i].number}ª giornata: {p}°
                  </title>
                </circle>
              ))}
              <text x={W - padR + 10} y={y(ps[ps.length - 1]) + 4} className="bump-label" fill={c}>
                {t.short}
              </text>
            </g>
          )
        })}
      </svg>
      <figcaption>Le posizioni giornata per giornata. Passa sopra una linea per evidenziare la squadra.</figcaption>
    </figure>
  )
}

export function StandingsPage({ league, day }: { league: League; day: Matchday }) {
  const upTo = day.results.length ? day.number : day.number - 1
  const rows = standings(league, upTo)
  if (!rows.length || !rows[0].played) return <div className="empty-page"><h2>Classifica ancora vuota</h2></div>
  const best = (f: (r: (typeof rows)[number]) => number, dir = 1) => [...rows].sort((a, b) => dir * (f(b) - f(a)))[0]
  const attack = best((r) => r.gf)
  const defense = best((r) => r.ga, -1)
  const fp = best((r) => r.fantapoints)
  // Il più sfortunato: chi è più in basso in classifica rispetto ai fantapunti fatti
  const fpRank = new Map([...rows].sort((a, b) => b.fantapoints - a.fantapoints).map((r, i) => [r.team.id, i + 1]))
  const unlucky = best((r) => r.pos - fpRank.get(r.team.id)!)
  const facts = [
    { k: 'Miglior attacco', t: attack.team, v: `${attack.gf} gol` },
    { k: 'Miglior difesa', t: defense.team, v: `${defense.ga} subiti` },
    { k: 'Più fantapunti', t: fp.team, v: fmt(fp.fantapoints) },
    ...(unlucky.pos > fpRank.get(unlucky.team.id)!
      ? [{ k: 'Il più sfortunato', t: unlucky.team, v: `${fpRank.get(unlucky.team.id)}° per fantapunti, ${unlucky.pos}° in classifica` }]
      : []),
  ]
  return (
    <div className="page">
      <header className="page-head">
        <p className="kicker">Dopo la {upTo}ª giornata</p>
        <h2>La classifica</h2>
        <p className="lead-sub">
          {rows[0].team.name} comanda con {rows[0].points} punti
          {rows[1] && rows[0].points > rows[1].points
            ? `, ${rows[0].points - rows[1].points} di vantaggio su ${rows[1].team.name}.`
            : rows[1]
              ? `, appaiato a ${rows[1].team.name} ma davanti per fantapunti.`
              : '.'}
        </p>
      </header>
      <div className="box">
        <StandingsTable rows={rows} />
        <p className="legend">
          <span className="lg lg-top" /> Scudetto <span className="lg lg-euro" /> Podio <span className="lg lg-last" /> Cucchiaio di legno ·
          A parità di punti conta la somma dei fantapunti.
        </p>
      </div>
      <div className="facts">
        {facts.map((f) => (
          <div key={f.k} className="fact">
            <p className="spot-label">{f.k}</p>
            <p className="fact-team">
              <Badge team={f.t} size={22} /> {f.t.name}
            </p>
            <p className="fact-v">{f.v}</p>
          </div>
        ))}
      </div>
      <h4 className="section-title">L’andamento</h4>
      <BumpChart league={league} upTo={upTo} />
    </div>
  )
}

/* ──────────────────────────────── Risultati ─────────────────────────────── */

export function ResultsPage({ league, day }: { league: League; day: Matchday }) {
  const teams = teamMap(league)
  const days = playedDays(league).reverse()
  return (
    <div className="page">
      <header className="page-head">
        <p className="kicker">Stagione {league.season}</p>
        <h2>Tutti i risultati</h2>
        <p className="lead-sub">Giornata per giornata, con i fantapunti sotto ogni punteggio.</p>
      </header>
      <div className="results-grid">
        {days.map((d) => {
          const s = dayStats(d, league)
          return (
            <section key={d.number} className={`box results-day ${d.number === day.number ? 'current' : ''}`}>
              <h4 className="box-title">
                <a href={href({ section: 'prima', day: d.number })}>{d.number}ª giornata</a>
                <span>{shortDate(d.date)}</span>
              </h4>
              {s.matches.map((m) => (
                <Scoreline key={m.home + m.away} m={m} teams={teams} />
              ))}
            </section>
          )
        })}
      </div>
    </div>
  )
}

/* ───────────────────────────────── Squadre ──────────────────────────────── */

export function TeamsPage({ league, day }: { league: League; day: Matchday }) {
  const upTo = day.results.length ? day.number : day.number - 1
  const rows = standings(league, upTo)
  const days = playedDays(league).filter((d) => d.number <= upTo)
  return (
    <div className="page">
      <header className="page-head">
        <p className="kicker">Le protagoniste</p>
        <h2>Le squadre</h2>
        <p className="lead-sub">Presidenti, motti e numeri di chi si contende il titolo (e chi il cucchiaio di legno).</p>
      </header>
      <div className="teams-grid">
        {rows.map((r) => {
          const scores = days.flatMap((d) =>
            d.results
              .map((m) => scored(m, league))
              .filter((m) => m.home === r.team.id || m.away === r.team.id)
              .map((m) => ({ day: d.number, pts: m.home === r.team.id ? m.homePoints : m.awayPoints })),
          )
          const max = scores.reduce((a, b) => (b.pts > a.pts ? b : a), scores[0])
          const min = scores.reduce((a, b) => (b.pts < a.pts ? b : a), scores[0])
          const avg = scores.reduce((s, x) => s + x.pts, 0) / (scores.length || 1)
          return (
            <article key={r.team.id} className="team-card" style={{ ['--c1' as string]: r.team.colors[0], ['--c2' as string]: r.team.colors[1] }}>
              <div className="team-card-band" />
              <div className="team-card-head">
                <Badge team={r.team} size={52} />
                <div>
                  <h3>{r.team.name}</h3>
                  {r.team.manager && <p className="team-manager">Presidente: {r.team.manager}</p>}
                </div>
                <span className="team-pos">
                  {r.pos}°
                  <Delta d={r.delta} />
                </span>
              </div>
              {r.team.motto && <p className="team-motto">«{r.team.motto}»</p>}
              <dl className="team-stats">
                <div>
                  <dt>Punti</dt>
                  <dd>{r.points}</dd>
                </div>
                <div>
                  <dt>V-N-P</dt>
                  <dd>
                    {r.won}-{r.drawn}-{r.lost}
                  </dd>
                </div>
                <div>
                  <dt>Media</dt>
                  <dd>{fmt(avg)}</dd>
                </div>
                {max && (
                  <div>
                    <dt>Record</dt>
                    <dd>
                      {fmt(max.pts)} <small>({max.day}ª)</small>
                    </dd>
                  </div>
                )}
                {min && (
                  <div>
                    <dt>Minimo</dt>
                    <dd>
                      {fmt(min.pts)} <small>({min.day}ª)</small>
                    </dd>
                  </div>
                )}
              </dl>
              <Spark values={scores.map((s) => s.pts)} />
              <div className="team-form">
                <span className="spot-label">Forma</span> <Form form={r.form} />
              </div>
            </article>
          )
        })}
      </div>
    </div>
  )
}

function Spark({ values }: { values: number[] }) {
  if (values.length < 2) return null
  const W = 240
  const H = 40
  const lo = Math.min(...values, 60)
  const hi = Math.max(...values, 80)
  const x = (i: number) => (i * W) / (values.length - 1)
  const y = (v: number) => H - 4 - ((v - lo) / (hi - lo)) * (H - 8)
  const threshold = y(66)
  return (
    <svg className="spark" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" aria-label="Fantapunti per giornata">
      <line x1="0" x2={W} y1={threshold} y2={threshold} className="spark-th" />
      <polyline points={values.map((v, i) => `${x(i)},${y(v)}`).join(' ')} fill="none" className="spark-line" />
    </svg>
  )
}

/* ──────────────────────────────── Archivio ──────────────────────────────── */

export function ArchivePage({ league }: { league: League }) {
  const days = playedDays(league).reverse()
  return (
    <div className="page">
      <header className="page-head">
        <p className="kicker">Emeroteca</p>
        <h2>L’archivio</h2>
        <p className="lead-sub">Tutte le prime pagine della stagione {league.season}.</p>
      </header>
      <div className="archive-grid">
        {days.map((d) => {
          const lead = articlesFor(d, league).find((a) => a.kind === 'apertura')
          return (
            <a key={d.number} className="archive-card" href={href({ section: 'prima', day: d.number })}>
              <span className="archive-mast">{league.newspaper}</span>
              <span className="archive-meta">
                N. {d.number}
                {d.date && ` · ${shortDate(d.date)}`}
              </span>
              <span className="archive-title">{lead?.title ?? `${d.number}ª giornata`}</span>
            </a>
          )
        })}
      </div>
    </div>
  )
}
