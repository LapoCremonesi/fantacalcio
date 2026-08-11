import { useMemo, useState } from 'react'
import { ROLES, ROLE_LABEL, type Player, type Role } from '../model/types'
import {
  conteggioRuoli,
  creditiResidui,
  offertaMassima,
  spesa,
  type ValutazioneGiocatore,
  type ValutazioneLega,
} from '../model/valuation'
import type { Actions, AppState } from '../store'
import { Field, Modal, RoleBadge, fmt } from './common'

/** Rosa di una squadra + ricerca giocatore per aggiungere un acquisto. */
export function TeamDetail({
  teamId,
  state,
  actions,
  valutazione,
  playersById,
  onClose,
  onOpenPlayer,
}: {
  teamId: string
  state: AppState
  actions: Actions
  valutazione: ValutazioneLega
  playersById: Map<string, Player>
  onClose: () => void
  onOpenPlayer: (p: Player) => void
}) {
  const team = state.teams.find((t) => t.id === teamId)
  const [picking, setPicking] = useState<Role | 'any' | null>(null)

  if (!team) return null

  const residui = creditiResidui(team.id, state.purchases, state.settings)
  const presi = conteggioRuoli(team.id, state.purchases, playersById)
  const max = offertaMassima(team.id, state.purchases, state.settings, playersById)
  const rosa = state.purchases
    .filter((p) => p.teamId === team.id)
    .map((p) => ({ purchase: p, val: valutazione.byId.get(p.playerId) }))
    .filter((x) => x.val)
    .sort((a, b) => {
      const oa = ROLES.indexOf(a.val!.player.role)
      const ob = ROLES.indexOf(b.val!.player.role)
      return oa - ob || b.purchase.price - a.purchase.price
    })

  const valoreRosa = rosa.reduce((s, r) => s + r.val!.prezzoBase, 0)
  const spesoTot = spesa(team.id, state.purchases)

  return (
    <Modal title={team.name} onClose={onClose} wide>
      <div className="grid cols-4" style={{ marginBottom: 14 }}>
        <div className="kpi">
          <div className="k">Crediti residui</div>
          <div className="v mono">{residui}</div>
        </div>
        <div className="kpi">
          <div className="k">Spesi</div>
          <div className="v mono">{spesoTot}</div>
        </div>
        <div className="kpi">
          <div className="k">Offerta massima</div>
          <div className="v mono">{max}</div>
        </div>
        <div className="kpi">
          <div className="k">Valore rosa</div>
          <div className="v mono" title="Somma dei prezzi di equilibrio dei giocatori presi">
            {valoreRosa}
          </div>
        </div>
      </div>

      {spesoTot > 0 && (
        <p className="tiny muted" style={{ marginTop: -6 }}>
          {valoreRosa >= spesoTot
            ? `Hai preso ${valoreRosa - spesoTot} crediti di valore in più di quanto hai speso.`
            : `Hai pagato ${spesoTot - valoreRosa} crediti sopra il valore di equilibrio.`}
        </p>
      )}

      {ROLES.map((r) => {
        const items = rosa.filter((x) => x.val!.player.role === r)
        const mancanti = state.settings.slots[r] - presi[r]
        return (
          <div key={r} style={{ marginBottom: 14 }}>
            <div className="row" style={{ marginBottom: 6 }}>
              <RoleBadge role={r} />
              <b style={{ fontSize: 14 }}>{ROLE_LABEL[r]}</b>
              <span className="muted small">
                {presi[r]}/{state.settings.slots[r]}
              </span>
              <button
                className="ghost tiny"
                style={{ marginLeft: 'auto' }}
                onClick={() => setPicking(r)}
                disabled={mancanti <= 0}
              >
                + Aggiungi {ROLE_LABEL[r].toLowerCase().slice(0, -1)}e
              </button>
            </div>
            {items.length ? (
              <table>
                <tbody>
                  {items.map(({ purchase, val }) => (
                    <tr key={purchase.playerId} className="clickable">
                      <td onClick={() => onOpenPlayer(val!.player)}>{val!.player.name}</td>
                      <td className="muted" onClick={() => onOpenPlayer(val!.player)}>
                        {val!.player.club}
                      </td>
                      <td className="num muted" title="Fantamedia attesa">
                        {fmt(val!.fantamedia, 2)}
                      </td>
                      <td className="num" title="Prezzo di equilibrio">
                        <span className="muted">val. {val!.prezzoBase}</span>
                      </td>
                      <td className="num">
                        <b>{purchase.price}</b>
                      </td>
                      <td style={{ width: 1 }}>
                        <button
                          className="ghost tiny"
                          onClick={() => actions.removePurchase(purchase.playerId)}
                        >
                          ✕
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="tiny muted" style={{ padding: '4px 8px' }}>
                Nessun {ROLE_LABEL[r].toLowerCase().slice(0, -1)}e ancora.
              </div>
            )}
          </div>
        )
      })}

      <div className="modal-actions">
        <button onClick={onClose}>Chiudi</button>
        <button className="primary" onClick={() => setPicking('any')}>
          + Aggiungi giocatore
        </button>
      </div>

      {picking && (
        <PlayerPicker
          role={picking === 'any' ? undefined : picking}
          actions={actions}
          valutazione={valutazione}
          teamId={team.id}
          onClose={() => setPicking(null)}
        />
      )}
    </Modal>
  )
}

/** Ricerca rapida di un giocatore libero, con prezzo consigliato e crediti pagati. */
function PlayerPicker({
  role,
  actions,
  valutazione,
  teamId,
  onClose,
}: {
  role?: Role
  actions: Actions
  valutazione: ValutazioneLega
  teamId: string
  onClose: () => void
}) {
  const [q, setQ] = useState('')
  const [sel, setSel] = useState<ValutazioneGiocatore | null>(null)
  const [price, setPrice] = useState('')

  const results = useMemo(() => {
    const needle = q.trim().toLowerCase()
    return valutazione.giocatori
      .filter((g) => !g.purchase)
      .filter((g) => !role || g.player.role === role)
      .filter(
        (g) =>
          !needle ||
          g.player.name.toLowerCase().includes(needle) ||
          g.player.club.toLowerCase().includes(needle),
      )
      .slice(0, 60)
  }, [valutazione, q, role])

  const choose = (g: ValutazioneGiocatore) => {
    setSel(g)
    setPrice(String(g.prezzoCorrente))
  }

  const submit = () => {
    const n = Number(price)
    if (!sel || !Number.isFinite(n) || n < 1) return
    actions.addPurchase(sel.player.id, teamId, n)
    onClose()
  }

  return (
    <Modal
      title={role ? `Aggiungi ${ROLE_LABEL[role].toLowerCase()}` : 'Aggiungi giocatore'}
      onClose={onClose}
      wide
    >
      {sel ? (
        <>
          <div className="row" style={{ marginBottom: 14 }}>
            <RoleBadge role={sel.player.role} />
            <b>{sel.player.name}</b>
            <span className="muted">{sel.player.club}</span>
            <span className="pill good">vale {sel.prezzoCorrente}</span>
            <span className="pill">mercato {sel.prezzoMercato}</span>
            <span className="pill">fantamedia {fmt(sel.fantamedia, 2)}</span>
          </div>
          <Field label="Crediti pagati">
            <input
              autoFocus
              type="number"
              min={1}
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && submit()}
            />
          </Field>
          <div className="modal-actions">
            <button onClick={() => setSel(null)}>Indietro</button>
            <button className="primary" onClick={submit}>
              Salva acquisto
            </button>
          </div>
        </>
      ) : (
        <>
          <Field label="Cerca per nome o squadra">
            <input
              autoFocus
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Es. Lautaro, Napoli…"
            />
          </Field>
          <div className="table-wrap" style={{ marginTop: 12, maxHeight: '50vh' }}>
            <table>
              <thead>
                <tr>
                  <th className="no-sort"></th>
                  <th className="no-sort">Giocatore</th>
                  <th className="no-sort">Squadra</th>
                  <th className="no-sort num">Fantamedia</th>
                  <th className="no-sort num">Mercato</th>
                  <th className="no-sort num">Vale</th>
                </tr>
              </thead>
              <tbody>
                {results.map((g) => (
                  <tr key={g.player.id} className="clickable" onClick={() => choose(g)}>
                    <td>
                      <RoleBadge role={g.player.role} />
                    </td>
                    <td>{g.player.name}</td>
                    <td className="muted">{g.player.club}</td>
                    <td className="num">{fmt(g.fantamedia, 2)}</td>
                    <td className="num muted">{g.prezzoMercato}</td>
                    <td className="num">
                      <b>{g.prezzoCorrente}</b>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!results.length && <div className="empty">Nessun giocatore libero trovato.</div>}
          </div>
          <div className="modal-actions">
            <button onClick={onClose}>Annulla</button>
          </div>
        </>
      )}
    </Modal>
  )
}
