import { useMemo, useState } from 'react'
import { AuctionView } from './components/AuctionView'
import { PlayerDetail } from './components/PlayerDetail'
import { PlayersView } from './components/PlayersView'
import { SettingsView } from './components/SettingsView'
import { TeamDetail } from './components/TeamDetail'
import { TeamsView } from './components/TeamsView'
import { CLUBS, PLAYERS } from './data/players'
import type { Player } from './model/types'
import { valuta } from './model/valuation'
import { useStore } from './store'

type Tab = 'squadre' | 'asta' | 'listone' | 'impostazioni'

const TABS: { id: Tab; label: string }[] = [
  { id: 'squadre', label: 'Squadre' },
  { id: 'asta', label: 'Asta' },
  { id: 'listone', label: 'Listone' },
  { id: 'impostazioni', label: 'Impostazioni' },
]

export default function App() {
  const { state, actions } = useStore()
  const [tab, setTab] = useState<Tab>('squadre')
  const [openTeam, setOpenTeam] = useState<string | null>(null)
  const [openPlayer, setOpenPlayer] = useState<Player | null>(null)

  const playersById = useMemo(() => new Map(PLAYERS.map((p) => [p.id, p])), [])

  const valutazione = useMemo(
    () =>
      valuta({
        players: PLAYERS,
        teams: state.teams,
        purchases: state.purchases,
        settings: state.settings,
        rules: state.rules,
        projection: state.projection,
        avversioneRischio: state.avversioneRischio,
        concentration: state.concentration,
      }),
    [state],
  )

  return (
    <div className="app">
      <header className="top">
        <h1>
          Asta <span>Fantacalcio</span>
        </h1>
        <span className="muted small">
          {PLAYERS.length} giocatori · listone 2026/27
        </span>
        <nav className="tabs">
          {TABS.map((t) => (
            <button
              key={t.id}
              className={tab === t.id ? 'on' : ''}
              onClick={() => setTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </nav>
      </header>

      {tab === 'squadre' && (
        <TeamsView
          state={state}
          actions={actions}
          playersById={playersById}
          valutazione={valutazione}
          onOpenTeam={setOpenTeam}
        />
      )}

      {tab === 'asta' && (
        <AuctionView
          state={state}
          valutazione={valutazione}
          playersById={playersById}
          onOpenPlayer={setOpenPlayer}
        />
      )}

      {tab === 'listone' && (
        <PlayersView
          state={state}
          actions={actions}
          valutazione={valutazione}
          clubs={CLUBS}
          onOpenPlayer={setOpenPlayer}
        />
      )}

      {tab === 'impostazioni' && <SettingsView state={state} actions={actions} />}

      {openTeam && (
        <TeamDetail
          teamId={openTeam}
          state={state}
          actions={actions}
          valutazione={valutazione}
          playersById={playersById}
          onClose={() => setOpenTeam(null)}
          onOpenPlayer={setOpenPlayer}
        />
      )}

      {openPlayer && (
        <PlayerDetail
          player={openPlayer}
          state={state}
          valutazione={valutazione}
          playersById={playersById}
          onClose={() => setOpenPlayer(null)}
        />
      )}
    </div>
  )
}
