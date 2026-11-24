/**
 * Modello dati del giornale.
 *
 * Tutto ciò che il giornale mostra deriva da un unico oggetto `League`
 * (vedi src/data/league.ts). Classifica, forma, andamento e titoli automatici
 * vengono calcolati a partire dai risultati: basta riempire squadre e giornate.
 */

export type TeamId = string

export interface Team {
  id: TeamId
  /** Nome completo, es. "Real Mandrogna" */
  name: string
  /** Sigla di 3 lettere per tabelle e stemmi */
  short: string
  /** Il presidente/allenatore (la persona reale del gruppo), facoltativo */
  manager?: string
  /** Colori sociali: [primario, secondario] */
  colors: [string, string]
  /** Motto o soprannome, facoltativo */
  motto?: string
}

export interface MatchResult {
  home: TeamId
  away: TeamId
  /** Fantapunti totali (es. 72.5) */
  homePoints: number
  awayPoints: number
  /** Gol: se assenti si calcolano dai fantapunti (vedi League.goals) */
  homeGoals?: number
  awayGoals?: number
  /** Nota sotto il risultato, es. "Fo-Caccia non schierata" */
  note?: string
}

export type ArticleKind =
  | 'apertura' // il pezzo principale della prima pagina
  | 'cronaca' // racconto di una partita
  | 'editoriale' // il commento del direttore
  | 'pagelle'
  | 'gossip' // spogliatoio, chat di gruppo, retroscena
  | 'mercato'
  | 'breve'

export interface Article {
  id: string
  kind: ArticleKind
  /** Occhiello sopra il titolo, es. "IL CASO" */
  kicker?: string
  title: string
  subtitle?: string
  author: string
  /** Paragrafi */
  body: string[]
  /** Squadre coinvolte (per filtri e stemmi) */
  teams?: TeamId[]
  /** Citazione in evidenza dentro l'articolo */
  quote?: { text: string; by: string }
}

export interface Grade {
  team: TeamId
  /** Voto 1–10, mezzi voti ammessi */
  grade: number
  comment: string
}

export interface PlayerSpotlight {
  player: string
  team: TeamId
  /** Fantavoto */
  score: number
  note: string
}

export interface Matchday {
  number: number
  /** Data ISO della giornata di Serie A, es. "2026-11-23" (facoltativa) */
  date?: string
  results: MatchResult[]
  articles?: Article[]
  /** Pagelle ai presidenti */
  grades?: Grade[]
  /** Notizie flash che scorrono sotto la testata */
  ticker?: string[]
  top?: PlayerSpotlight
  flop?: PlayerSpotlight
  /** La frase della settimana (dalla chat del gruppo?) */
  quote?: { text: string; by: string }
}

export interface League {
  /** Nome della lega (facoltativo) */
  name?: string
  /** Nome della testata */
  newspaper: string
  /** Sottotitolo della testata */
  tagline: string
  season: string
  teams: Team[]
  matchdays: Matchday[]
  /** Accoppiamenti delle giornate future, per il box "Prossimo turno" */
  fixtures?: Record<number, [TeamId, TeamId][]>
  /** Punti in classifica: vittoria / pareggio / sconfitta */
  pointsFor?: { win: number; draw: number; loss: number }
  /** Conversione fantapunti → gol */
  goals?: { threshold: number; step: number }
}
