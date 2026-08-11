import { useEffect, type ReactNode } from 'react'
import type { Role } from '../model/types'

export function RoleBadge({ role }: { role: Role }) {
  return <span className={`role ${role}`}>{role}</span>
}

export function Modal({
  title,
  onClose,
  children,
  wide,
}: {
  title: string
  onClose: () => void
  children: ReactNode
  wide?: boolean
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={wide ? 'modal wide' : 'modal'}>
        <h2>{title}</h2>
        {children}
      </div>
    </div>
  )
}

export function Kpi({ k, v, small }: { k: string; v: ReactNode; small?: boolean }) {
  return (
    <div className="kpi">
      <div className="k">{k}</div>
      <div className={small ? 'v small' : 'v'}>{v}</div>
    </div>
  )
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <label className="field">{label}</label>
      {children}
    </div>
  )
}

export function fmt(n: number, d = 1): string {
  return n.toLocaleString('it-IT', { minimumFractionDigits: d, maximumFractionDigits: d })
}

/**
 * Istogramma di una distribuzione discreta. `labels[i]` è il valore,
 * `probs[i]` la sua probabilità. La barra più alta (la moda) è evidenziata.
 */
export function Histogram({
  labels,
  probs,
  highlight,
}: {
  labels: (number | string)[]
  probs: number[]
  highlight?: number
}) {
  const max = Math.max(...probs, 1e-9)
  const peak = highlight ?? probs.indexOf(max)
  return (
    <div className="chart">
      {probs.map((p, i) => (
        <div
          className={i === peak ? 'col peak' : 'col'}
          key={i}
          title={`${labels[i]}: ${(p * 100).toFixed(1)}%`}
        >
          <i style={{ height: `${Math.max(1, (p / max) * 100)}%` }} />
          <span>{labels[i]}</span>
        </div>
      ))}
    </div>
  )
}
