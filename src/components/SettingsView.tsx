import { useRef } from 'react'
import { ROLES, ROLE_LABEL, totalSlots } from '../model/types'
import type { Actions, AppState } from '../store'
import { Field, RoleBadge } from './common'

/** Impostazioni valide per tutta la lega: si scrivono una volta sola. */
export function SettingsView({ state, actions }: { state: AppState; actions: Actions }) {
  const fileRef = useRef<HTMLInputElement>(null)
  const rosa = totalSlots(state.settings.slots)
  const titolari = totalSlots(state.settings.titolari)

  const esporta = () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = 'asta-fantacalcio.json'
    a.click()
    URL.revokeObjectURL(a.href)
  }

  const importa = (f: File) => {
    const r = new FileReader()
    r.onload = () => {
      try {
        actions.importState(String(r.result))
      } catch {
        alert('File non valido.')
      }
    }
    r.readAsText(f)
  }

  return (
    <>
      <div className="panel">
        <h2>Composizione delle rose</h2>
        <p className="hint">
          Questi numeri valgono per <b>tutte</b> le squadre: li imposti una volta sola qui.
        </p>
        <div className="grid cols-4">
          {ROLES.map((r) => (
            <Field key={r} label={ROLE_LABEL[r]}>
              <div className="row" style={{ flexWrap: 'nowrap' }}>
                <RoleBadge role={r} />
                <input
                  type="number"
                  min={0}
                  value={state.settings.slots[r]}
                  onChange={(e) => actions.setSlots(r, Number(e.target.value))}
                />
              </div>
            </Field>
          ))}
        </div>
        <div className="row" style={{ marginTop: 12 }}>
          <span className="pill">{rosa} giocatori per rosa</span>
          <span className="pill">{rosa * state.teams.length} giocatori assegnati in totale</span>
        </div>
      </div>

      <div className="panel">
        <h2>Formazione tipo</h2>
        <p className="hint">
          Quanti ne schieri per ruolo ogni giornata. Serve a capire chi è il giocatore
          «di riferimento» di ogni ruolo: il terzo portiere sta in rosa ma non gioca mai, quindi
          non è lui il metro di paragone. Deve fare 11.
        </p>
        <div className="grid cols-4">
          {ROLES.map((r) => (
            <Field key={r} label={ROLE_LABEL[r]}>
              <div className="row" style={{ flexWrap: 'nowrap' }}>
                <RoleBadge role={r} />
                <input
                  type="number"
                  min={0}
                  max={state.settings.slots[r]}
                  value={state.settings.titolari[r]}
                  onChange={(e) => actions.setTitolari(r, Number(e.target.value))}
                />
              </div>
            </Field>
          ))}
        </div>
        <div className="row" style={{ marginTop: 12 }}>
          <span className={titolari === 11 ? 'pill good' : 'pill warn'}>
            {titolari} titolari{titolari === 11 ? '' : ' (dovrebbero essere 11)'}
          </span>
          <span className="pill">
            modulo {state.settings.titolari.D}-{state.settings.titolari.C}-
            {state.settings.titolari.A}
          </span>
        </div>
      </div>

      <div className="panel">
        <h2>Crediti</h2>
        <p className="hint">Budget iniziale di ogni squadra.</p>
        <div className="grid cols-4">
          <Field label="Crediti per squadra">
            <input
              type="number"
              min={1}
              value={state.settings.budget}
              onChange={(e) => actions.setBudget(Number(e.target.value))}
            />
          </Field>
          <Field label="Crediti totali in lega">
            <input readOnly value={state.settings.budget * state.teams.length} />
          </Field>
          <Field label="Crediti medi per giocatore">
            <input
              readOnly
              value={rosa ? (state.settings.budget / rosa).toFixed(1) : '—'}
            />
          </Field>
        </div>
      </div>

      <div className="panel">
        <h2>Regolamento: bonus e malus</h2>
        <p className="hint">
          Cambiano il valore dei giocatori: con l'assist a 1 punto un rifinitore vale meno che con
          l'assist a 3.
        </p>
        <div className="grid cols-4">
          <Field label="Gol segnato">
            <input
              type="number"
              step="0.5"
              value={state.rules.gol}
              onChange={(e) => actions.setRules({ gol: Number(e.target.value) })}
            />
          </Field>
          <Field label="Assist">
            <input
              type="number"
              step="0.5"
              value={state.rules.assist}
              onChange={(e) => actions.setRules({ assist: Number(e.target.value) })}
            />
          </Field>
          <Field label="Ammonizione">
            <input
              type="number"
              step="0.5"
              value={state.rules.ammonizione}
              onChange={(e) => actions.setRules({ ammonizione: Number(e.target.value) })}
            />
          </Field>
          <Field label="Espulsione">
            <input
              type="number"
              step="0.5"
              value={state.rules.espulsione}
              onChange={(e) => actions.setRules({ espulsione: Number(e.target.value) })}
            />
          </Field>
          <Field label="Autogol">
            <input
              type="number"
              step="0.5"
              value={state.rules.autogol}
              onChange={(e) => actions.setRules({ autogol: Number(e.target.value) })}
            />
          </Field>
          <Field label="Rigore sbagliato">
            <input
              type="number"
              step="0.5"
              value={state.rules.rigoreSbagliato}
              onChange={(e) => actions.setRules({ rigoreSbagliato: Number(e.target.value) })}
            />
          </Field>
          <Field label="Gol subito (portiere)">
            <input
              type="number"
              step="0.5"
              value={state.rules.golSubito}
              onChange={(e) => actions.setRules({ golSubito: Number(e.target.value) })}
            />
          </Field>
          <Field label="Imbattibilità (portiere)">
            <div className="row" style={{ flexWrap: 'nowrap' }}>
              <input
                type="number"
                step="0.5"
                value={state.rules.imbattibilita}
                disabled={!state.rules.usaImbattibilita}
                onChange={(e) => actions.setRules({ imbattibilita: Number(e.target.value) })}
              />
              <button
                className={state.rules.usaImbattibilita ? 'primary' : ''}
                onClick={() => actions.setRules({ usaImbattibilita: !state.rules.usaImbattibilita })}
                title="Attiva o disattiva il bonus imbattibilità"
              >
                {state.rules.usaImbattibilita ? 'ON' : 'OFF'}
              </button>
            </div>
          </Field>
        </div>
      </div>

      <div className="panel">
        <h2>Come valuto i giocatori</h2>
        <p className="hint">
          Due manopole sul modello. Non cambiano i dati del listone, solo come li interpreto.
        </p>
        <div className="grid cols-2">
          <div>
            <label className="field">
              Avversione al rischio: <b>{state.avversioneRischio.toFixed(2)}</b>
            </label>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={state.avversioneRischio}
              onChange={(e) => actions.setRisk(Number(e.target.value))}
            />
            <p className="tiny muted">
              A 0 conta solo la media. Alzandola, a parità di media preferisci il giocatore con
              esito più prevedibile e paghi meno le scommesse.
            </p>
          </div>
          <div>
            <label className="field">
              Incertezza sulle presenze: <b>{state.concentration.toFixed(0)}</b>
            </label>
            <input
              type="range"
              min={2}
              max={40}
              step={1}
              value={state.concentration}
              onChange={(e) => actions.setConcentration(Number(e.target.value))}
            />
            <p className="tiny muted">
              Valori bassi = molto incerto su quante partite giocherà (infortuni, turnover), quindi
              distribuzioni più larghe. Valori alti = presenze quasi certe.
            </p>
          </div>
        </div>
      </div>

      <div className="panel">
        <h2>Dati</h2>
        <p className="hint">
          Tutto è salvato nel browser. Esporta un file se vuoi un backup o usare l'app su un altro
          dispositivo.
        </p>
        <div className="row">
          <button onClick={esporta}>Esporta asta</button>
          <button onClick={() => fileRef.current?.click()}>Importa asta</button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json"
            style={{ display: 'none' }}
            onChange={(e) => e.target.files?.[0] && importa(e.target.files[0])}
          />
          <button
            className="danger"
            style={{ marginLeft: 'auto' }}
            onClick={() => {
              if (confirm('Cancellare squadre, acquisti e impostazioni?')) actions.reset()
            }}
          >
            Azzera tutto
          </button>
        </div>
      </div>
    </>
  )
}
