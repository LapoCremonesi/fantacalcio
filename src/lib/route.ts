import { useEffect, useState } from 'react'

export type Section = 'prima' | 'classifica' | 'risultati' | 'squadre' | 'archivio' | 'articolo'

export interface Route {
  /** Giornata selezionata (undefined = ultima giocata) */
  day?: number
  section: Section
  articleId?: string
}

/**
 * Routing minimale sull'hash, così funziona anche su GitHub Pages:
 *   #/12            prima pagina della 12ª
 *   #/12/classifica
 *   #/12/articolo/g12-apertura
 *   #/archivio
 */
export function parse(hash: string): Route {
  const parts = hash.replace(/^#\/?/, '').split('/').filter(Boolean)
  if (parts[0] === 'archivio') return { section: 'archivio' }
  let day: number | undefined
  if (parts[0] && /^\d+$/.test(parts[0])) day = Number(parts.shift())
  const s = parts[0] as Section | undefined
  if (s === 'articolo') return { day, section: 'articolo', articleId: parts[1] }
  if (s && ['classifica', 'risultati', 'squadre'].includes(s)) return { day, section: s }
  return { day, section: 'prima' }
}

export function href(r: Route): string {
  if (r.section === 'archivio') return '#/archivio'
  const d = r.day != null ? `/${r.day}` : ''
  if (r.section === 'prima') return `#${d || '/'}`
  if (r.section === 'articolo') return `#${d}/articolo/${r.articleId}`
  return `#${d}/${r.section}`
}

export function useRoute(): Route {
  const [route, setRoute] = useState(() => parse(window.location.hash))
  useEffect(() => {
    const on = () => {
      setRoute(parse(window.location.hash))
      window.scrollTo({ top: 0 })
    }
    window.addEventListener('hashchange', on)
    return () => window.removeEventListener('hashchange', on)
  }, [])
  return route
}
