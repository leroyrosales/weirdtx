import { pickRandomListingPath } from '../lib/randomListing'
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { RandomPickContext, type RandomPickContextValue } from './randomPickContextBase'

type OverlayPhase = 'closed' | 'open' | 'leaving'

function splashDelayMs(): number {
  if (typeof window === 'undefined') return 0
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 90 : 640
}

export function RandomPickProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const [overlayPhase, setOverlayPhase] = useState<OverlayPhase>('closed')
  const originPathRef = useRef<string | null>(null)
  const pickingRef = useRef(false)
  const navigateTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const clearNavigateTimer = () => {
    if (navigateTimerRef.current != null) {
      clearTimeout(navigateTimerRef.current)
      navigateTimerRef.current = null
    }
  }

  const startRandomPick = useCallback(() => {
    if (pickingRef.current) return
    pickingRef.current = true
    originPathRef.current = pathname
    setOverlayPhase('open')
    clearNavigateTimer()
    navigateTimerRef.current = window.setTimeout(() => {
      navigateTimerRef.current = null
      navigate(pickRandomListingPath())
    }, splashDelayMs())
  }, [navigate, pathname])

  useEffect(() => {
    if (overlayPhase !== 'open') return
    const origin = originPathRef.current
    if (origin == null) return
    if (pathname === origin) return
    clearNavigateTimer()
    pickingRef.current = false
    const raf = requestAnimationFrame(() => setOverlayPhase('leaving'))
    return () => cancelAnimationFrame(raf)
  }, [pathname, overlayPhase])

  useEffect(() => {
    if (overlayPhase !== 'leaving') return
    const t = window.setTimeout(() => {
      requestAnimationFrame(() => {
        setOverlayPhase('closed')
        originPathRef.current = null
      })
    }, 400)
    return () => clearTimeout(t)
  }, [overlayPhase])

  useEffect(() => () => clearNavigateTimer(), [])

  useEffect(() => {
    if (overlayPhase === 'closed') return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [overlayPhase])

  const value: RandomPickContextValue = {
    startRandomPick,
    randomJourneyActive: overlayPhase !== 'closed',
  }

  return (
    <RandomPickContext.Provider value={value}>
      {children}
      {overlayPhase !== 'closed' ? (
        <div
          className="random-pick-splash fixed inset-0 z-[200] flex flex-col items-center justify-center gap-4 bg-gradient-to-b from-cream/92 via-gold-bright/30 to-sage/25 px-6 text-center backdrop-blur-2xl backdrop-saturate-150"
          role="status"
          aria-live="polite"
          aria-busy={overlayPhase === 'open'}
          data-phase={overlayPhase}
        >
          <p
            className="random-pick-splash-star font-display text-4xl text-gold-bright drop-shadow-sm sm:text-5xl"
            aria-hidden
          >
            ★
          </p>
          <p className="random-pick-splash-headline font-display text-3xl tracking-wide text-sky-deep sm:text-4xl">
            Vamonos, pardner!
          </p>
          <p className="max-w-xs text-base font-semibold text-ink sm:max-w-sm sm:text-lg [text-shadow:0_1px_2px_rgb(255_248_240_/_0.9)]">
            Picking a weird Texas spot for you…
          </p>
        </div>
      ) : null}
    </RandomPickContext.Provider>
  )
}
