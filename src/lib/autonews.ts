import type { Article, League, Matchday, Team } from '../types'
import { dayStats, standings, teamMap, type ScoredMatch } from './standings'

/**
 * Per le giornate senza articoli scritti a mano, il giornale si arrangia:
 * titoli generati dai risultati, con un pizzico di ironia.
 */

const pick = <T,>(arr: T[], seed: number): T => arr[Math.abs(seed) % arr.length]

export function fmt(n: number): string {
  return n.toLocaleString('it-IT', { minimumFractionDigits: n % 1 ? 1 : 0, maximumFractionDigits: 1 })
}

function winner(m: ScoredMatch, teams: Map<string, Team>) {
  const homeWon = m.homeGoals > m.awayGoals
  return {
    w: teams.get(homeWon ? m.home : m.away)!,
    l: teams.get(homeWon ? m.away : m.home)!,
    score: homeWon ? `${m.homeGoals}-${m.awayGoals}` : `${m.awayGoals}-${m.homeGoals}`,
    wp: homeWon ? m.homePoints : m.awayPoints,
    lp: homeWon ? m.awayPoints : m.homePoints,
  }
}

function matchArticle(m: ScoredMatch, teams: Map<string, Team>, day: Matchday, i: number): Article {
  const h = teams.get(m.home)!
  const a = teams.get(m.away)!
  const seed = day.number * 7 + i
  if (m.homeGoals === m.awayGoals) {
    return {
      id: `auto-${day.number}-${i}`,
      kind: 'breve',
      kicker: 'Pareggio',
      title: pick(
        [
          `${h.name}-${a.name}, tutto in equilibrio: ${m.homeGoals}-${m.awayGoals}`,
          `Né vincitori né vinti tra ${h.name} e ${a.name}`,
          `${h.short}-${a.short}, si divide la posta (e il conto al bar)`,
        ],
        seed,
      ),
      author: 'Red. Sport',
      teams: [m.home, m.away],
      body: [
        `Finisce ${m.homeGoals}-${m.awayGoals} con ${fmt(m.homePoints)} a ${fmt(m.awayPoints)}. ${h.manager} e ${a.manager} si stringono la mano, ma nessuno dei due è contento.`,
      ],
    }
  }
  const { w, l, score, wp, lp } = winner(m, teams)
  const gap = wp - lp
  const margin = Math.abs(m.homeGoals - m.awayGoals)
  return {
    id: `auto-${day.number}-${i}`,
    kind: 'breve',
    kicker: margin >= 3 ? 'Goleada' : gap <= 1.5 ? 'Al fotofinish' : 'Vittoria',
    title:
      margin >= 3
        ? pick([`${w.name} travolge ${l.name}`, `Lezione di ${w.name}: ${l.name} rimandato a settembre`], seed)
        : gap <= 1.5
          ? pick([`${w.name} di un soffio su ${l.name}`, `Mezzo punto d’oro: ${w.name} beffa ${l.name}`], seed)
          : pick([`${w.name} supera ${l.name} ${score}`, `${w.manager} sorride, ${l.manager} meno`], seed),
    author: 'Red. Sport',
    teams: [w.id, l.id],
    body: [`${w.name} batte ${l.name} ${score}: ${fmt(wp)} contro ${fmt(lp)} fantapunti.`],
  }
}

export function articlesFor(day: Matchday, league: League): Article[] {
  if (day.articles?.length) return day.articles
  if (!day.results.length) return []
  const teams = teamMap(league)
  const s = dayStats(day, league)
  const table = standings(league, day.number)
  const leader = table[0]
  const best = teams.get(s.best.team)!
  const worst = teams.get(s.worst.team)!

  const lead: Article = {
    id: `auto-${day.number}-apertura`,
    kind: 'apertura',
    kicker: `${day.number}ª giornata`,
    title: s.rout
      ? (() => {
          const { w, l, score } = winner(s.rout, teams)
          const margin = Math.abs(s.rout.homeGoals - s.rout.awayGoals)
          if (margin >= 3) return `${w.name} cala il ${score}: ${l.name} travolto`
          if (margin === 2) return `${w.name} non fa sconti: ${score} a ${l.name}`
          return `${w.name} batte ${l.name} ${score}`
        })()
      : `Giornata di pareggi: tutti contenti, nessuno felice`,
    subtitle: `${leader.team.name} ${leader.pos === 1 && leader.delta > 0 ? 'si prende' : 'resta in'} vetta a quota ${leader.points}. Miglior punteggio per ${best.name} (${fmt(s.best.points)}), notte fonda per ${worst.name} (${fmt(s.worst.points)}).`,
    author: 'La Redazione',
    teams: s.rout ? [s.rout.home, s.rout.away] : [],
    body: [
      `${s.totalGoals} gol in ${s.matches.length} partite e una media di ${fmt(s.avgPoints)} fantapunti a squadra: questo il bilancio della ${day.number}ª giornata.`,
      `In testa c’è ${leader.team.name} di ${leader.team.manager} con ${leader.points} punti, ${table[1] ? `${leader.points - table[1].points} in più di ${table[1].team.name}` : 'da solo'}. In fondo, ${table[table.length - 1].team.name} continua a cercare sé stesso.`,
    ],
  }
  return [lead, ...s.matches.map((m, i) => matchArticle(m, teams, day, i))]
}

export function tickerFor(day: Matchday, league: League): string[] {
  if (day.ticker?.length) return day.ticker
  const teams = teamMap(league)
  const s = dayStats(day, league)
  if (!s.matches.length) return []
  return s.matches.map((m) => {
    const h = teams.get(m.home)!
    const a = teams.get(m.away)!
    return `${h.name} ${m.homeGoals}-${m.awayGoals} ${a.name} (${fmt(m.homePoints)} – ${fmt(m.awayPoints)})`
  })
}
