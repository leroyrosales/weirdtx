import { useEffect, useRef, useState } from 'react'
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
  { to: '/random', label: 'Random', ariaLabel: 'Random place or event' },
] as const

export function Layout() {
  const { pathname } = useLocation()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    setMobileMenuOpen(false)
  }, [pathname])

  useEffect(() => {
    if (!mobileMenuOpen) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileMenuOpen(false)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [mobileMenuOpen])

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
            className="inline-flex min-h-11 min-w-11 items-center font-display text-4xl tracking-wide text-sky-deep transition-colors hover:text-clay sm:min-h-0 sm:min-w-0 sm:text-3xl"
            aria-label="Weird TX home"
          >
            Weird TX
            <span className="ml-2 sm:ml-1 text-gold-bright drop-shadow-sm" aria-hidden>
              ★
            </span>
          </Link>
          <nav
            className="hidden flex-wrap gap-1 sm:flex sm:gap-2"
            aria-label="Main navigation"
          >
            {nav.map(({ to, label, ...rest }) => {
              const active = to === '/' ? pathname === '/' : pathname.startsWith(to)
              const ariaLabel = 'ariaLabel' in rest ? rest.ariaLabel : undefined
              return (
                <Link
                  key={to}
                  to={to}
                  aria-label={ariaLabel}
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

      <main
        id="main-content"
        className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 pb-28 sm:pb-8"
        tabIndex={-1}
      >
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
      {/* Mobile: thumb-friendly menu — fixed bottom-right; control label is "Menu" (no hamburger). */}
      {mobileMenuOpen ? (
        <button
          type="button"
          className="mobile-nav-backdrop-enter fixed inset-0 z-[55] bg-ink/40 backdrop-blur-sm sm:hidden"
          aria-label="Close menu"
          onClick={() => setMobileMenuOpen(false)}
        />
      ) : null}
      <div className="fixed bottom-[max(1rem,env(safe-area-inset-bottom,0px))] right-[max(1rem,env(safe-area-inset-right,0px))] z-[56] flex flex-col items-end gap-3 sm:hidden">
        {mobileMenuOpen ? (
          <nav
            id="mobile-nav-panel"
            className="mobile-nav-panel-enter min-w-[13.875rem] max-w-[min(21.5rem,calc(100vw-2rem))] rounded-3xl border-2 border-sky-deep/20 bg-cream/95 p-3 shadow-xl ring-2 ring-gold-bright/50 backdrop-blur-md"
            aria-label="Main navigation"
          >
            <ul className="flex flex-col gap-1.5">
              {nav.map(({ to, label, ...rest }) => {
                const active = to === '/' ? pathname === '/' : pathname.startsWith(to)
                const ariaLabel = 'ariaLabel' in rest ? rest.ariaLabel : undefined
                return (
                  <li key={to}>
                    <Link
                      to={to}
                      aria-label={ariaLabel}
                      aria-current={active ? 'page' : undefined}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`block rounded-2xl px-5 py-[0.95rem] text-lg font-bold transition-colors duration-200 ease-out ${
                        active
                          ? 'bg-sage text-white ring-2 ring-gold-bright/70'
                          : 'text-ink/90 hover:bg-sky-deep/10 active:bg-sky-deep/15'
                      }`}
                    >
                      {label}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </nav>
        ) : null}
        <button
          type="button"
          className="rounded-full border-2 border-sky-deep/35 bg-clay px-6 py-4 text-lg font-bold tracking-wide text-white shadow-lg ring-2 ring-gold-bright/60 transition-[transform,box-shadow] duration-200 ease-out hover:bg-clay-dark hover:shadow-xl active:scale-[0.97]"
          aria-expanded={mobileMenuOpen}
          aria-haspopup="true"
          aria-controls={mobileMenuOpen ? 'mobile-nav-panel' : undefined}
          onClick={() => setMobileMenuOpen((o) => !o)}
        >
          {mobileMenuOpen ? 'Close' : 'Menu'}
        </button>
      </div>

      <ScrollToTopOnNavigate />
      <RouteAnnouncer />
    </div>
  )
}
