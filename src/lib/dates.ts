/** Il giornale esce il giorno dopo la giornata di Serie A. */
export function editionDate(iso: string): Date {
  const d = new Date(iso + 'T12:00:00')
  d.setDate(d.getDate() + 1)
  return d
}

export function longDate(d: Date): string {
  const s = d.toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  return s.charAt(0).toUpperCase() + s.slice(1)
}

export function shortDate(iso?: string): string {
  if (!iso) return ''
  return new Date(iso + 'T12:00:00').toLocaleDateString('it-IT', { day: 'numeric', month: 'short' })
}
