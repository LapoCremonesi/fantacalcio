import { useMemo } from 'react'
import { ROLES, ROLE_LABEL, type Player, type Role } from '../model/types'
import { conteggioRuoli, creditiResidui, offertaMassima, type ValutazioneLega } from '../model/valuation'
import type { AppState } from '../store'
import { Kpi, RoleBadge, fmt } from './common'

/**
 * Pannello operativo durante l'asta: quanto ti resta, quanto devi ancora
 * spendere per ruolo e i migliori affari ancora liberi.
 */
export function AuctionView({
  state,
  valutazione,
  playersById,
  onOpenPlayer,
}: {
  state: AppState
  valutazione: ValutazioneLega
  playersById: Map<string, Player>
  onOpenPlayer: (p: Player) => void
}) {
  const mine = state.teams.find((t) => t.isMine)

  const budgetPerRuolo = useMemo(() => {
    // quanto vale, ai prezzi correnti, riempire ogni ruolo con giocatori
    // di livello medio-alto ancora disponibili
    const out: Record<Role, { mancanti: number; costoStimato: number }> = {
      P: { mancanti: 0, costoStimato: 0 },
      D: { mancanti: 0, costoStimato: 0 },
      C: { mancanti: 0, costoStimato: 0 },
      A: { mancanti: 0, costoStimato: 0 },
    }
    if (!mine) return out
    const presi = conteggioRuoli(mine.id, state.purchases, playersById)
    for (const r of ROLES) {
      const mancanti = Math.max(0, state.settings.slots[r] - presi[r])
      const liberi = valutazione.giocatori
        .filter((g) => g.player.role === r && !g.purchase)
        .sort((a, b) => b.prezzoCorrente - a.prezzoCorrente)
      // I giocatori liberi si dividono in fasce da `squadre` elementi: la prima
      // fascia sono i migliori, uno per squadra, e così via. In una lega
      // equilibrata da ogni fascia ne prendi uno, ma non è detto sia il migliore
      // della fascia: il costo atteso è la MEDIA della fascia. (Prendere sempre
      // il migliore sovrastimerebbe, perché la curva dei prezzi è ripida in cima.)
      const quota = Math.max(1, state.teams.length)
      let costo = 0
      for (let i = 0; i < mancanti; i++) {
        const da = i * quota
        const a = Math.min(liberi.length, da + quota)
        if (da >= liberi.length) {
          costo += 1
          continue
        }
        let somma = 0
        for (let k = da; k < a; k++) somma += liberi[k].prezzoCorrente
        costo += somma / (a - da)
      }
      out[r] = { mancanti, costoStimato: Math.round(costo) }
    }
    return out
  }, [mine, state.purchases, state.settings, state.teams.length, valutazione, playersById])

  const affari = useMemo(
    () =>
      valutazione.giocatori
        .filter((g) => !g.purchase && g.vorAggiustato > 0)
        .slice(0, 25),
    [valutazione],
  )

  if (!state.teams.length) {
    return (
      <div className="panel">
        <div className="empty">
          Aggiungi prima le squadre della lega dalla schermata <b>Squadre</b>.
        </div>
      </div>
    )
  }

  const residui = mine ? creditiResidui(mine.id, state.purchases, state.settings) : 0
  const max = mine ? offertaMassima(mine.id, state.purchases, state.settings, playersById) : 0
  const stimaTot = ROLES.reduce((s, r) => s + budgetPerRuolo[r].costoStimato, 0)

  return (
    <>
      <div className="panel">
        <h2>Situazione asta</h2>
        <p className="hint">
          I prezzi si aggiornano a ogni acquisto registrato: se la lega spende più del dovuto sui
          big, quello che resta si sgonfia e conviene aspettare.
        </p>
        <div className="grid cols-4">
          <Kpi k="Crediti in lega" v={<span className="mono">{valutazione.creditiResidui}</span>} />
          <Kpi k="Slot da riempire" v={<span className="mono">{valutazione.slotResidui}</span>} />
          <Kpi
            k="Inflazione prezzi"
            v={
              <span className="mono">
                {fmt(valutazione.inflazione, 2)}×{' '}
                <span
                  className={
                    valutazione.inflazione > 1.05
                      ? 'pill bad'
                      : valutazione.inflazione < 0.95
                        ? 'pill good'
                        : 'pill'
                  }
                >
                  {valutazione.inflazione > 1.05
                    ? 'si paga caro'
                    : valutazione.inflazione < 0.95
                      ? 'occasioni'
                      : 'in linea'}
                </span>
              </span>
            }
            small
          />
          <Kpi
            k="Prezzo medio per slot"
            v={
              <span className="mono">
                {valutazione.slotResidui
                  ? fmt(valutazione.creditiResidui / valutazione.slotResidui, 1)
                  : '—'}
              </span>
            }
          />
        </div>
      </div>

      {mine && (
        <div className="panel">
          <h2>{mine.name}: come distribuire i crediti</h2>
          <p className="hint">
            Stima di quanto ti serve per ogni ruolo se punti a giocatori della fascia che ti
            spetta, ai prezzi correnti.
          </p>
          <div className="grid cols-4" style={{ marginBottom: 12 }}>
            <Kpi k="Crediti residui" v={<span className="mono">{residui}</span>} />
            <Kpi k="Offerta massima" v={<span className="mono">{max}</span>} />
            <Kpi k="Serve circa" v={<span className="mono">{stimaTot}</span>} />
            <Kpi
              k="Margine"
              v={
                <span className={residui - stimaTot >= 0 ? 'mono' : 'mono'}>
                  {residui - stimaTot >= 0 ? '+' : ''}
                  {residui - stimaTot}
                </span>
              }
            />
          </div>
          <table>
            <thead>
              <tr>
                <th className="no-sort"></th>
                <th className="no-sort">Ruolo</th>
                <th className="no-sort num">Mancanti</th>
                <th className="no-sort num">Crediti stimati</th>
                <th className="no-sort num">% del residuo</th>
              </tr>
            </thead>
            <tbody>
              {ROLES.map((r) => (
                <tr key={r}>
                  <td>
                    <RoleBadge role={r} />
                  </td>
                  <td>{ROLE_LABEL[r]}</td>
                  <td className="num">{budgetPerRuolo[r].mancanti}</td>
                  <td className="num">
                    <b>{budgetPerRuolo[r].costoStimato}</b>
                  </td>
                  <td className="num muted">
                    {residui > 0
                      ? `${Math.round((budgetPerRuolo[r].costoStimato / residui) * 100)}%`
                      : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="panel">
        <h2>Migliori giocatori ancora liberi</h2>
        <p className="hint">Ordinati per valore sul rimpiazzo: è la lista da cui pescare.</p>
        <div className="table-wrap" style={{ maxHeight: '46vh' }}>
          <table>
            <thead>
              <tr>
                <th className="no-sort"></th>
                <th className="no-sort">Giocatore</th>
                <th className="no-sort">Squadra</th>
                <th className="no-sort num">Fantamedia</th>
                <th className="no-sort num">Vale</th>
                <th className="no-sort num">Mercato</th>
                <th className="no-sort num">Affare</th>
              </tr>
            </thead>
            <tbody>
              {affari.map((g) => (
                <tr key={g.player.id} className="clickable" onClick={() => onOpenPlayer(g.player)}>
                  <td>
                    <RoleBadge role={g.player.role} />
                  </td>
                  <td>{g.player.name}</td>
                  <td className="muted">{g.player.club}</td>
                  <td className="num">{fmt(g.fantamedia, 2)}</td>
                  <td className="num">
                    <b>{g.prezzoCorrente}</b>
                  </td>
                  <td className="num muted">{g.prezzoMercato}</td>
                  <td className="num">
                    <span className={g.affare > 0 ? 'pill good' : g.affare < 0 ? 'pill bad' : 'pill'}>
                      {g.affare > 0 ? '+' : ''}
                      {g.affare}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}
