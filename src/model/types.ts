/** Ruolo "classic" del listone Fantacalcio. */
export type Role = 'P' | 'D' | 'C' | 'A'

export const ROLES: Role[] = ['P', 'D', 'C', 'A']

export const ROLE_LABEL: Record<Role, string> = {
  P: 'Portieri',
  D: 'Difensori',
  C: 'Centrocampisti',
  A: 'Attaccanti',
}

export const ROLE_LABEL_SING: Record<Role, string> = {
  P: 'Portiere',
  D: 'Difensore',
  C: 'Centrocampista',
  A: 'Attaccante',
}

/** Un calciatore del listone. */
export interface Player {
  id: string
  /** Cognome come sul listone. */
  name: string
  /** Squadra di Serie A. */
  club: string
  role: Role
  /** Ruoli Mantra (Por, Dc, Dd, Ds, E, M, C, W, T, A, Pc, B). */
  mantra: string[]
  /** Fanta Valore di Mercato: quanto il mercato lo valuta (scala aperta). */
  fvm: number
  /** Quotazione iniziale classic (crediti su base 500). */
  quot: number
}

/** Una squadra del nostro fantacampionato. */
export interface FantaTeam {
  id: string
  name: string
  /** true per la squadra dell'utente (usata nei consigli d'asta). */
  isMine: boolean
}

/** Un acquisto all'asta. */
export interface Purchase {
  playerId: string
  teamId: string
  /** Crediti pagati. */
  price: number
}

/** Quanti giocatori per ruolo in ogni rosa: uguale per tutte le squadre. */
export type RosterSlots = Record<Role, number>

export interface LeagueSettings {
  /** Crediti a disposizione di ogni squadra. */
  budget: number
  /** Quanti giocatori per ruolo in rosa. */
  slots: RosterSlots
  /**
   * Quanti ne schieri per ruolo in una giornata tipo (deve fare 11).
   * Serve al livello di rimpiazzo: il terzo portiere sta in rosa ma non gioca
   * mai, quindi il portiere "di riferimento" non è il 24° della lega ma
   * l'ultimo che parte titolare da qualche parte.
   */
  titolari: RosterSlots
}

/** Punteggi bonus/malus. Default = regolamento classic Serie A. */
export interface ScoringRules {
  gol: number
  assist: number
  rigoreSegnato: number
  rigoreSbagliato: number
  rigoreParato: number
  golSubito: number
  autogol: number
  ammonizione: number
  espulsione: number
  imbattibilita: number
  /** Se true il portiere prende +1 quando non subisce gol. */
  usaImbattibilita: boolean
}

export const DEFAULT_SCORING: ScoringRules = {
  gol: 3,
  assist: 1,
  rigoreSegnato: 3,
  rigoreSbagliato: -3,
  rigoreParato: 3,
  golSubito: -1,
  autogol: -2,
  ammonizione: -0.5,
  espulsione: -1,
  imbattibilita: 1,
  usaImbattibilita: true,
}

export const DEFAULT_SLOTS: RosterSlots = { P: 3, D: 8, C: 8, A: 6 }

/** Modulo di riferimento: 1 portiere, 4 difensori, 4 centrocampisti, 2 attaccanti. */
export const DEFAULT_TITOLARI: RosterSlots = { P: 1, D: 4, C: 4, A: 2 }

export const DEFAULT_SETTINGS: LeagueSettings = {
  budget: 500,
  slots: DEFAULT_SLOTS,
  titolari: DEFAULT_TITOLARI,
}

/** Numero di giornate di campionato. */
export const GIORNATE = 38

export function totalSlots(slots: RosterSlots): number {
  return ROLES.reduce((s, r) => s + slots[r], 0)
}
