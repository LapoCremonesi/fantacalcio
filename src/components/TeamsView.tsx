import { useState } from 'react'
import type { Player } from '../model/types'
import { ROLES, ROLE_LABEL, type FantaTeam } from '../model/types'
import { conteggioRuoli, creditiResidui, offertaMassima, type ValutazioneLega } from '../model/valuation'
import type { Actions, AppState } from '../store'
import { Field, Modal, RoleBadge } from './common'

export function TeamsView({
  state,
  actions,
  playersById,
  valutazione,
  onOpenTeam,
}: {
  state: AppState
  actions: Actions
  playersById: Map<string, Player>
  valutazione: ValutazioneLega
  onOpenTeam: (id: string) => void
}) {
  const [adding, setAdding] = useState(false)
  const [name, setName] = useState('')

  const submit = () => {
    actions.addTeam(name)
    setName('')
    setAdding(false)
  }

  return (
    <>
      <div className="panel">
        <h2>Le squadre del fanta</h2>
        <p className="hint">
          Aggiungi tutte le squadre della lega con il pulsante <b>+</b>. La squadra segnata come{' '}
          <i>la mia</i> è quella per cui l'app calcola i consigli d'asta.
        </p>
        <div className="row">
          <span className="pill">{state.teams.length} squadre</span>
          <span className="pill">{state.settings.budget} crediti a testa</span>
          <span className="pill">
            {ROLES.map((r) => `${state.settings.slots[r]}${r}`).join(' · ')}
          </span>
          <span className="pill">{valutazione.slotResidui} slot ancora da riempire</span>
        </div>
      </div>

      <div className="grid teams">
        {state.teams.map((t) => (
          <TeamCard
            key={t.id}
            team={t}
            state={state}
            actions={actions}
            playersById={playersById}
            onOpen={() => onOpenTeam(t.id)}
          />
        ))}
        <button className="add-card" onClick={() => setAdding(true)}>
          <span className="plus">+</span>
          <span>Aggiungi squadra</span>
        </button>
      </div>

      {adding && (
        <Modal title="Nuova squadra" onClose={() => setAdding(false)}>
          <Field label="Nome della squadra">
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && submit()}
              placeholder={`Squadra ${state.teams.length + 1}`}
            />
          </Field>
          <div className="modal-actions">
            <button onClick={() => setAdding(false)}>Annulla</button>
            <button className="primary" onClick={submit}>
              Aggiungi
            </button>
          </div>
        </Modal>
      )}
    </>
  )
}

function TeamCard({
  team,
  state,
  actions,
  playersById,
  onOpen,
}: {
  team: FantaTeam
  state: AppState
  actions: Actions
  playersById: Map<string, Player>
  onOpen: () => void
}) {
  const residui = creditiResidui(team.id, state.purchases, state.settings)
  const presi = conteggioRuoli(team.id, state.purchases, playersById)
  const max = offertaMassima(team.id, state.purchases, state.settings, playersById)
  const quota = Math.max(0, Math.min(1, residui / state.settings.budget))

  return (
    <div className={team.isMine ? 'team-card mine' : 'team-card'}>
      <h3>
        {team.name}
        {team.isMine && <span className="tag">la mia</span>}
      </h3>

      <div>
        <div className="credits">
          <b className={residui < 0 ? 'danger' : ''}>{residui}</b>
          <span className="muted small">/ {state.settings.budget} crediti</span>
        </div>
        <div className="bar">
          <i style={{ width: `${quota * 100}%` }} />
        </div>
      </div>

      <div className="slots">
        {ROLES.map((r) => {
          const n = presi[r]
          const tot = state.settings.slots[r]
          return (
            <span className={n >= tot ? 'slot full' : 'slot'} key={r} title={ROLE_LABEL[r]}>
              <RoleBadge role={r} />
              {n}/{tot}
            </span>
          )
        })}
      </div>

      <div className="small muted">
        Offerta massima possibile: <b className="mono">{max}</b>
      </div>

      <div className="row">
        <button className="primary" onClick={onOpen}>
          Rosa e acquisti
        </button>
        {!team.isMine && (
          <button className="ghost small" onClick={() => actions.setMine(team.id)}>
            È la mia
          </button>
        )}
        <button
          className="ghost danger"
          style={{ marginLeft: 'auto' }}
          onClick={() => {
            if (confirm(`Eliminare "${team.name}" e i suoi acquisti?`)) actions.removeTeam(team.id)
          }}
        >
          ✕
        </button>
      </div>
    </div>
  )
}
