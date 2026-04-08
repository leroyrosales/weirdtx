import { useEffect, useRef } from 'react'
import { Link, Outlet, useLocation } from 'react-router-dom'

function ScrollToTopOnNavigate() {
  const { pathname } = useLocation()

  useEffect(() => {
    // Match typical website behavior: new route starts at top.
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
  }, [pathname])

  return null
}

function RouteAnnouncer() {
  const { pathname } = useLocation()
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const id = window.setTimeout(() => {
      el.textContent = `Navigated to ${document.title}`
    }, 0)
    return () => clearTimeout(id)
  }, [pathname])

  return (
    <div ref={ref} role="status" aria-live="polite" aria-atomic="true" className="sr-only" />
  )
}

const nav = [
  { to: '/', label: 'Home' },
  { to: '/explore', label: 'Near me' },
  { to: '/places', label: 'Places' },
  { to: '/events', label: 'Events' },
]

export function Layout() {
  const { pathname } = useLocation()

  return (
    <div className="relative flex min-h-screen flex-col">
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      <header
        className="sticky top-0 z-50 border-b border-ink/10 bg-cream/85 shadow-sm backdrop-blur-md"
        aria-label="Site header"
      >
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4 border-b-2 border-gold-bright/50 px-4 py-3">
          <Link
            to="/"
            className="inline-flex min-h-11 min-w-11 items-center font-display text-xl tracking-wide text-sky-deep transition-colors hover:text-clay sm:min-h-0 sm:min-w-0 sm:text-3xl"
            aria-label="Weird TX home"
          >
            Weird TX
            <span className="ml-1 text-gold-bright drop-shadow-sm" aria-hidden>
              ★
            </span>
          </Link>
          <nav className="flex flex-wrap gap-1 sm:gap-2" aria-label="Main navigation">
            {nav.map(({ to, label }) => {
              const active = to === '/' ? pathname === '/' : pathname.startsWith(to)
              return (
                <Link
                  key={to}
                  to={to}
                  aria-current={active ? 'page' : undefined}
                  className={`inline-flex min-h-11 items-center justify-center rounded-full px-4 py-2 text-sm font-semibold transition-colors sm:min-h-0 sm:px-3 sm:py-1.5 ${
                    active
                      ? 'bg-sage text-white shadow-sm ring-2 ring-gold-bright/70'
                      : 'text-ink/85 hover:bg-sky-deep/10'
                  }`}
                >
                  {label}
                </Link>
              )
            })}
          </nav>
        </div>
      </header>

      <main id="main-content" className="mx-auto w-full max-w-5xl flex-1 px-4 py-8" tabIndex={-1}>
        <Outlet />
      </main>

      <footer className="mt-auto border-t-2 border-gold-bright/45 bg-ink/[0.03]" aria-label="Site information">
        <div className="mx-auto max-w-5xl px-4 py-6 text-center text-sm leading-relaxed text-ink/70">
          <p className="mb-2">
            Got a weird Texas tip? Send me a location or event and I’ll add it to the map.{' '}
            <a
              href="mailto:leroyrosales@gmail.com"
              className="font-semibold text-clay underline decoration-2 underline-offset-2 hover:text-clay-dark"
            >
              leroyrosales@gmail.com
            </a>
          </p>
          <p>
            Built by{' '}
            <a
              href="https://leroyrosales.com"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-clay underline decoration-2 underline-offset-2 hover:text-clay-dark"
            >
              Leroy Rosales
            </a>
            .
          </p>
        </div>
      </footer>
      <ScrollToTopOnNavigate />
      <RouteAnnouncer />
    </div>
  )
}
