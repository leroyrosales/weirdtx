export function formatEventRange(starts: string, ends?: string): string {
  const s = new Date(starts)
  if (Number.isNaN(s.getTime())) return starts
  const opts: Intl.DateTimeFormatOptions = {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }
  if (!ends || ends === starts) {
    return s.toLocaleDateString('en-US', opts)
  }
  const e = new Date(ends)
  if (Number.isNaN(e.getTime())) return s.toLocaleDateString('en-US', opts)
  if (s.getFullYear() === e.getFullYear() && s.getMonth() === e.getMonth()) {
    return `${s.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${e.toLocaleDateString('en-US', { day: 'numeric', year: 'numeric' })}`
  }
  return `${s.toLocaleDateString('en-US', opts)} – ${e.toLocaleDateString('en-US', opts)}`
}
