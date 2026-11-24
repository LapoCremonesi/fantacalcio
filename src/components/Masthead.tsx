import type { League, Matchday } from '../types'
import { editionDate, longDate } from '../lib/dates'
import { href, type Route, type Section } from '../lib/route'

const NAV: { section: Section; label: string }[] = [
  { section: 'prima', label: 'Prima pagina' },
  { section: 'classifica', label: 'Classifica' },
  { section: 'risultati', label: 'Risultati' },
  { section: 'squadre', label: 'Squadre' },
  { section: 'archivio', label: 'Archivio' },
]

const PRICES = [
  '€ 0,00 · gratis come uno svincolato',
  '€ 0,00 · offre il presidente',
  'Prezzo: un caffè al bar',
  '€ 0,00 · pagabile in crediti d’asta',
]

const WEATHER = [
  'Meteo: nuvoloso sulla panchina, sereno in zona gol',
  'Meteo: rovesci di bonus, schiarite sui malus',
  'Meteo: nebbia fitta sulle formazioni di sabato',
  'Meteo: vento forte, le scuse volano',
]

interface Props {
  league: League
  day: Matchday
  route: Route
  days: Matchday[]
  theme: 'light' | 'dark'
  onTheme: () => void
}

export function Masthead({ league, day, route, days, theme, onTheme }: Props) {
  const idx = days.findIndex((d) => d.number === day.number)
  const prev = days[idx - 1]
  const next = days[idx + 1]
  const section = route.section === 'articolo' ? 'prima' : route.section
  const to = (n: number) => href({ section: section === 'archivio' ? 'prima' : section, day: n })

  return (
    <header className="masthead">
      <div className="mast-strip">
        <span>
          Anno I · N. {day.number} · Stagione {league.season}
        </span>
        <span className="mast-date">{day.date ? longDate(editionDate(day.date)) : `${day.number}ª giornata`}</span>
        <span className="mast-right">
          {PRICES[day.number % PRICES.length]}
          <button className="theme-btn" onClick={onTheme} title="Cambia edizione">
            {theme === 'dark' ? '☀ Edizione del mattino' : '☾ Edizione della sera'}
          </button>
        </span>
      </div>

      <a className="mast-title" href={href({ section: 'prima', day: day.number })}>
        <span className="mast-ear mast-ear-left">
          <strong>{day.number}ª</strong>
          <small>giornata</small>
        </span>
        <h1>{league.newspaper}</h1>
        <span className="mast-ear mast-ear-right">
          <small>{WEATHER[day.number % WEATHER.length]}</small>
        </span>
      </a>
      <p className="mast-tagline">
        {league.tagline}
        {league.name && ` · ${league.name}`}
      </p>

      <nav className="mast-nav" aria-label="Sezioni">
        <ul>
          {NAV.map((n) => (
            <li key={n.section}>
              <a
                href={href({ section: n.section, day: n.section === 'archivio' ? undefined : day.number })}
                aria-current={section === n.section ? 'page' : undefined}
              >
                {n.label}
              </a>
            </li>
          ))}
        </ul>
        <div className="day-picker" aria-label="Scegli giornata">
          <a className={prev ? '' : 'disabled'} href={prev ? to(prev.number) : undefined} aria-label="Giornata precedente">
            ‹
          </a>
          <select
            value={day.number}
            onChange={(e) => (window.location.hash = to(Number(e.target.value)).slice(1))}
            aria-label="Giornata"
          >
            {days.map((d) => (
              <option key={d.number} value={d.number}>
                Giornata {d.number}
              </option>
            ))}
          </select>
          <a className={next ? '' : 'disabled'} href={next ? to(next.number) : undefined} aria-label="Giornata successiva">
            ›
          </a>
        </div>
      </nav>
    </header>
  )
}

export function Ticker({ items }: { items: string[] }) {
  if (!items.length) return null
  const loop = [...items, ...items]
  return (
    <div className="ticker" role="marquee" aria-label="Ultim'ora">
      <span className="ticker-label">Ultim’ora</span>
      <div className="ticker-track">
        <div className="ticker-move" style={{ animationDuration: `${items.length * 9}s` }}>
          {loop.map((t, i) => (
            <span key={i} className="ticker-item" aria-hidden={i >= items.length}>
              {t}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
