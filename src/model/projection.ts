/**
 * Proiezione statistica di un calciatore a partire dal listone.
 *
 * Il listone fornisce solo FVM (Fanta Valore di Mercato) e quotazione: non ci sono
 * statistiche storiche. L'FVM però è il prezzo di equilibrio del mercato, quindi è
 * un ottimo indicatore sintetico di "quanto rende". Da lì ricaviamo, per ruolo, i
 * parametri di un modello di produzione stagionale:
 *
 *   - presenze attese                    N
 *   - gol attesi per partita giocata     λ_g
 *   - assist attesi per partita giocata  λ_a
 *   - voto base (senza bonus)            v
 *   - cartellini, autogol, rigori sbagliati
 *   - per i portieri: gol subiti per partita
 *
 * Le curve sono leggi di potenza calibrate su due punti di ancoraggio per ruolo
 * (un top player e un giocatore di fascia media), scelti su rendimenti tipici di
 * Serie A. Sono tutti parametri esposti e modificabili: `ProjectionParams`.
 */
import { GIORNATE, type Player, type Role } from './types'

/** Punto di ancoraggio: a un dato FVM corrispondono tot gol/assist a stagione. */
export interface Anchor {
  fvm: number
  /** Gol in una stagione intera (già comprensivi dei rigori). */
  gol: number
  /** Assist in una stagione intera. */
  assist: number
}

export interface RoleParams {
  /** Ancoraggio "top player" del ruolo. */
  top: Anchor
  /** Ancoraggio "fascia media" del ruolo. */
  mid: Anchor
  /**
   * Tetto asintotico per gol e assist di stagione. Serve ai fuoriclasse fuori
   * scala (un Dimarco con FVM 265 fra difensori che si fermano a 84): la legge
   * di potenza da sola, estrapolata così lontano dagli ancoraggi, produrrebbe
   * numeri assurdi. Sotto l'ancoraggio "top" il tetto non ha alcun effetto.
   */
  capGol: number
  capAssist: number
  /** Voto base (senza bonus) di un giocatore medio del ruolo. */
  votoBase: number
  /** Quanto il voto base sale passando dal peggiore al migliore del ruolo. */
  votoSpread: number
  /** Ammonizioni per partita giocata. */
  ammonizioni: number
  /** Espulsioni per partita giocata. */
  espulsioni: number
  /** Autogol per partita giocata. */
  autogol: number
}

export interface ProjectionParams {
  /** Presenze massime teoriche (38 meno turnover/infortuni del top player). */
  presenzeMax: number
  /** FVM a cui si raggiunge metà delle presenze massime. */
  presenzeMezzeria: number
  /** Curvatura della curva presenze. */
  presenzeEsponente: number
  roles: Record<Role, RoleParams>
  /** Gol subiti a partita dal portiere della difesa migliore. */
  golSubitiMin: number
  /** Gol subiti a partita dal portiere della difesa peggiore. */
  golSubitiMax: number
  /** Quota di rigori calciati dai top attaccanti (per il malus rigore sbagliato). */
  rigoriTop: number
  /** Percentuale di rigori sbagliati. */
  rigoriErrore: number
}

export const DEFAULT_PROJECTION: ProjectionParams = {
  presenzeMax: 36,
  presenzeMezzeria: 16,
  presenzeEsponente: 0.7,
  golSubitiMin: 0.95,
  golSubitiMax: 1.75,
  rigoriTop: 0.18,
  rigoriErrore: 0.22,
  roles: {
    P: {
      top: { fvm: 60, gol: 0, assist: 0 },
      mid: { fvm: 20, gol: 0, assist: 0 },
      capGol: 0,
      capAssist: 0,
      votoBase: 6.0,
      votoSpread: 0.35,
      ammonizioni: 0.04,
      espulsioni: 0.004,
      autogol: 0.002,
    },
    D: {
      top: { fvm: 84, gol: 2.6, assist: 4.5 },
      mid: { fvm: 12, gol: 0.6, assist: 0.8 },
      capGol: 6,
      capAssist: 11,
      votoBase: 5.95,
      votoSpread: 0.35,
      ammonizioni: 0.19,
      espulsioni: 0.012,
      autogol: 0.012,
    },
    C: {
      top: { fvm: 250, gol: 8, assist: 7 },
      mid: { fvm: 40, gol: 1.8, assist: 1.8 },
      capGol: 14,
      capAssist: 13,
      votoBase: 6.0,
      votoSpread: 0.4,
      ammonizioni: 0.16,
      espulsioni: 0.008,
      autogol: 0.004,
    },
    A: {
      top: { fvm: 370, gol: 19, assist: 4.5 },
      mid: { fvm: 100, gol: 8.5, assist: 2 },
      capGol: 30,
      capAssist: 10,
      votoBase: 6.0,
      votoSpread: 0.4,
      ammonizioni: 0.11,
      espulsioni: 0.006,
      autogol: 0.002,
    },
  },
}

/**
 * Esponente della legge di potenza che passa per i due ancoraggi:
 *   y(fvm) = yTop * (fvm / fvmTop)^alpha
 */
function powerLaw(fvm: number, top: number, mid: number, yTop: number, yMid: number): number {
  if (yTop <= 0 || yMid <= 0) return 0
  const alpha = Math.log(yTop / yMid) / Math.log(top / mid)
  return yTop * Math.pow(Math.max(fvm, 0.5) / top, alpha)
}

/**
 * Comprime la coda oltre l'ancoraggio "top" verso un asintoto `cap`.
 * Vale l'identità per y ≤ yTop, quindi gli ancoraggi restano esatti.
 */
function softCap(y: number, yTop: number, cap: number): number {
  if (y <= yTop || cap <= yTop) return Math.min(y, Math.max(cap, yTop))
  const spazio = cap - yTop
  return yTop + spazio * (1 - Math.exp(-(y - yTop) / spazio))
}

/** Presenze attese: curva saturante in FVM (chi vale di più gioca di più). */
export function presenzeAttese(fvm: number, p: ProjectionParams): number {
  const x = Math.pow(Math.max(fvm, 0.5), p.presenzeEsponente)
  const c = Math.pow(p.presenzeMezzeria, p.presenzeEsponente)
  return Math.min(GIORNATE, (p.presenzeMax * x) / (x + c))
}

/** Proiezione stagionale completa di un giocatore. */
export interface Projection {
  /** Presenze attese in stagione. */
  presenze: number
  /** Gol attesi in stagione. */
  gol: number
  /** Assist attesi in stagione. */
  assist: number
  /** Voto base medio (senza bonus/malus). */
  votoBase: number
  /** Ammonizioni attese in stagione. */
  ammonizioni: number
  /** Espulsioni attese in stagione. */
  espulsioni: number
  /** Autogol attesi in stagione. */
  autogol: number
  /** Rigori sbagliati attesi in stagione. */
  rigoriSbagliati: number
  /** Solo portieri: gol subiti attesi in stagione. */
  golSubiti: number
  /** Solo portieri: partite attese senza subire gol. */
  cleanSheet: number
}

/**
 * Posizione relativa del giocatore dentro il suo ruolo, in scala logaritmica
 * di FVM, normalizzata su [0,1] rispetto agli ancoraggi. Serve per far variare
 * il voto base e i gol subiti con la qualità.
 */
function qualita(fvm: number, rp: RoleParams): number {
  const lo = Math.log(1)
  const hi = Math.log(rp.top.fvm)
  const x = (Math.log(Math.max(fvm, 1)) - lo) / (hi - lo)
  return Math.min(1, Math.max(0, x))
}

export function project(player: Player, p: ProjectionParams = DEFAULT_PROJECTION): Projection {
  const rp = p.roles[player.role]
  const presenze = presenzeAttese(player.fvm, p)
  const q = qualita(player.fvm, rp)

  // Gli ancoraggi sono già rendimenti di stagione intera: la legge di potenza
  // interpola direttamente il totale stagionale, presenze incluse.
  const golAttesi =
    rp.top.gol > 0
      ? softCap(
          powerLaw(player.fvm, rp.top.fvm, rp.mid.fvm, rp.top.gol, rp.mid.gol),
          rp.top.gol,
          rp.capGol,
        )
      : 0
  const assistAttesi =
    rp.top.assist > 0
      ? softCap(
          powerLaw(player.fvm, rp.top.fvm, rp.mid.fvm, rp.top.assist, rp.mid.assist),
          rp.top.assist,
          rp.capAssist,
        )
      : 0

  const rigoriSbagliati =
    player.role === 'A' || player.role === 'C'
      ? golAttesi * p.rigoriTop * q * (p.rigoriErrore / (1 - p.rigoriErrore))
      : 0

  let golSubiti = 0
  let cleanSheet = 0
  if (player.role === 'P') {
    const perPartita = p.golSubitiMax - (p.golSubitiMax - p.golSubitiMin) * q
    golSubiti = perPartita * presenze
    // P(nessun gol subito) con gol subiti ~ Poisson(perPartita)
    cleanSheet = presenze * Math.exp(-perPartita)
  }

  return {
    presenze,
    gol: golAttesi,
    assist: assistAttesi,
    votoBase: rp.votoBase + rp.votoSpread * (q - 0.5),
    ammonizioni: rp.ammonizioni * presenze,
    espulsioni: rp.espulsioni * presenze,
    autogol: rp.autogol * presenze,
    rigoriSbagliati,
    golSubiti,
    cleanSheet,
  }
}
