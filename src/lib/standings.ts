import type { League, MatchResult, Matchday, Team, TeamId } from '../types'

export type Outcome = 'V' | 'N' | 'P'

export interface Row {
  team: Team
  pos: number
  played: number
  won: number
  drawn: number
  lost: number
  gf: number
  ga: number
  points: number
  /** Somma dei fantapunti (primo criterio di spareggio nel fanta) */
  fantapoints: number
  /** Ultimi risultati, dal più vecchio al più recente */
  form: Outcome[]
  /** Variazione di posizione rispetto alla giornata precedente (+ = salito) */
  delta: number
}

export interface ScoredMatch extends MatchResult {
  homeGoals: number
  awayGoals: number
}

export function goalsFrom(points: number, league: League): number {
  const { threshold, step } = league.goals ?? { threshold: 66, step: 6 }
  if (points < threshold) return 0
  return Math.floor((points - threshold) / step) + 1
}

export function scored(m: MatchResult, league: League): ScoredMatch {
  return {
    ...m,
    homeGoals: m.homeGoals ?? goalsFrom(m.homePoints, league),
    awayGoals: m.awayGoals ?? goalsFrom(m.awayPoints, league),
  }
}

export function teamMap(league: League): Map<TeamId, Team> {
  return new Map(league.teams.map((t) => [t.id, t]))
}

function rawTable(league: League, upTo: number): Omit<Row, 'pos' | 'delta'>[] {
  const pts = league.pointsFor ?? { win: 3, draw: 1, loss: 0 }
  const rows = new Map<TeamId, Omit<Row, 'pos' | 'delta'>>()
  for (const team of league.teams) {
    rows.set(team.id, {
      team,
      played: 0,
      won: 0,
      drawn: 0,
      lost: 0,
      gf: 0,
      ga: 0,
      points: 0,
      fantapoints: 0,
      form: [],
    })
  }
  const days = [...league.matchdays].filter((d) => d.number <= upTo).sort((a, b) => a.number - b.number)
  for (const day of days) {
    for (const raw of day.results) {
      const m = scored(raw, league)
      const h = rows.get(m.home)
      const a = rows.get(m.away)
      if (!h || !a) continue
      h.played++
      a.played++
      h.gf += m.homeGoals
      h.ga += m.awayGoals
      a.gf += m.awayGoals
      a.ga += m.homeGoals
      h.fantapoints += m.homePoints
      a.fantapoints += m.awayPoints
      if (m.homeGoals > m.awayGoals) {
        h.won++, a.lost++, (h.points += pts.win), (a.points += pts.loss)
        h.form.push('V'), a.form.push('P')
      } else if (m.homeGoals < m.awayGoals) {
        a.won++, h.lost++, (a.points += pts.win), (h.points += pts.loss)
        a.form.push('V'), h.form.push('P')
      } else {
        h.drawn++, a.drawn++, (h.points += pts.draw), (a.points += pts.draw)
        h.form.push('N'), a.form.push('N')
      }
    }
  }
  return [...rows.values()].sort(
    (x, y) =>
      y.points - x.points ||
      y.fantapoints - x.fantapoints ||
      y.gf - y.ga - (x.gf - x.ga) ||
      y.gf - x.gf ||
      x.team.name.localeCompare(y.team.name),
  )
}

/** Classifica dopo la giornata `upTo` (inclusa). */
export function standings(league: League, upTo: number): Row[] {
  const now = rawTable(league, upTo)
  const before = upTo > 1 ? rawTable(league, upTo - 1) : null
  const prevPos = new Map(before?.map((r, i) => [r.team.id, i + 1]))
  return now.map((r, i) => ({
    ...r,
    pos: i + 1,
    form: r.form.slice(-5),
    delta: before ? (prevPos.get(r.team.id) ?? i + 1) - (i + 1) : 0,
  }))
}

/** Posizione di ogni squadra giornata per giornata, fino a `upTo`. */
export function positionHistory(league: League, upTo: number): Map<TeamId, number[]> {
  const out = new Map<TeamId, number[]>(league.teams.map((t) => [t.id, []]))
  for (const day of playedDays(league).filter((d) => d.number <= upTo)) {
    rawTable(league, day.number).forEach((r, i) => out.get(r.team.id)!.push(i + 1))
  }
  return out
}

export function playedDays(league: League): Matchday[] {
  return [...league.matchdays].filter((d) => d.results.length > 0).sort((a, b) => a.number - b.number)
}

export interface DayStats {
  matches: ScoredMatch[]
  /** Miglior punteggio di giornata */
  best: { team: TeamId; points: number }
  /** Peggior punteggio di giornata */
  worst: { team: TeamId; points: number }
  /** Vittoria con più scarto */
  rout?: ScoredMatch
  /** Partita più equilibrata (minor scarto di fantapunti) */
  closest?: ScoredMatch
  totalGoals: number
  avgPoints: number
}

export function dayStats(day: Matchday, league: League): DayStats {
  const matches = day.results.map((m) => scored(m, league))
  const scores = matches.flatMap((m) => [
    { team: m.home, points: m.homePoints },
    { team: m.away, points: m.awayPoints },
  ])
  const byPoints = [...scores].sort((a, b) => b.points - a.points)
  const margin = (m: ScoredMatch) => Math.abs(m.homeGoals - m.awayGoals)
  const fpGap = (m: ScoredMatch) => Math.abs(m.homePoints - m.awayPoints)
  return {
    matches,
    best: byPoints[0],
    worst: byPoints[byPoints.length - 1],
    rout: [...matches].filter((m) => margin(m) > 0).sort((a, b) => margin(b) - margin(a) || fpGap(b) - fpGap(a))[0],
    closest: [...matches].sort((a, b) => fpGap(a) - fpGap(b))[0],
    totalGoals: matches.reduce((s, m) => s + m.homeGoals + m.awayGoals, 0),
    avgPoints: scores.reduce((s, x) => s + x.points, 0) / (scores.length || 1),
  }
}
