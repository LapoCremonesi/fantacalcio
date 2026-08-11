import { useMemo } from 'react'
import { analizza } from '../model/fantapunti'
import { project } from '../model/projection'
import { binned, tailProb, trim } from '../model/distribution'
import { ROLE_LABEL_SING, type Player } from '../model/types'
import { consiglia, type ValutazioneLega } from '../model/valuation'
import type { AppState } from '../store'
import { Histogram, Kpi, Modal, RoleBadge, fmt } from './common'

/**
 * Scheda giocatore: proiezione, distribuzione di probabilità di gol/assist/bonus
 * e prezzo consigliato.
 */
export function PlayerDetail({
  player,
  state,
  valutazione,
  playersById,
  onClose,
}: {
  player: Player
  state: AppState
  valutazione: ValutazioneLega
  playersById: Map<string, Player>
  onClose: () => void
}) {
  const val = valutazione.byId.get(player.id)
  const analisi = useMemo(
    () => analizza(player, project(player, state.projection), state.rules, state.concentration),
    [player, state.projection, state.rules, state.concentration],
  )

  const mine = state.teams.find((t) => t.isMine)
  const cons =
    val && mine
      ? consiglia(val, mine.id, state.purchases, state.settings, playersById)
      : undefined

  // tronchiamo le code per mostrare solo l'intervallo che conta davvero
  const golMax = Math.max(4, lastAbove(analisi.golPmf, 0.004))
  const assMax = Math.max(3, lastAbove(analisi.assistPmf, 0.004))
  const bonus = binned(trim(analisi.bonus, 0.002))

  const owner = val?.purchase && state.teams.find((t) => t.id === val.purchase!.teamId)

  return (
    <Modal title={player.name} onClose={onClose} wide>
      <div className="row" style={{ marginTop: -6, marginBottom: 14 }}>
        <RoleBadge role={player.role} />
        <span className="muted">
          {ROLE_LABEL_SING[player.role]} · {player.club}
        </span>
        <span className="pill">{player.mantra.join(', ')}</span>
        <span className="pill">FVM {player.fvm}</span>
        <span className="pill">Quot. {player.quot}</span>
        {owner && (
          <span className="pill warn">
            preso da {owner.name} a {val!.purchase!.price}
          </span>
        )}
      </div>

      {val && (
        <div className="grid cols-4" style={{ marginBottom: 16 }}>
          <Kpi k="Quanto vale" v={<span className="mono">{val.prezzoCorrente}</span>} />
          <Kpi
            k="Quanto costerà"
            v={
              <span className="mono">
                {val.prezzoMercato}{' '}
                <span className={val.affare > 0 ? 'pill good' : val.affare < 0 ? 'pill bad' : 'pill'}>
                  {val.affare > 0 ? `+${val.affare}` : val.affare}
                </span>
              </span>
            }
            small
          />
          <Kpi k="Fantamedia attesa" v={<span className="mono">{fmt(val.fantamedia, 2)}</span>} />
          <Kpi k="Presenze attese" v={<span className="mono">{fmt(val.presenze, 0)}</span>} />
        </div>
      )}

      {cons && mine && (
        <div className="panel" style={{ background: '#101724', marginBottom: 16 }}>
          <h2 style={{ fontSize: 14 }}>Consiglio per {mine.name}</h2>
          <div className="row">
            <span className="small">
              Offri fino a <b className="mono">{cons.offerta}</b> crediti.
            </span>
            {cons.fuoriPortata ? (
              <span className="pill bad">
                vale {cons.prezzoConsigliato} ma puoi arrivare solo a {cons.offertaMassima}
              </span>
            ) : (
              <span className="pill good">tetto di spesa {cons.offertaMassima}</span>
            )}
          </div>
        </div>
      )}

      <h3 style={{ fontSize: 14, margin: '0 0 2px' }}>Gol in stagione</h3>
      <p className="tiny muted" style={{ margin: '0 0 4px' }}>
        Distribuzione di probabilità: quanto è probabile ogni singolo numero di gol.
        Media {fmt(analisi.golAttesi, 1)} · valore più probabile <b>{analisi.golModa}</b> ·
        scarto ±{fmt(analisi.golSd, 1)}
      </p>
      <Histogram
        labels={range(golMax)}
        probs={analisi.golPmf.slice(0, golMax + 1)}
        highlight={analisi.golModa}
      />
      <div className="row tiny muted" style={{ marginTop: 6 }}>
        <span>
          P(almeno 1 gol) = {pct(tailProb(analisi.golPmf, 1))}
        </span>
        <span>
          P(≥ {Math.ceil(analisi.golAttesi)}) = {pct(tailProb(analisi.golPmf, Math.ceil(analisi.golAttesi)))}
        </span>
        <span>
          P(≥ {Math.ceil(analisi.golAttesi * 1.5)}) ={' '}
          {pct(tailProb(analisi.golPmf, Math.ceil(analisi.golAttesi * 1.5)))}
        </span>
      </div>

      <hr className="sep" />

      <h3 style={{ fontSize: 14, margin: '0 0 2px' }}>Assist in stagione</h3>
      <p className="tiny muted" style={{ margin: '0 0 4px' }}>
        Media {fmt(analisi.assistAttesi, 1)} · valore più probabile <b>{analisi.assistModa}</b>
      </p>
      <Histogram
        labels={range(assMax)}
        probs={analisi.assistPmf.slice(0, assMax + 1)}
        highlight={analisi.assistModa}
      />

      <hr className="sep" />

      <h3 style={{ fontSize: 14, margin: '0 0 2px' }}>Bonus totali di stagione</h3>
      <p className="tiny muted" style={{ margin: '0 0 4px' }}>
        Gol × {state.rules.gol}, assist × {state.rules.assist}, meno i malus. È la parte di
        fantapunti che dipende davvero dal giocatore.
      </p>
      <Histogram labels={bonus.labels} probs={bonus.probs} />
      <div className="grid cols-4" style={{ marginTop: 10 }}>
        <Kpi k="Media" v={<span className="mono">{fmt(analisi.bonusMedio, 1)}</span>} small />
        <Kpi
          k="Scenario basso (10%)"
          v={<span className="mono">{fmt(analisi.bonusP10, 1)}</span>}
          small
        />
        <Kpi k="Mediana" v={<span className="mono">{fmt(analisi.bonusP50, 1)}</span>} small />
        <Kpi
          k="Scenario alto (90%)"
          v={<span className="mono">{fmt(analisi.bonusP90, 1)}</span>}
          small
        />
      </div>
      <p className="tiny muted" style={{ marginTop: 10, marginBottom: 0 }}>
        Nel 10% dei casi peggiori chiude sotto {fmt(analisi.bonusP10, 1)} punti di bonus, nel 10%
        migliore sopra {fmt(analisi.bonusP90, 1)}: è questo intervallo, non la media, il rischio
        che ti prendi pagandolo.
      </p>

      <div className="modal-actions">
        <button onClick={onClose}>Chiudi</button>
      </div>
    </Modal>
  )
}

function range(n: number): number[] {
  return Array.from({ length: n + 1 }, (_, i) => i)
}

function lastAbove(pmf: number[], eps: number): number {
  let last = 0
  for (let i = 0; i < pmf.length; i++) if (pmf[i] >= eps) last = i
  return last
}

function pct(x: number): string {
  return `${(x * 100).toFixed(0)}%`
}
