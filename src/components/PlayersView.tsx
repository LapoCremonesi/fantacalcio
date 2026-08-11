import { useMemo, useState } from 'react'
import { ROLES, ROLE_LABEL, type Player, type Role } from '../model/types'
import type { ValutazioneGiocatore, ValutazioneLega } from '../model/valuation'
import type { Actions, AppState } from '../store'
import { Field, Modal, RoleBadge, fmt } from './common'

type SortKey =
  | 'prezzoCorrente'
  | 'prezzoMercato'
  | 'affare'
  | 'vor'
  | 'fantamedia'
  | 'presenze'
  | 'fvm'
  | 'rischio'
  | 'name'

/** Listone completo con prezzi consigliati, filtri e assegnazione all'asta. */
export function PlayersView({
  state,
  actions,
  valutazione,
  onOpenPlayer,
  clubs,
}: {
  state: AppState
  actions: Actions
  valutazione: ValutazioneLega
  onOpenPlayer: (p: Player) => void
  clubs: string[]
}) {
  const [q, setQ] = useState('')
  const [role, setRole] = useState<Role | ''>('')
  const [club, setClub] = useState('')
  const [hideTaken, setHideTaken] = useState(false)
  const [sort, setSort] = useState<SortKey>('prezzoCorrente')
  const [assigning, setAssigning] = useState<ValutazioneGiocatore | null>(null)

  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase()
    let list = valutazione.giocatori.filter((g) => {
      if (role && g.player.role !== role) return false
      if (club && g.player.club !== club) return false
      if (hideTaken && g.purchase) return false
      if (needle && !g.player.name.toLowerCase().includes(needle)) return false
      return true
    })
    list = [...list].sort((a, b) => {
      switch (sort) {
        case 'name':
          return a.player.name.localeCompare(b.player.name)
        case 'fvm':
          return b.player.fvm - a.player.fvm
        case 'rischio':
          return b.rischio - a.rischio
        case 'fantamedia':
          return b.fantamedia - a.fantamedia
        case 'presenze':
          return b.presenze - a.presenze
        case 'vor':
          return b.vorAggiustato - a.vorAggiustato
        case 'prezzoMercato':
          return b.prezzoMercato - a.prezzoMercato
        case 'affare':
          return b.affare - a.affare
        default:
          return b.prezzoCorrente - a.prezzoCorrente
      }
    })
    return list
  }, [valutazione, q, role, club, hideTaken, sort])

  const th = (key: SortKey, label: string, cls = '') => (
    <th className={cls} onClick={() => setSort(key)} title="Ordina">
      {label}
      {sort === key ? ' ▾' : ''}
    </th>
  )

  return (
    <>
      <div className="panel">
        <h2>Listone e prezzi consigliati</h2>
        <p className="hint">
          <b>Mercato</b> è quanto costerà davvero (l'FVM del listone riscalato sul vostro budget),
          <b> Vale</b> è quanto rende secondo il modello. <b>Affare</b> è la differenza: verde =
          il mercato lo sottovaluta, rosso = lo paga più di quanto rende. Tutto si aggiorna man
          mano che l'asta procede.
        </p>
        <div className="grid cols-4">
          <Field label="Cerca">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Nome giocatore…"
            />
          </Field>
          <Field label="Ruolo">
            <select value={role} onChange={(e) => setRole(e.target.value as Role | '')}>
              <option value="">Tutti</option>
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {ROLE_LABEL[r]}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Squadra di Serie A">
            <select value={club} onChange={(e) => setClub(e.target.value)}>
              <option value="">Tutte</option>
              {clubs.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </Field>
          <Field label=" ">
            <button
              className={hideTaken ? 'primary' : ''}
              style={{ width: '100%' }}
              onClick={() => setHideTaken((v) => !v)}
            >
              {hideTaken ? 'Solo disponibili' : 'Mostra tutti'}
            </button>
          </Field>
        </div>
        <div className="row tiny muted" style={{ marginTop: 10 }}>
          <span>{rows.length} giocatori</span>
          <span>
            Inflazione asta: <b className="mono">{fmt(valutazione.inflazione, 2)}×</b>
          </span>
          <span>{valutazione.creditiResidui} crediti ancora in lega</span>
        </div>
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th className="no-sort"></th>
              {th('name', 'Giocatore')}
              <th className="no-sort">Squadra</th>
              {th('fvm', 'FVM', 'num')}
              {th('presenze', 'Pres.', 'num')}
              {th('fantamedia', 'Fantamedia', 'num')}
              {th('vor', 'Valore', 'num')}
              {th('rischio', 'Rischio', 'num')}
              {th('prezzoMercato', 'Mercato', 'num')}
              {th('prezzoCorrente', 'Vale', 'num')}
              {th('affare', 'Affare', 'num')}
              <th className="no-sort">Preso da</th>
              <th className="no-sort"></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((g) => {
              const owner = g.purchase && state.teams.find((t) => t.id === g.purchase!.teamId)
              return (
                <tr
                  key={g.player.id}
                  className={g.purchase ? 'taken clickable' : 'clickable'}
                  onClick={() => onOpenPlayer(g.player)}
                >
                  <td>
                    <RoleBadge role={g.player.role} />
                  </td>
                  <td>{g.player.name}</td>
                  <td className="muted">{g.player.club}</td>
                  <td className="num muted">{g.player.fvm}</td>
                  <td className="num">{fmt(g.presenze, 0)}</td>
                  <td className="num">{fmt(g.fantamedia, 2)}</td>
                  <td className="num">{fmt(g.vorAggiustato, 0)}</td>
                  <td className="num muted">±{fmt(g.rischio, 0)}</td>
                  <td className="num muted">{g.prezzoMercato}</td>
                  <td className="num">
                    <b>{g.prezzoCorrente}</b>
                  </td>
                  <td className="num">
                    <span className={g.affare > 0 ? 'pill good' : g.affare < 0 ? 'pill bad' : 'pill'}>
                      {g.affare > 0 ? '+' : ''}
                      {g.affare}
                    </span>
                  </td>
                  <td className="muted small">
                    {owner ? `${owner.name} · ${g.purchase!.price}` : '—'}
                  </td>
                  <td>
                    <button
                      className="ghost tiny"
                      onClick={(e) => {
                        e.stopPropagation()
                        if (g.purchase) actions.removePurchase(g.player.id)
                        else setAssigning(g)
                      }}
                      disabled={!state.teams.length}
                      title={state.teams.length ? '' : 'Aggiungi prima una squadra'}
                    >
                      {g.purchase ? 'Libera' : 'Assegna'}
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {!rows.length && <div className="empty">Nessun giocatore con questi filtri.</div>}
      </div>

      {assigning && (
        <AssignModal
          giocatore={assigning}
          state={state}
          actions={actions}
          onClose={() => setAssigning(null)}
        />
      )}
    </>
  )
}

/** Dialogo di assegnazione: a chi è andato e a quanti crediti. */
export function AssignModal({
  giocatore,
  state,
  actions,
  onClose,
  defaultTeamId,
}: {
  giocatore: ValutazioneGiocatore
  state: AppState
  actions: Actions
  onClose: () => void
  defaultTeamId?: string
}) {
  const [teamId, setTeamId] = useState(
    defaultTeamId ?? state.teams.find((t) => t.isMine)?.id ?? state.teams[0]?.id ?? '',
  )
  const [price, setPrice] = useState(String(giocatore.prezzoCorrente))

  const submit = () => {
    const n = Number(price)
    if (!teamId || !Number.isFinite(n) || n < 1) return
    actions.addPurchase(giocatore.player.id, teamId, n)
    onClose()
  }

  return (
    <Modal title={`Assegna ${giocatore.player.name}`} onClose={onClose}>
      <div className="row" style={{ marginTop: -6, marginBottom: 14 }}>
        <RoleBadge role={giocatore.player.role} />
        <span className="muted small">{giocatore.player.club}</span>
        <span className="pill good">consigliato {giocatore.prezzoCorrente}</span>
      </div>
      <div className="grid cols-2">
        <Field label="Squadra">
          <select value={teamId} onChange={(e) => setTeamId(e.target.value)}>
            {state.teams.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </Field>
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
      </div>
      <div className="modal-actions">
        <button onClick={onClose}>Annulla</button>
        <button className="primary" onClick={submit}>
          Salva acquisto
        </button>
      </div>
    </Modal>
  )
}
