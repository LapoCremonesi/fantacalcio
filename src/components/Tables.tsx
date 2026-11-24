import type { Team } from '../types'
import type { Outcome, Row, ScoredMatch } from '../lib/standings'
import { fmt } from '../lib/autonews'
import { Badge } from './Badge'

export function Form({ form }: { form: Outcome[] }) {
  return (
    <span className="form">
      {form.map((o, i) => (
        <span key={i} className={`form-pill form-${o}`} title={{ V: 'Vittoria', N: 'Pareggio', P: 'Sconfitta' }[o]}>
          {o}
        </span>
      ))}
    </span>
  )
}

export function Delta({ d }: { d: number }) {
  if (d > 0) return <span className="delta up" title={`+${d} posizioni`}>▲{d > 1 ? d : ''}</span>
  if (d < 0) return <span className="delta down" title={`${d} posizioni`}>▼{d < -1 ? -d : ''}</span>
  return <span className="delta same" title="Stabile">–</span>
}

/** Zone della classifica: solo estetica, basata sulla posizione. */
export function zone(pos: number, total: number): string {
  if (pos === 1) return 'zone-top'
  if (pos <= Math.min(3, total - 1)) return 'zone-euro'
  if (pos === total) return 'zone-last'
  return ''
}

export function StandingsTable({ rows, compact = false }: { rows: Row[]; compact?: boolean }) {
  return (
    <table className={`standings ${compact ? 'compact' : ''}`}>
      <thead>
        <tr>
          <th className="num">#</th>
          <th className="team-col">Squadra</th>
          <th className="num" title="Punti">Pt</th>
          <th className="num" title="Giocate">G</th>
          {!compact && (
            <>
              <th className="num" title="Vinte">V</th>
              <th className="num" title="Pareggiate">N</th>
              <th className="num" title="Perse">P</th>
              <th className="num hide-sm" title="Gol fatti">GF</th>
              <th className="num hide-sm" title="Gol subiti">GS</th>
              <th className="num hide-sm" title="Differenza reti">DR</th>
            </>
          )}
          <th className="num" title="Fantapunti totali">FP</th>
          {!compact && <th className="hide-sm">Forma</th>}
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <tr key={r.team.id} className={zone(r.pos, rows.length)}>
            <td className="num pos">
              {r.pos}
              <Delta d={r.delta} />
            </td>
            <td className="team-col">
              <span className="team-cell">
                <Badge team={r.team} size={compact ? 16 : 20} />
                <span>
                  {r.team.name}
                  {!compact && <small className="manager">{r.team.manager}</small>}
                </span>
              </span>
            </td>
            <td className="num pts">{r.points}</td>
            <td className="num">{r.played}</td>
            {!compact && (
              <>
                <td className="num">{r.won}</td>
                <td className="num">{r.drawn}</td>
                <td className="num">{r.lost}</td>
                <td className="num hide-sm">{r.gf}</td>
                <td className="num hide-sm">{r.ga}</td>
                <td className="num hide-sm">{r.gf - r.ga > 0 ? `+${r.gf - r.ga}` : r.gf - r.ga}</td>
              </>
            )}
            <td className="num fp">{fmt(r.fantapoints)}</td>
            {!compact && (
              <td className="hide-sm">
                <Form form={r.form} />
              </td>
            )}
          </tr>
        ))}
      </tbody>
    </table>
  )
}

export function Scoreline({ m, teams }: { m: ScoredMatch; teams: Map<string, Team> }) {
  const h = teams.get(m.home)!
  const a = teams.get(m.away)!
  const hw = m.homeGoals > m.awayGoals
  const aw = m.awayGoals > m.homeGoals
  return (
    <div className="scoreline">
      <span className={`sl-team home ${hw ? 'win' : ''}`}>
        <span className="sl-name">{h.name}</span>
        <Badge team={h} size={20} />
      </span>
      <span className="sl-score">
        <b>{m.homeGoals}</b>
        <i>–</i>
        <b>{m.awayGoals}</b>
      </span>
      <span className={`sl-team away ${aw ? 'win' : ''}`}>
        <Badge team={a} size={20} />
        <span className="sl-name">{a.name}</span>
      </span>
      <span className="sl-fp">
        {fmt(m.homePoints)} <span>·</span> {fmt(m.awayPoints)}
      </span>
    </div>
  )
}

export function Fixture({ home, away, teams }: { home: string; away: string; teams: Map<string, Team> }) {
  const h = teams.get(home)
  const a = teams.get(away)
  if (!h || !a) return null
  return (
    <div className="scoreline fixture">
      <span className="sl-team home">
        <span className="sl-name">{h.name}</span>
        <Badge team={h} size={20} />
      </span>
      <span className="sl-score vs">vs</span>
      <span className="sl-team away">
        <Badge team={a} size={20} />
        <span className="sl-name">{a.name}</span>
      </span>
    </div>
  )
}
