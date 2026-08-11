/**
 * Da proiezione + regolamento a fantapunti: valore atteso e distribuzione.
 */
import {
  convolve,
  eventiStagione,
  gridMean,
  gridQuantile,
  gridSd,
  mean,
  moda,
  normalize,
  quantile,
  scaledDist,
  sd,
  tailProb,
  trim,
  type GridDist,
} from './distribution'
import type { Projection } from './projection'
import { GIORNATE, type Player, type Role, type ScoringRules } from './types'

/** Bonus/malus attesi in stagione, al netto del voto. */
export function bonusAtteso(proj: Projection, role: Role, rules: ScoringRules): number {
  let b = 0
  b += proj.gol * rules.gol
  b += proj.assist * rules.assist
  b += proj.ammonizioni * rules.ammonizione
  b += proj.espulsioni * rules.espulsione
  b += proj.autogol * rules.autogol
  b += proj.rigoriSbagliati * rules.rigoreSbagliato
  if (role === 'P') {
    b += proj.golSubiti * rules.golSubito
    if (rules.usaImbattibilita) b += proj.cleanSheet * rules.imbattibilita
  }
  return b
}

/** Fantamedia attesa: media per partita giocata, voto compreso. */
export function fantamediaAttesa(proj: Projection, role: Role, rules: ScoringRules): number {
  if (proj.presenze <= 0) return proj.votoBase
  return proj.votoBase + bonusAtteso(proj, role, rules) / proj.presenze
}

/** Fantapunti totali attesi in stagione (voto + bonus, sulle partite giocate). */
export function fantapuntiAttesi(proj: Projection, role: Role, rules: ScoringRules): number {
  return proj.votoBase * proj.presenze + bonusAtteso(proj, role, rules)
}

export interface Analisi {
  /** Distribuzione dei gol in stagione: golPmf[k] = P(gol = k). */
  golPmf: number[]
  assistPmf: number[]
  /** Distribuzione dei bonus totali di stagione (gol + assist + malus). */
  bonus: GridDist
  golAttesi: number
  golModa: number
  golSd: number
  assistAttesi: number
  assistModa: number
  bonusMedio: number
  bonusSd: number
  /** Percentili dei bonus stagionali. */
  bonusP10: number
  bonusP50: number
  bonusP90: number
  presenze: number
  fantamedia: number
  fantapunti: number
}

const MAX_GOL = 45
const MAX_ASSIST = 30
/** Passo della griglia dei bonus: 0.5 perché le ammonizioni valgono -0.5. */
const STEP = 0.5

/**
 * Analisi probabilistica completa di un giocatore.
 *
 * Gol e assist sono due miscele Poisson-Beta indipendenti; il bonus totale è la
 * loro convoluzione pesata dai punteggi del regolamento, più i malus attesi
 * (cartellini e autogol, che sono quasi deterministici su 38 giornate e
 * trattiamo come uno spostamento della media).
 */
export function analizza(
  player: Player,
  proj: Projection,
  rules: ScoringRules,
  concentration = 8,
): Analisi {
  const golPmf = normalize(
    eventiStagione(proj.gol, proj.presenze, GIORNATE, concentration, MAX_GOL),
  )
  const assistPmf = normalize(
    eventiStagione(proj.assist, proj.presenze, GIORNATE, concentration, MAX_ASSIST),
  )

  const golDist = scaledDist(golPmf, rules.gol, STEP)
  const assistDist = scaledDist(assistPmf, rules.assist, STEP)
  let bonus = convolve(golDist, assistDist)

  // Malus e bonus portiere: contributo medio, aggiunto come traslazione.
  let shift =
    proj.ammonizioni * rules.ammonizione +
    proj.espulsioni * rules.espulsione +
    proj.autogol * rules.autogol +
    proj.rigoriSbagliati * rules.rigoreSbagliato
  if (player.role === 'P') {
    shift += proj.golSubiti * rules.golSubito
    if (rules.usaImbattibilita) shift += proj.cleanSheet * rules.imbattibilita
  }
  bonus = { ...bonus, offset: bonus.offset + shift }
  bonus = trim(bonus)

  return {
    golPmf,
    assistPmf,
    bonus,
    golAttesi: mean(golPmf),
    golModa: moda(golPmf),
    golSd: sd(golPmf),
    assistAttesi: mean(assistPmf),
    assistModa: moda(assistPmf),
    bonusMedio: gridMean(bonus),
    bonusSd: gridSd(bonus),
    bonusP10: gridQuantile(bonus, 0.1),
    bonusP50: gridQuantile(bonus, 0.5),
    bonusP90: gridQuantile(bonus, 0.9),
    presenze: proj.presenze,
    fantamedia: fantamediaAttesa(proj, player.role, rules),
    fantapunti: fantapuntiAttesi(proj, player.role, rules),
  }
}

export { quantile, tailProb }
