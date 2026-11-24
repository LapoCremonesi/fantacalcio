import { useEffect, useState } from 'react'
import { league } from './data/league'
import { tickerFor } from './lib/autonews'
import { useRoute } from './lib/route'
import { playedDays } from './lib/standings'
import { Masthead, Ticker } from './components/Masthead'
import { FrontPage } from './components/FrontPage'
import { ArchivePage, ArticlePage, ResultsPage, StandingsPage, TeamsPage } from './components/Pages'

type Theme = 'light' | 'dark'

function initialTheme(): Theme {
  try {
    const saved = localStorage.getItem('eco-theme')
    if (saved === 'light' || saved === 'dark') return saved
  } catch {
    /* storage non disponibile */
  }
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export default function App() {
  const route = useRoute()
  const [theme, setTheme] = useState<Theme>(initialTheme)

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    try {
      localStorage.setItem('eco-theme', theme)
    } catch {
      /* pazienza */
    }
  }, [theme])

  const all = [...league.matchdays].sort((a, b) => a.number - b.number)
  const played = playedDays(league)
  const latest = played[played.length - 1] ?? all[0]
  const day = all.find((d) => d.number === route.day) ?? latest

  if (!day) return <p style={{ padding: 32 }}>Nessuna giornata nei dati.</p>

  return (
    <div className="paper">
      <Masthead
        league={league}
        day={day}
        route={route}
        days={all}
        theme={theme}
        onTheme={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      />
      <Ticker items={tickerFor(day, league)} />
      <main>
        {route.section === 'prima' && <FrontPage league={league} day={day} />}
        {route.section === 'articolo' && <ArticlePage league={league} day={day} id={route.articleId} />}
        {route.section === 'classifica' && <StandingsPage league={league} day={day} />}
        {route.section === 'risultati' && <ResultsPage league={league} day={day} />}
        {route.section === 'squadre' && <TeamsPage league={league} day={day} />}
        {route.section === 'archivio' && <ArchivePage league={league} />}
      </main>
      <footer className="colophon">
        <p>
          <strong>{league.newspaper}</strong> · Direttore responsabile: chi ha vinto l’anno scorso · Redazione: la chat
          del gruppo
        </p>
        <p>
          Registrazione presso il Tribunale del Bar Sport n. 0/{league.season} · Le opinioni espresse sono
          volutamente faziose · Nessun presidente è stato maltrattato (troppo) durante la stesura di questo numero.
        </p>
      </footer>
    </div>
  )
}
