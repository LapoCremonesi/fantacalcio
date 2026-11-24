import type { Team } from '../types'

function luminance(hex: string): number {
  const h = hex.replace('#', '')
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255)
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

/** Stemma a scudo, diviso nei due colori sociali. */
export function Badge({ team, size = 28 }: { team: Team; size?: number }) {
  const [c1, c2] = team.colors
  const id = `b-${team.id}`
  const ink = luminance(c1) > 0.6 ? '#111' : '#fff'
  const showText = size >= 34
  return (
    <svg className="badge" width={size} height={size * 1.15} viewBox="0 0 40 46" aria-hidden="true">
      <defs>
        <clipPath id={id}>
          <path d="M20 1 L38 6 V22 C38 34 30 41 20 45 C10 41 2 34 2 22 V6 Z" />
        </clipPath>
      </defs>
      <g clipPath={`url(#${id})`}>
        <rect width="40" height="46" fill={c1} />
        <rect x="0" y="0" width="40" height="12" fill={c2} />
        <rect x="17" y="12" width="6" height="34" fill={c2} opacity="0.9" />
      </g>
      <path
        d="M20 1 L38 6 V22 C38 34 30 41 20 45 C10 41 2 34 2 22 V6 Z"
        fill="none"
        stroke="var(--ink)"
        strokeWidth="2"
      />
      {showText && (
        <text
          x="20"
          y="30"
          textAnchor="middle"
          fontFamily="Oswald, sans-serif"
          fontWeight="700"
          fontSize="11"
          fill={ink}
          stroke={c1}
          strokeWidth="2.5"
          paintOrder="stroke"
        >
          {team.short}
        </text>
      )}
    </svg>
  )
}

export function TeamTag({ team, size = 18 }: { team: Team; size?: number }) {
  return (
    <span className="team-tag">
      <Badge team={team} size={size} />
      <span>{team.name}</span>
    </span>
  )
}
