/**
 * Gol, assist e bonus come variabili aleatorie.
 *
 * Modello. Il rendimento di un calciatore in stagione ha due fonti di incertezza:
 *
 *  1. **quante partite gioca** (infortuni, turnover, panchina);
 *  2. **quanto segna quando gioca** (variabilità partita per partita).
 *
 * Trattiamo la seconda come un processo di Poisson: in una partita i gol sono
 * eventi rari e quasi indipendenti, quindi il numero di gol in N partite con
 * tasso λ per partita è Poisson(Nλ). Questo è il modello standard per i gol nel
 * calcio ed è quello che rende un 15 gol "molto più probabile" di un 25 anche
 * quando la media è 18.
 *
 * La prima fonte la trattiamo mescolando: la frazione di stagione giocata A è
 * una Beta con media pari alle presenze attese / 38. Marginalizzando su A si
 * ottiene una miscela di Poisson, cioè una distribuzione **sovradispersa**
 * (varianza > media), che è ciò che si osserva davvero: la Poisson pura
 * sottostima quanto spesso un giocatore "sparisce" o esplode.
 *
 *     G | A ~ Poisson(38 · A · λ),   A ~ Beta(a, b)
 *
 * Il bonus totale è poi la convoluzione delle componenti (gol, assist, malus),
 * calcolata in modo esatto su una griglia discreta.
 */

/** Densità di Poisson pmf(k; lambda), stabile numericamente per lambda grandi. */
export function poissonPmf(k: number, lambda: number): number {
  if (lambda <= 0) return k === 0 ? 1 : 0
  if (k < 0) return 0
  // exp(k ln λ − λ − ln k!)
  return Math.exp(k * Math.log(lambda) - lambda - logFactorial(k))
}

const LOG_FACT: number[] = [0, 0]
export function logFactorial(n: number): number {
  if (n < 2) return 0
  for (let i = LOG_FACT.length; i <= n; i++) {
    LOG_FACT[i] = LOG_FACT[i - 1] + Math.log(i)
  }
  return LOG_FACT[n]
}

/** Vettore di probabilità pmf[k] per k = 0..max di una Poisson(lambda). */
export function poissonVector(lambda: number, max: number): number[] {
  const out = new Array<number>(max + 1)
  for (let k = 0; k <= max; k++) out[k] = poissonPmf(k, lambda)
  return out
}

/**
 * Nodi e pesi per integrare su A ~ Beta(a,b): usiamo una griglia uniforme fine
 * con pesi proporzionali alla densità Beta (regola del punto medio). Bastano
 * poche decine di nodi perché la funzione integranda è liscia.
 */
export function betaNodes(mean: number, concentration: number, n = 40): { x: number; w: number }[] {
  const m = Math.min(0.999, Math.max(0.001, mean))
  const a = m * concentration
  const b = (1 - m) * concentration
  const nodes: { x: number; w: number }[] = []
  let tot = 0
  for (let i = 0; i < n; i++) {
    const x = (i + 0.5) / n
    // densità Beta a meno della costante di normalizzazione
    const logd = (a - 1) * Math.log(x) + (b - 1) * Math.log(1 - x)
    const w = Math.exp(logd)
    nodes.push({ x, w })
    tot += w
  }
  for (const nd of nodes) nd.w /= tot
  return nodes
}

/**
 * Distribuzione del numero di eventi (gol o assist) in stagione.
 *
 * @param totaleAtteso  eventi attesi in stagione (es. gol attesi)
 * @param presenze      presenze attese
 * @param giornate      partite di campionato
 * @param concentration concentrazione della Beta sulla disponibilità:
 *                      valori bassi = più incertezza su quanto gioca
 */
export function eventiStagione(
  totaleAtteso: number,
  presenze: number,
  giornate: number,
  concentration = 8,
  max = 60,
): number[] {
  if (totaleAtteso <= 0) {
    const out = new Array<number>(max + 1).fill(0)
    out[0] = 1
    return out
  }
  const dispPresenze = Math.min(0.999, Math.max(0.001, presenze / giornate))
  // tasso per partita giocata
  const lambdaPerPartita = totaleAtteso / Math.max(presenze, 0.5)
  const nodes = betaNodes(dispPresenze, concentration)
  const out = new Array<number>(max + 1).fill(0)
  for (const { x, w } of nodes) {
    const lam = giornate * x * lambdaPerPartita
    for (let k = 0; k <= max; k++) out[k] += w * poissonPmf(k, lam)
  }
  return normalize(out)
}

export function normalize(v: number[]): number[] {
  const s = v.reduce((a, b) => a + b, 0)
  return s > 0 ? v.map((x) => x / s) : v
}

export function mean(pmf: number[]): number {
  let m = 0
  for (let k = 0; k < pmf.length; k++) m += k * pmf[k]
  return m
}

export function variance(pmf: number[]): number {
  const m = mean(pmf)
  let v = 0
  for (let k = 0; k < pmf.length; k++) v += (k - m) * (k - m) * pmf[k]
  return v
}

export function sd(pmf: number[]): number {
  return Math.sqrt(variance(pmf))
}

/** Quantile: il più piccolo k con P(X ≤ k) ≥ q. */
export function quantile(pmf: number[], q: number): number {
  let c = 0
  for (let k = 0; k < pmf.length; k++) {
    c += pmf[k]
    if (c >= q) return k
  }
  return pmf.length - 1
}

/** P(X ≥ k). */
export function tailProb(pmf: number[], k: number): number {
  let s = 0
  for (let i = Math.max(0, k); i < pmf.length; i++) s += pmf[i]
  return s
}

/** La moda: il valore singolo più probabile. */
export function moda(pmf: number[]): number {
  let best = 0
  for (let k = 1; k < pmf.length; k++) if (pmf[k] > pmf[best]) best = k
  return best
}

/**
 * Distribuzione su una griglia di valori reali: `values[i]` ha probabilità
 * `probs[i]`. Serve per i bonus, che con le ammonizioni vanno a passi di 0.5.
 */
export interface GridDist {
  /** Passo della griglia. */
  step: number
  /** Valore corrispondente all'indice 0. */
  offset: number
  probs: number[]
}

export function gridValue(d: GridDist, i: number): number {
  return d.offset + i * d.step
}

/** Costruisce una GridDist da una pmf su interi moltiplicata per un peso. */
export function scaledDist(pmf: number[], weight: number, step: number): GridDist {
  const ratio = Math.round(weight / step)
  const size = Math.abs(ratio) * (pmf.length - 1) + 1
  const probs = new Array<number>(size).fill(0)
  for (let k = 0; k < pmf.length; k++) {
    const idx = ratio >= 0 ? ratio * k : size - 1 + ratio * k
    if (idx >= 0 && idx < size) probs[idx] += pmf[k]
  }
  const offset = ratio >= 0 ? 0 : -Math.abs(ratio) * (pmf.length - 1) * step
  return { step, offset, probs }
}

/** Convoluzione di due distribuzioni sulla stessa griglia. */
export function convolve(a: GridDist, b: GridDist): GridDist {
  if (a.step !== b.step) throw new Error('convolve: passi diversi')
  const probs = new Array<number>(a.probs.length + b.probs.length - 1).fill(0)
  for (let i = 0; i < a.probs.length; i++) {
    const pa = a.probs[i]
    if (pa === 0) continue
    for (let j = 0; j < b.probs.length; j++) {
      probs[i + j] += pa * b.probs[j]
    }
  }
  return { step: a.step, offset: a.offset + b.offset, probs }
}

export function gridMean(d: GridDist): number {
  let m = 0
  for (let i = 0; i < d.probs.length; i++) m += gridValue(d, i) * d.probs[i]
  return m
}

export function gridSd(d: GridDist): number {
  const m = gridMean(d)
  let v = 0
  for (let i = 0; i < d.probs.length; i++) {
    const x = gridValue(d, i) - m
    v += x * x * d.probs[i]
  }
  return Math.sqrt(v)
}

export function gridQuantile(d: GridDist, q: number): number {
  let c = 0
  for (let i = 0; i < d.probs.length; i++) {
    c += d.probs[i]
    if (c >= q) return gridValue(d, i)
  }
  return gridValue(d, d.probs.length - 1)
}

/**
 * Aggrega una GridDist in al massimo `maxBins` colonne, sommando le probabilità
 * dei punti che finiscono nello stesso intervallo. Serve solo per disegnare:
 * medie e percentili vanno sempre calcolati sulla distribuzione piena.
 */
export function binned(
  d: GridDist,
  maxBins = 26,
): { labels: number[]; probs: number[]; larghezza: number } {
  const n = d.probs.length
  // i bonus cadono su valori interi anche se la griglia ha passo 0,5 (serve solo
  // alle ammonizioni): allineiamo i bin agli interi, altrimenti una colonna su
  // due resterebbe vuota e il grafico sembrerebbe un pettine
  const perInt = Math.max(1, Math.round(1 / d.step))
  let perBin = Math.max(1, Math.ceil(n / maxBins))
  perBin = Math.ceil(perBin / perInt) * perInt
  const labels: number[] = []
  const probs: number[] = []
  for (let i = 0; i < n; i += perBin) {
    let p = 0
    for (let j = i; j < Math.min(n, i + perBin); j++) p += d.probs[j]
    const centro = gridValue(d, Math.min(n - 1, i + Math.floor(perBin / 2)))
    labels.push(Math.round(centro))
    probs.push(p)
  }
  return { labels, probs, larghezza: perBin * d.step }
}

/** Riduce una GridDist ai soli punti con probabilità apprezzabile. */
export function trim(d: GridDist, eps = 1e-6): GridDist {
  let lo = 0
  let hi = d.probs.length - 1
  while (lo < hi && d.probs[lo] < eps) lo++
  while (hi > lo && d.probs[hi] < eps) hi--
  return { step: d.step, offset: d.offset + lo * d.step, probs: d.probs.slice(lo, hi + 1) }
}
