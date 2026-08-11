import { PLAYERS } from '../data/players'
import { describe, expect, it } from 'vitest'
import {
  betaNodes,
  convolve,
  eventiStagione,
  gridMean,
  mean,
  moda,
  poissonPmf,
  poissonVector,
  binned,
  scaledDist,
  trim,
  variance,
} from './distribution'
import { analizza, fantamediaAttesa, fantapuntiAttesi } from './fantapunti'
import { DEFAULT_PROJECTION, presenzeAttese, project } from './projection'
import { DEFAULT_SCORING, DEFAULT_SLOTS, DEFAULT_TITOLARI, GIORNATE, ROLES, type Player } from './types'
import { consiglia, offertaMassima, valuta } from './valuation'

const p = (over: Partial<Player> = {}): Player => ({
  id: over.id ?? 'x',
  name: over.name ?? 'Test',
  club: over.club ?? 'Atalanta',
  role: over.role ?? 'A',
  mantra: over.mantra ?? ['Pc'],
  fvm: over.fvm ?? 100,
  quot: over.quot ?? 18,
})

describe('poisson', () => {
  it('somma a 1 su un supporto ampio', () => {
    const v = poissonVector(8, 60)
    expect(v.reduce((a, b) => a + b, 0)).toBeCloseTo(1, 8)
  })

  it('ha media e varianza pari a lambda', () => {
    const v = poissonVector(6.4, 80)
    expect(mean(v)).toBeCloseTo(6.4, 6)
    expect(variance(v)).toBeCloseTo(6.4, 5)
  })

  it('coincide con i valori noti', () => {
    expect(poissonPmf(0, 2)).toBeCloseTo(Math.exp(-2), 12)
    expect(poissonPmf(1, 2)).toBeCloseTo(2 * Math.exp(-2), 12)
    expect(poissonPmf(3, 1)).toBeCloseTo(Math.exp(-1) / 6, 12)
  })
})

describe('betaNodes', () => {
  it('i pesi sommano a 1 e la media è quella richiesta', () => {
    const nodes = betaNodes(0.75, 12, 200)
    const tot = nodes.reduce((s, n) => s + n.w, 0)
    expect(tot).toBeCloseTo(1, 10)
    const m = nodes.reduce((s, n) => s + n.x * n.w, 0)
    expect(m).toBeCloseTo(0.75, 2)
  })
})

describe('eventiStagione', () => {
  it('conserva il numero atteso di eventi', () => {
    const pmf = eventiStagione(12, 30, GIORNATE, 8, 60)
    expect(mean(pmf)).toBeCloseTo(12, 1)
  })

  it('è sovradispersa rispetto alla Poisson pura', () => {
    // mescolare sulla disponibilità aggiunge varianza: Var > media
    const pmf = eventiStagione(12, 30, GIORNATE, 8, 60)
    expect(variance(pmf)).toBeGreaterThan(mean(pmf))
  })

  it('tende alla Poisson quando la disponibilità è quasi certa', () => {
    const pmf = eventiStagione(10, 38, GIORNATE, 5000, 60)
    expect(variance(pmf)).toBeCloseTo(10, 0)
  })

  it('la moda sta sotto la media per distribuzioni asimmetriche', () => {
    const pmf = eventiStagione(9, 28, GIORNATE, 8, 60)
    expect(moda(pmf)).toBeLessThanOrEqual(Math.ceil(mean(pmf)))
  })

  it('un giocatore senza gol attesi non segna mai', () => {
    const pmf = eventiStagione(0, 30, GIORNATE, 8, 20)
    expect(pmf[0]).toBe(1)
  })
})

describe('convoluzione dei bonus', () => {
  it('la media della somma è la somma delle medie', () => {
    const gol = eventiStagione(10, 30, GIORNATE, 8, 45)
    const ass = eventiStagione(5, 30, GIORNATE, 8, 30)
    const d = convolve(scaledDist(gol, 3, 0.5), scaledDist(ass, 1, 0.5))
    expect(gridMean(d)).toBeCloseTo(3 * mean(gol) + 1 * mean(ass), 4)
  })

  it('le probabilità restano normalizzate', () => {
    const gol = eventiStagione(7, 25, GIORNATE, 8, 45)
    const ass = eventiStagione(3, 25, GIORNATE, 8, 30)
    const d = convolve(scaledDist(gol, 3, 0.5), scaledDist(ass, 1, 0.5))
    expect(d.probs.reduce((a, b) => a + b, 0)).toBeCloseTo(1, 8)
  })
})

describe('presenze', () => {
  it('cresce con l’FVM e resta sotto le 38 giornate', () => {
    const a = presenzeAttese(1, DEFAULT_PROJECTION)
    const b = presenzeAttese(100, DEFAULT_PROJECTION)
    const c = presenzeAttese(400, DEFAULT_PROJECTION)
    expect(a).toBeLessThan(b)
    expect(b).toBeLessThan(c)
    expect(c).toBeLessThanOrEqual(GIORNATE)
  })
})

describe('proiezione', () => {
  it('rispetta gli ancoraggi del ruolo', () => {
    const top = DEFAULT_PROJECTION.roles.A.top
    const proj = project(p({ role: 'A', fvm: top.fvm }), DEFAULT_PROJECTION)
    expect(proj.gol).toBeCloseTo(top.gol, 6)
    const mid = DEFAULT_PROJECTION.roles.A.mid
    const proj2 = project(p({ role: 'A', fvm: mid.fvm }), DEFAULT_PROJECTION)
    expect(proj2.gol).toBeCloseTo(mid.gol, 6)
  })

  it('un attaccante da 370 segna più di uno da 30', () => {
    const top = project(p({ role: 'A', fvm: 370 }))
    const low = project(p({ role: 'A', fvm: 30 }))
    expect(top.gol).toBeGreaterThan(low.gol)
  })

  it('i portieri non segnano ma subiscono gol', () => {
    const proj = project(p({ role: 'P', fvm: 40, mantra: ['Por'] }))
    expect(proj.gol).toBe(0)
    expect(proj.assist).toBe(0)
    expect(proj.golSubiti).toBeGreaterThan(0)
  })

  it('un portiere di una squadra forte subisce meno gol', () => {
    const forte = project(p({ role: 'P', fvm: 60 }))
    const debole = project(p({ role: 'P', fvm: 8 }))
    expect(forte.golSubiti / forte.presenze).toBeLessThan(debole.golSubiti / debole.presenze)
  })
})

describe('fantapunti', () => {
  it('la fantamedia di un top attaccante è sopra il 7', () => {
    const pl = p({ role: 'A', fvm: 370 })
    const fm = fantamediaAttesa(project(pl), 'A', DEFAULT_SCORING)
    expect(fm).toBeGreaterThan(7)
    expect(fm).toBeLessThan(9.5)
  })

  it('la fantamedia di una riserva resta vicina al voto base', () => {
    const pl = p({ role: 'D', fvm: 1 })
    const fm = fantamediaAttesa(project(pl), 'D', DEFAULT_SCORING)
    expect(fm).toBeGreaterThan(5.4)
    expect(fm).toBeLessThan(6.4)
  })

  it('i fantapunti crescono con l’FVM', () => {
    const alto = fantapuntiAttesi(project(p({ fvm: 300 })), 'A', DEFAULT_SCORING)
    const basso = fantapuntiAttesi(project(p({ fvm: 10 })), 'A', DEFAULT_SCORING)
    expect(alto).toBeGreaterThan(basso)
  })

  it('analizza restituisce una distribuzione coerente', () => {
    const pl = p({ role: 'A', fvm: 200 })
    const a = analizza(pl, project(pl), DEFAULT_SCORING)
    expect(a.golPmf.reduce((x, y) => x + y, 0)).toBeCloseTo(1, 8)
    expect(a.golAttesi).toBeGreaterThan(5)
    expect(a.bonusP10).toBeLessThan(a.bonusP50)
    expect(a.bonusP50).toBeLessThan(a.bonusP90)
    expect(a.bonusSd).toBeGreaterThan(0)
  })

  it('più gol attesi significa più rischio assoluto', () => {
    const forte = p({ role: 'A', fvm: 350 })
    const medio = p({ role: 'A', fvm: 60 })
    const af = analizza(forte, project(forte), DEFAULT_SCORING)
    const am = analizza(medio, project(medio), DEFAULT_SCORING)
    expect(af.bonusSd).toBeGreaterThan(am.bonusSd)
  })
})

describe('valutazione', () => {
  const players: Player[] = []
  for (const [role, n, maxFvm] of [
    ['P', 30, 60],
    ['D', 90, 32],
    ['C', 90, 250],
    ['A', 60, 370],
  ] as const) {
    for (let i = 0; i < n; i++) {
      players.push(
        p({
          id: `${role}${i}`,
          name: `${role}${i}`,
          role,
          fvm: Math.max(1, Math.round(maxFvm * Math.pow(1 - i / n, 3))),
        }),
      )
    }
  }
  const teams = Array.from({ length: 8 }, (_, i) => ({
    id: `t${i}`,
    name: `Team ${i}`,
    isMine: i === 0,
  }))
  const settings = { budget: 500, slots: { P: 3, D: 8, C: 8, A: 6 }, titolari: DEFAULT_TITOLARI }

  it('distribuisce esattamente il budget della lega fra i giocatori da rosa', () => {
    const v = valuta({ players, teams, purchases: [], settings, rules: DEFAULT_SCORING })
    const nRosa = 8 * (3 + 8 + 8 + 6)
    const totale = v.giocatori.slice(0, nRosa).reduce((s, g) => s + g.prezzoBase, 0)
    // il totale dei prezzi dei giocatori da rosa deve avvicinarsi al budget totale
    expect(totale).toBeGreaterThan(8 * 500 * 0.75)
    expect(totale).toBeLessThan(8 * 500 * 1.25)
  })

  it('il giocatore di rimpiazzo vale zero VOR', () => {
    const v = valuta({ players, teams, purchases: [], settings, rules: DEFAULT_SCORING })
    const scarso = v.giocatori[v.giocatori.length - 1]
    expect(scarso.vor).toBe(0)
    expect(scarso.prezzoBase).toBe(1)
  })

  it('ordina i giocatori per valore decrescente', () => {
    const v = valuta({ players, teams, purchases: [], settings, rules: DEFAULT_SCORING })
    for (let i = 1; i < v.giocatori.length; i++) {
      expect(v.giocatori[i - 1].vorAggiustato).toBeGreaterThanOrEqual(v.giocatori[i].vorAggiustato)
    }
  })

  it('l’avversione al rischio abbassa il valore dei giocatori più volatili', () => {
    const neutro = valuta({ players, teams, purchases: [], settings, rules: DEFAULT_SCORING })
    const avverso = valuta({
      players,
      teams,
      purchases: [],
      settings,
      rules: DEFAULT_SCORING,
      avversioneRischio: 0.5,
    })
    const top = neutro.giocatori[0].player.id
    expect(avverso.byId.get(top)!.vorAggiustato).toBeLessThan(neutro.byId.get(top)!.vorAggiustato)
  })

  it('i prezzi si gonfiano se la lega spende poco per i big', () => {
    // le squadre comprano i 10 migliori a 1 credito: restano tanti crediti
    // per pochi giocatori di valore => inflazione > 1
    const purchases = valuta({
      players,
      teams,
      purchases: [],
      settings,
      rules: DEFAULT_SCORING,
    })
      .giocatori.slice(0, 10)
      .map((g, i) => ({ playerId: g.player.id, teamId: teams[i % 8].id, price: 1 }))
    const v = valuta({ players, teams, purchases, settings, rules: DEFAULT_SCORING })
    expect(v.inflazione).toBeGreaterThan(1)
  })

  it('il rimpiazzo si misura sui titolari, non sulla profondità della rosa', () => {
    // con 3 portieri in rosa ma 1 solo titolare, il riferimento è l'8° portiere
    // della lega, non il 24°: altrimenti ogni portiere titolare sembra un fenomeno
    const v = valuta({ players, teams, purchases: [], settings, rules: DEFAULT_SCORING })
    const portieri = v.giocatori.filter((g) => g.player.role === 'P')
    const topP = portieri[0]
    const prezzoTopAttaccante = v.giocatori.find((g) => g.player.role === 'A')!.prezzoBase
    expect(topP.prezzoBase).toBeLessThan(prezzoTopAttaccante)
  })

  it('il prezzo di mercato distribuisce il budget della lega', () => {
    const v = valuta({ players, teams, purchases: [], settings, rules: DEFAULT_SCORING })
    const nRosa = 8 * (3 + 8 + 8 + 6)
    const totale = [...v.giocatori]
      .sort((a, b) => b.prezzoMercato - a.prezzoMercato)
      .slice(0, nRosa)
      .reduce((s, g) => s + g.prezzoMercato, 0)
    expect(totale).toBeGreaterThan(8 * 500 * 0.85)
    expect(totale).toBeLessThan(8 * 500 * 1.15)
  })

  it('affare è la differenza fra valore e prezzo di mercato', () => {
    const v = valuta({ players, teams, purchases: [], settings, rules: DEFAULT_SCORING })
    for (const g of v.giocatori.slice(0, 20)) {
      expect(g.affare).toBe(g.prezzoCorrente - g.prezzoMercato)
    }
  })

  it('i prezzi si sgonfiano se la lega ha già bruciato i crediti', () => {
    const purchases = valuta({
      players,
      teams,
      purchases: [],
      settings,
      rules: DEFAULT_SCORING,
    })
      .giocatori.slice(0, 16)
      .map((g, i) => ({ playerId: g.player.id, teamId: teams[i % 8].id, price: 200 }))
    const v = valuta({ players, teams, purchases, settings, rules: DEFAULT_SCORING })
    expect(v.inflazione).toBeLessThan(1)
  })
})

describe('offerta massima', () => {
  const byId = new Map<string, Player>([
    ['a', p({ id: 'a', role: 'A' })],
    ['b', p({ id: 'b', role: 'D' })],
  ])
  const settings = { budget: 500, slots: { P: 3, D: 8, C: 8, A: 6 }, titolari: DEFAULT_TITOLARI }

  it('tiene da parte 1 credito per ogni slot ancora vuoto', () => {
    const max = offertaMassima('t1', [], settings, byId)
    expect(max).toBe(500 - (25 - 1))
  })

  it('scala con la spesa già fatta', () => {
    const purchases = [{ playerId: 'a', teamId: 't1', price: 100 }]
    const max = offertaMassima('t1', purchases, settings, byId)
    expect(max).toBe(400 - (24 - 1))
  })

  it('è zero a rosa completa', () => {
    const full = { budget: 500, slots: { P: 0, D: 0, C: 0, A: 1 }, titolari: DEFAULT_TITOLARI }
    const purchases = [{ playerId: 'a', teamId: 't1', price: 10 }]
    expect(offertaMassima('t1', purchases, full, byId)).toBe(0)
  })

  it('il consiglio non supera mai il tetto di spesa', () => {
    const valutazione = {
      player: p({ id: 'a' }),
      fantapunti: 300,
      fantamedia: 8,
      presenze: 34,
      vor: 200,
      rischio: 20,
      vorAggiustato: 200,
      prezzoBase: 400,
      prezzoCorrente: 400,
      prezzoMercato: 380,
      affare: 20,
    }
    const purchases = [{ playerId: 'b', teamId: 't1', price: 480 }]
    const c = consiglia(valutazione, 't1', purchases, settings, byId)
    expect(c.offerta).toBeLessThanOrEqual(c.offertaMassima)
    expect(c.fuoriPortata).toBe(true)
  })
})

describe('binning del grafico', () => {
  it('allinea i bin agli interi anche con griglia a passo 0,5', () => {
    const gol = eventiStagione(10, 30, GIORNATE, 8, 45)
    const ass = eventiStagione(5, 30, GIORNATE, 8, 30)
    const d = convolve(scaledDist(gol, 3, 0.5), scaledDist(ass, 1, 0.5))
    const b = binned(trim(d, 0.002), 26)
    // nessun bin deve restare vuoto in mezzo alla distribuzione
    const dentro = b.probs.slice(1, -1)
    expect(dentro.every((p) => p > 0)).toBe(true)
    expect(b.probs.length).toBeLessThanOrEqual(26)
  })

  it('conserva la probabilità totale', () => {
    const gol = eventiStagione(8, 28, GIORNATE, 8, 45)
    const d = scaledDist(gol, 3, 0.5)
    const b = binned(d, 20)
    expect(b.probs.reduce((x, y) => x + y, 0)).toBeCloseTo(1, 8)
  })
})

describe('stima crediti per ruolo', () => {
  it('a inizio asta la somma delle fasce vale quanto il budget', () => {
    const teams = Array.from({ length: 8 }, (_, i) => ({ id: `t${i}`, name: `T${i}`, isMine: i === 0 }))
    const settings = { budget: 500, slots: DEFAULT_SLOTS, titolari: DEFAULT_TITOLARI }
    const v = valuta({ players: PLAYERS, teams, purchases: [], settings, rules: DEFAULT_SCORING })
    let tot = 0
    for (const r of ROLES) {
      const liberi = v.giocatori
        .filter((g) => g.player.role === r && !g.purchase)
        .sort((a, b) => b.prezzoCorrente - a.prezzoCorrente)
      const quota = 8
      for (let i = 0; i < settings.slots[r]; i++) {
        const da = i * quota
        const a = Math.min(liberi.length, da + quota)
        if (da >= liberi.length) { tot += 1; continue }
        let s = 0
        for (let k = da; k < a; k++) s += liberi[k].prezzoCorrente
        tot += s / (a - da)
      }
    }
    expect(tot).toBeGreaterThan(settings.budget * 0.85)
    expect(tot).toBeLessThan(settings.budget * 1.15)
  })
})
