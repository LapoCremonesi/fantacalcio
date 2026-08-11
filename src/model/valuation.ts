/**
 * Quanto vale davvero un giocatore all'asta.
 *
 * L'idea chiave è che **il valore non è il rendimento assoluto, ma il rendimento
 * in più rispetto a chi puoi avere gratis**. Se in lega servono 24 portieri
 * (8 squadre × 3) e tu prendi il 5° portiere, il tuo guadagno reale non è la sua
 * fantamedia: è la differenza fra lui e il 25° portiere, quello che resterebbe
 * comunque svincolato. Questo si chiama *valore sul rimpiazzo* (VOR) ed è il
 * modo corretto di confrontare ruoli diversi fra loro.
 *
 * Poi si converte il VOR in crediti. In un'asta i crediti sono a somma zero:
 * tutta la lega spende esattamente `squadre × budget`. Ogni slot di rosa costa
 * almeno 1 credito, quindi i crediti "contendibili" sono
 *
 *     surplus = squadre × budget − slot totali
 *
 * e il prezzo di equilibrio di un giocatore è
 *
 *     prezzo = 1 + VOR · (surplus / Σ VOR)
 *
 * cioè la sua quota del surplus. Questa è la valutazione a inizio asta.
 *
 * Durante l'asta il calcolo si aggiorna da solo: se la lega ha già speso molto
 * per pochi giocatori, i crediti rimasti per i giocatori rimasti sono meno e i
 * prezzi si sgonfiano; se tutti stanno risparmiando, si gonfiano. È il fattore
 * di inflazione, ricalcolato sui crediti e sui giocatori ancora disponibili.
 */
import { analizza, fantapuntiAttesi } from './fantapunti'
import { DEFAULT_PROJECTION, project, type ProjectionParams } from './projection'
import {
  ROLES,
  totalSlots,
  type FantaTeam,
  type LeagueSettings,
  type Player,
  type Purchase,
  type Role,
  type ScoringRules,
} from './types'

export interface ValutazioneGiocatore {
  player: Player
  /** Fantapunti attesi in stagione. */
  fantapunti: number
  /** Fantamedia attesa. */
  fantamedia: number
  /** Presenze attese. */
  presenze: number
  /** Fantapunti in più rispetto al giocatore di rimpiazzo dello stesso ruolo. */
  vor: number
  /** Deviazione standard dei bonus stagionali: quanto è rischioso. */
  rischio: number
  /** VOR corretto per il rischio (equivalente certo). */
  vorAggiustato: number
  /** Prezzo di equilibrio a inizio asta, in crediti. */
  prezzoBase: number
  /** Prezzo consigliato ora, con l'inflazione corrente dell'asta. */
  prezzoCorrente: number
  /**
   * Quanto costerà davvero all'asta: l'FVM del listone riscalato sul budget
   * della lega. È il prezzo che fa il mercato, non quello che dice il modello.
   */
  prezzoMercato: number
  /**
   * prezzoCorrente − prezzoMercato. Positivo = vale più di quanto costerà
   * (occasione), negativo = il mercato lo paga più di quanto rende.
   */
  affare: number
  /** Se già preso: da chi e a quanto. */
  purchase?: Purchase
}

export interface ValutazioneLega {
  giocatori: ValutazioneGiocatore[]
  byId: Map<string, ValutazioneGiocatore>
  /** Fantapunti del giocatore di rimpiazzo, per ruolo. */
  rimpiazzo: Record<Role, number>
  /** Rapporto fra crediti ancora contendibili e VOR ancora disponibile. */
  inflazione: number
  /** Crediti ancora spendibili in lega. */
  creditiResidui: number
  /** Slot di rosa ancora da riempire in lega. */
  slotResidui: number
}

export interface ValutazioneInput {
  players: Player[]
  teams: FantaTeam[]
  purchases: Purchase[]
  settings: LeagueSettings
  rules: ScoringRules
  projection?: ProjectionParams
  /**
   * Avversione al rischio: 0 = conta solo la media, valori più alti penalizzano
   * i giocatori con esito più incerto.
   */
  avversioneRischio?: number
  /** Concentrazione della Beta sulla disponibilità (incertezza sulle presenze). */
  concentration?: number
}

/** Crediti spesi da una squadra. */
export function spesa(teamId: string, purchases: Purchase[]): number {
  return purchases.filter((p) => p.teamId === teamId).reduce((s, p) => s + p.price, 0)
}

/** Giocatori presi da una squadra, per ruolo. */
export function conteggioRuoli(
  teamId: string,
  purchases: Purchase[],
  byId: Map<string, Player>,
): Record<Role, number> {
  const out: Record<Role, number> = { P: 0, D: 0, C: 0, A: 0 }
  for (const p of purchases) {
    if (p.teamId !== teamId) continue
    const pl = byId.get(p.playerId)
    if (pl) out[pl.role]++
  }
  return out
}

/** Crediti residui di una squadra. */
export function creditiResidui(
  teamId: string,
  purchases: Purchase[],
  settings: LeagueSettings,
): number {
  return settings.budget - spesa(teamId, purchases)
}

/**
 * Offerta massima sensata per una squadra: non puoi spendere tanto da non
 * poterti permettere almeno 1 credito per ogni slot che ti resta da riempire.
 */
export function offertaMassima(
  teamId: string,
  purchases: Purchase[],
  settings: LeagueSettings,
  byId: Map<string, Player>,
): number {
  const presi = conteggioRuoli(teamId, purchases, byId)
  const mancanti = ROLES.reduce((s, r) => s + Math.max(0, settings.slots[r] - presi[r]), 0)
  if (mancanti <= 0) return 0
  return Math.max(0, creditiResidui(teamId, purchases, settings) - (mancanti - 1))
}

export function valuta(input: ValutazioneInput): ValutazioneLega {
  const {
    players,
    teams,
    purchases,
    settings,
    rules,
    projection = DEFAULT_PROJECTION,
    avversioneRischio = 0,
    concentration = 8,
  } = input

  const purchaseByPlayer = new Map(purchases.map((p) => [p.playerId, p]))

  // 1. rendimento atteso e rischio di ogni giocatore
  type Base = { player: Player; punti: number; rischio: number; fantamedia: number; presenze: number }
  const base: Base[] = players.map((player) => {
    const proj = project(player, projection)
    const a = analizza(player, proj, rules, concentration)
    return {
      player,
      punti: fantapuntiAttesi(proj, player.role, rules),
      rischio: a.bonusSd,
      fantamedia: a.fantamedia,
      presenze: a.presenze,
    }
  })

  // 2. livello di rimpiazzo per ruolo.
  //    Non è l'ultimo giocatore che entra in rosa, ma l'ultimo che entra in
  //    CAMPO: il terzo portiere occupa uno slot e non gioca mai, quindi
  //    misurarsi su di lui gonfierebbe il valore di tutti i portieri titolari.
  const nTeams = Math.max(1, teams.length)
  const rimpiazzo: Record<Role, number> = { P: 0, D: 0, C: 0, A: 0 }
  for (const r of ROLES) {
    const sorted = base
      .filter((b) => b.player.role === r)
      .sort((x, y) => y.punti - x.punti)
    const idx = nTeams * Math.max(1, settings.titolari[r])
    rimpiazzo[r] = sorted.length ? sorted[Math.min(idx, sorted.length - 1)].punti : 0
  }

  // 3. VOR, eventualmente corretto per il rischio
  const withVor = base.map((b) => {
    const vor = Math.max(0, b.punti - rimpiazzo[b.player.role])
    const penalita = avversioneRischio * b.rischio
    return { ...b, vor, vorAggiustato: Math.max(0, vor - penalita) }
  })

  // 4. prezzo di equilibrio a inizio asta
  const slotTot = totalSlots(settings.slots) * nTeams
  const creditiTot = settings.budget * nTeams
  const surplusIniziale = Math.max(0, creditiTot - slotTot)
  const vorTotIniziale = withVor.reduce((s, b) => s + b.vorAggiustato, 0)
  const tassoIniziale = vorTotIniziale > 0 ? surplusIniziale / vorTotIniziale : 0

  // 5. inflazione corrente: crediti e VOR ancora sul mercato
  const byId = new Map(players.map((p) => [p.id, p]))
  let creditiRimasti = 0
  let slotRimasti = 0
  for (const t of teams) {
    creditiRimasti += creditiResidui(t.id, purchases, settings)
    const presi = conteggioRuoli(t.id, purchases, byId)
    slotRimasti += ROLES.reduce((s, r) => s + Math.max(0, settings.slots[r] - presi[r]), 0)
  }
  const surplusCorrente = Math.max(0, creditiRimasti - slotRimasti)
  const vorDisponibile = withVor
    .filter((b) => !purchaseByPlayer.has(b.player.id))
    .reduce((s, b) => s + b.vorAggiustato, 0)
  const tassoCorrente = vorDisponibile > 0 ? surplusCorrente / vorDisponibile : 0
  const inflazione = tassoIniziale > 0 ? tassoCorrente / tassoIniziale : 1

  // 6. prezzo di mercato: l'FVM riscalato in modo che i giocatori che finiranno
  //    davvero in rosa assorbano tutti i crediti della lega
  const fvmOrdinati = [...players].sort((a, b) => b.fvm - a.fvm).slice(0, slotTot)
  const fvmTot = fvmOrdinati.reduce((s, p) => s + p.fvm, 0)
  const scalaMercato = fvmTot > 0 ? Math.max(0, creditiTot - slotTot) / fvmTot : 0

  const giocatori: ValutazioneGiocatore[] = withVor.map((b) => {
    const prezzoCorrente = Math.max(1, Math.round(1 + b.vorAggiustato * tassoCorrente))
    const prezzoMercato = Math.max(1, Math.round(1 + b.player.fvm * scalaMercato))
    return {
      player: b.player,
      fantapunti: b.punti,
      fantamedia: b.fantamedia,
      presenze: b.presenze,
      vor: b.vor,
      rischio: b.rischio,
      vorAggiustato: b.vorAggiustato,
      prezzoBase: Math.max(1, Math.round(1 + b.vorAggiustato * tassoIniziale)),
      prezzoCorrente,
      prezzoMercato,
      affare: prezzoCorrente - prezzoMercato,
      purchase: purchaseByPlayer.get(b.player.id),
    }
  })

  giocatori.sort((a, b) => b.vorAggiustato - a.vorAggiustato)

  return {
    giocatori,
    byId: new Map(giocatori.map((g) => [g.player.id, g])),
    rimpiazzo,
    inflazione,
    creditiResidui: creditiRimasti,
    slotResidui: slotRimasti,
  }
}

/**
 * Consiglio d'asta per una squadra specifica: il prezzo di equilibrio limitato
 * da quanto quella squadra può davvero permettersi.
 */
export interface Consiglio {
  /** Prezzo di equilibrio corrente. */
  prezzoConsigliato: number
  /** Tetto invalicabile: oltre non riempi la rosa. */
  offertaMassima: number
  /** Il consiglio operativo: min(prezzo, tetto). */
  offerta: number
  /** true se il giocatore vale più di quanto la squadra può spendere. */
  fuoriPortata: boolean
}

export function consiglia(
  valutazione: ValutazioneGiocatore,
  teamId: string,
  purchases: Purchase[],
  settings: LeagueSettings,
  byId: Map<string, Player>,
): Consiglio {
  const tetto = offertaMassima(teamId, purchases, settings, byId)
  const prezzo = valutazione.prezzoCorrente
  return {
    prezzoConsigliato: prezzo,
    offertaMassima: tetto,
    offerta: Math.min(prezzo, tetto),
    fuoriPortata: prezzo > tetto,
  }
}
