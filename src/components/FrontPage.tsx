import type { Article, League, Matchday, PlayerSpotlight, Team } from '../types'
import { articlesFor, fmt } from '../lib/autonews'
import { href } from '../lib/route'
import { dayStats, standings, teamMap } from '../lib/standings'
import { nextFixtures } from '../data/league'
import { Badge } from './Badge'
import { Fixture, Scoreline, StandingsTable } from './Tables'

interface Props {
  league: League
  day: Matchday
}

const link = (day: number, a: Article) => href({ section: 'articolo', day, articleId: a.id })

function Byline({ a }: { a: Article }) {
  return <p className="byline">{a.author}</p>
}

function Kicker({ text }: { text?: string }) {
  return text ? <p className="kicker">{text}</p> : null
}

function Lead({ a, day }: { a: Article; day: number }) {
  return (
    <article className="lead">
      <Kicker text={a.kicker} />
      <h2 className="lead-title">
        <a href={link(day, a)}>{a.title}</a>
      </h2>
      {a.subtitle && <p className="lead-sub">{a.subtitle}</p>}
      <Byline a={a} />
      <div className="lead-body columns">
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
  )
}

function Teaser({ a, day, teams, size = 'md' }: { a: Article; day: number; teams: Map<string, Team>; size?: 'sm' | 'md' }) {
  const first = a.body[0] ?? ''
  return (
    <article className={`teaser teaser-${size} kind-${a.kind}`}>
      <Kicker text={a.kicker} />
      <h3>
        <a href={link(day, a)}>{a.title}</a>
      </h3>
      {a.subtitle && size === 'md' && <p className="teaser-sub">{a.subtitle}</p>}
      <p className="teaser-body">
        {first.length > 220 ? first.slice(0, 220).replace(/\s+\S*$/, '') + '…' : first}
      </p>
      <div className="teaser-foot">
        <span className="byline">{a.author}</span>
        {!!a.teams?.length && (
          <span className="teaser-badges">
            {a.teams.map((t) => teams.get(t) && <Badge key={t} team={teams.get(t)!} size={14} />)}
          </span>
        )}
      </div>
    </article>
  )
}

function Spotlight({ s, label, tone, teams }: { s: PlayerSpotlight; label: string; tone: 'top' | 'flop'; teams: Map<string, Team> }) {
  const t = teams.get(s.team)
  return (
    <div className={`spot spot-${tone}`}>
      <p className="spot-label">{label}</p>
      <div className="spot-score">{fmt(s.score)}</div>
      <p className="spot-name">{s.player}</p>
      {t && (
        <p className="spot-team">
          <Badge team={t} size={14} /> {t.name}
        </p>
      )}
      <p className="spot-note">{s.note}</p>
    </div>
  )
}

function gradeClass(g: number) {
  if (g >= 8) return 'g-great'
  if (g >= 6) return 'g-ok'
  if (g >= 5) return 'g-meh'
  return 'g-bad'
}

export function FrontPage({ league, day }: Props) {
  const teams = teamMap(league)
  const articles = articlesFor(day, league)
  const lead = articles.find((a) => a.kind === 'apertura') ?? articles[0]
  const rest = articles.filter((a) => a !== lead)
  const editorial = rest.find((a) => a.kind === 'editoriale')
  const gossip = rest.filter((a) => a.kind === 'gossip')
  const mercato = rest.filter((a) => a.kind === 'mercato')
  const cronache = rest.filter((a) => a.kind === 'cronaca' || a.kind === 'pagelle')
  const brevi = rest.filter((a) => a.kind === 'breve')
  const stats = dayStats(day, league)
  const table = standings(league, day.number)
  const fixtures = nextFixtures[day.number + 1]

  if (!day.results.length) {
    return (
      <div className="empty-page">
        <p className="kicker">Giornata {day.number}</p>
        <h2>Si gioca ancora</h2>
        <p>Le rotative sono ferme: il giornale esce a risultati acquisiti. Torna lunedì.</p>
        {nextFixtures[day.number] && (
          <div className="box">
            <h4 className="box-title">In programma</h4>
            {nextFixtures[day.number].map(([h, a]) => (
              <Fixture key={h + a} home={h} away={a} teams={teams} />
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="front">
      {/* ── Riga 1: apertura + colonna destra ───────────────────────── */}
      <section className="front-top">
        {lead && <Lead a={lead} day={day.number} />}
        <aside className="front-side">
          <div className="box">
            <h4 className="box-title">Risultati · {day.number}ª giornata</h4>
            {stats.matches.map((m) => (
              <Scoreline key={m.home + m.away} m={m} teams={teams} />
            ))}
            <p className="box-foot">
              {stats.totalGoals} gol · media {fmt(stats.avgPoints)} fantapunti
            </p>
          </div>
          <div className="box">
            <h4 className="box-title">
              Classifica <a href={href({ section: 'classifica', day: day.number })}>completa ›</a>
            </h4>
            <StandingsTable rows={table} compact />
          </div>
        </aside>
      </section>

      {/* ── Riga 2: top/flop, numeri, frase ─────────────────────────── */}
      <section className="front-strip">
        {day.top && <Spotlight s={day.top} label="Il migliore" tone="top" teams={teams} />}
        {day.flop && <Spotlight s={day.flop} label="Il peggiore" tone="flop" teams={teams} />}
        <div className="numbers">
          <p className="spot-label">I numeri</p>
          <dl>
            <div>
              <dt>Miglior punteggio</dt>
              <dd>
                {fmt(stats.best.points)} <small>{teams.get(stats.best.team)?.name}</small>
              </dd>
            </div>
            <div>
              <dt>Peggior punteggio</dt>
              <dd>
                {fmt(stats.worst.points)} <small>{teams.get(stats.worst.team)?.name}</small>
              </dd>
            </div>
            {stats.closest && (
              <div>
                <dt>Partita più tirata</dt>
                <dd>
                  {fmt(Math.abs(stats.closest.homePoints - stats.closest.awayPoints))} pt{' '}
                  <small>
                    {teams.get(stats.closest.home)?.short}–{teams.get(stats.closest.away)?.short}
                  </small>
                </dd>
              </div>
            )}
          </dl>
        </div>
        {day.quote && (
          <blockquote className="quote-week">
            <p className="spot-label">La frase</p>
            <p className="quote-text">«{day.quote.text}»</p>
            <cite>{day.quote.by}</cite>
          </blockquote>
        )}
      </section>

      {/* ── Riga 3: editoriale, cronache, bar dello sport ───────────── */}
      <section className="front-cols">
        {editorial && (
          <div className="col editorial">
            <h4 className="section-title">L’editoriale</h4>
            <article>
              <Kicker text={editorial.kicker} />
              <h3>
                <a href={link(day.number, editorial)}>{editorial.title}</a>
              </h3>
              {editorial.body.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
              <p className="signature">{editorial.author}</p>
            </article>
          </div>
        )}
        {(cronache.length > 0 || brevi.length > 0) && (
          <div className={`col cronache ${!editorial && !gossip.length && !mercato.length && !cronache.length ? 'wide' : ''}`}>
            <h4 className="section-title">{cronache.length ? 'Dai campi' : 'Le partite'}</h4>
            <div className="teasers">
              {(cronache.length ? cronache : brevi).map((a) => (
                <Teaser key={a.id} a={a} day={day.number} teams={teams} />
              ))}
            </div>
          </div>
        )}
        {(gossip.length > 0 || mercato.length > 0 || (cronache.length > 0 && brevi.length > 0)) && (
          <div className="col side-news">
            {gossip.length > 0 && (
              <div className="bar">
                <h4 className="section-title">Il Bar dello Sport</h4>
                {gossip.map((a) => (
                  <Teaser key={a.id} a={a} day={day.number} teams={teams} size="sm" />
                ))}
              </div>
            )}
            {mercato.length > 0 && (
              <>
                <h4 className="section-title">Mercato</h4>
                {mercato.map((a) => (
                  <Teaser key={a.id} a={a} day={day.number} teams={teams} size="sm" />
                ))}
              </>
            )}
            {cronache.length > 0 && brevi.length > 0 && (
              <>
                <h4 className="section-title">In breve</h4>
                <ul className="brevi">
                  {brevi.map((a) => (
                    <li key={a.id}>
                      <a href={link(day.number, a)}>
                        <strong>{a.title}.</strong> {a.body[0]}
                      </a>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        )}
      </section>

      {/* ── Riga 4: pagelle ai presidenti ───────────────────────────── */}
      {!!day.grades?.length && (
        <section className="grades">
          <h4 className="section-title">Le pagelle dei presidenti</h4>
          <div className="grades-grid">
            {[...day.grades]
              .sort((a, b) => b.grade - a.grade)
              .map((g) => {
                const t = teams.get(g.team)
                if (!t) return null
                return (
                  <div key={g.team} className="grade">
                    <span className={`grade-num ${gradeClass(g.grade)}`}>{fmt(g.grade)}</span>
                    <div>
                      <p className="grade-who">
                        {t.manager} <small>{t.name}</small>
                      </p>
                      <p className="grade-comment">{g.comment}</p>
                    </div>
                  </div>
                )
              })}
          </div>
        </section>
      )}

      {/* ── Prossimo turno ──────────────────────────────────────────── */}
      {fixtures && (
        <section className="next">
          <h4 className="section-title">Prossimo turno · {day.number + 1}ª giornata</h4>
          <div className="next-grid">
            {fixtures.map(([h, a]) => (
              <Fixture key={h + a} home={h} away={a} teams={teams} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
