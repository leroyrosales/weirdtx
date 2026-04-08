/* Sign-in paused: /saved route commented out in App.tsx. */

import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import {
  ListingCardImageLink,
  listingCardBodyClasses,
  listingCardPlaceRowClass,
} from '../components/listingCard'
import { useIdentity } from '../hooks/useIdentity'
import { getPlaceBySlug } from '../lib/content'
import { encodeParam, regionToSlug } from '../lib/routeParams'
import { fetchSavedSlugs, postSavedSlug, SavedPlacesApiError } from '../lib/savedPlacesApi'
import { usePageSeo } from '../lib/seo'

export function SavedPlacesPage() {
  const { user, ready, loginWithGoogle, loginWithPassword, signupWithPassword, logoutUser } =
    useIdentity()
  const [slugs, setSlugs] = useState<string[]>([])
  const [loadError, setLoadError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  usePageSeo({
    title: 'Saved places',
    description:
      'Your Weird TX saved places list. Sign in with Google (Netlify Identity) to sync bookmarks across devices.',
    noIndex: true,
  })

  const reload = useCallback(async () => {
    if (!user) {
      setSlugs([])
      setLoadError(null)
      return
    }
    setLoadError(null)
    try {
      const next = await fetchSavedSlugs()
      setSlugs(next)
    } catch (e) {
      if (e instanceof SavedPlacesApiError && e.status === 401) {
        setLoadError('Session expired. Sign in again.')
      } else {
        setLoadError(
          e instanceof Error
            ? e.message
            : 'Could not load saved places. Run npm run dev:netlify (or deploy) so functions run.',
        )
      }
      setSlugs([])
    }
  }, [user])

  useEffect(() => {
    if (!ready || !user) return
    void reload()
  }, [ready, user, reload])

  const onSubmitAuth = async (e: FormEvent) => {
    e.preventDefault()
    setFormError(null)
    setBusy(true)
    try {
      if (mode === 'login') await loginWithPassword(email, password)
      else await signupWithPassword(email, password)
      setPassword('')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Something went wrong'
      setFormError(msg)
    } finally {
      setBusy(false)
    }
  }

  const removeSlug = async (slug: string) => {
    setBusy(true)
    setLoadError(null)
    try {
      const next = await postSavedSlug('remove', slug)
      setSlugs(next)
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : 'Could not update list')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-display text-3xl tracking-wide text-sky-deep">Saved places</h1>
        <p className="mt-2 max-w-2xl text-ink/80">
          Bookmark weird Texas spots to plan trips. Lists are stored in your Netlify account (Blobs), not on this
          device alone.
        </p>
      </header>

      {!ready ? (
        <p className="text-ink/70">Loading…</p>
      ) : !user ? (
        <section className="max-w-md rounded-2xl border border-ink/10 bg-white/50 p-6 shadow-sm">
          <h2 className="font-display text-xl text-sky-deep">Sign in</h2>
          <p className="mt-2 text-sm text-ink/70">
            Prefer Google. Turn on Identity and the Google provider in your Netlify site settings, then add the
            redirect URLs Google asks for (Netlify shows them next to the provider).
          </p>
          <button
            type="button"
            className="mt-4 flex w-full min-h-11 items-center justify-center gap-2 rounded-full border-2 border-ink/15 bg-white px-4 py-3 text-sm font-bold text-ink shadow-sm transition-colors hover:bg-ink/[0.04]"
            onClick={() => {
              setFormError(null)
              try {
                loginWithGoogle()
              } catch (err: unknown) {
                setFormError(err instanceof Error ? err.message : 'Could not start Google sign-in')
              }
            }}
          >
            <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24" aria-hidden>
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Continue with Google
          </button>
          {formError ? <p className="mt-3 text-sm font-medium text-red-700">{formError}</p> : null}
          <details className="mt-6 rounded-xl border border-ink/10 bg-cream/40 p-3">
            <summary className="cursor-pointer text-sm font-bold text-clay underline decoration-2 underline-offset-2">
              Email and password instead
            </summary>
            <h3 className="mt-4 font-display text-lg text-sky-deep">
              {mode === 'login' ? 'Sign in with email' : 'Create account with email'}
            </h3>
            <form className="mt-4 space-y-3" onSubmit={onSubmitAuth}>
            <div>
              <label htmlFor="saved-email" className="block text-sm font-semibold text-ink/80">
                Email
              </label>
              <input
                id="saved-email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(ev) => setEmail(ev.target.value)}
                className="mt-1 w-full rounded-xl border border-ink/15 bg-cream px-3 py-2 text-ink"
              />
            </div>
            <div>
              <label htmlFor="saved-password" className="block text-sm font-semibold text-ink/80">
                Password
              </label>
              <input
                id="saved-password"
                type="password"
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                required
                value={password}
                onChange={(ev) => setPassword(ev.target.value)}
                className="mt-1 w-full rounded-xl border border-ink/15 bg-cream px-3 py-2 text-ink"
              />
            </div>
            <button
              type="submit"
              disabled={busy}
              className="w-full rounded-full bg-clay px-4 py-3 font-bold text-white shadow-sm hover:bg-clay-dark disabled:opacity-60"
            >
              {busy ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Sign up'}
            </button>
            </form>
            <p className="mt-4 text-center text-sm text-ink/70">
              {mode === 'login' ? (
                <>
                  Need an account?{' '}
                  <button
                    type="button"
                    className="font-bold text-clay underline decoration-2 underline-offset-2 hover:text-clay-dark"
                    onClick={() => {
                      setMode('signup')
                      setFormError(null)
                    }}
                  >
                    Sign up
                  </button>
                </>
              ) : (
                <>
                  Already registered?{' '}
                  <button
                    type="button"
                    className="font-bold text-clay underline decoration-2 underline-offset-2 hover:text-clay-dark"
                    onClick={() => {
                      setMode('login')
                      setFormError(null)
                    }}
                  >
                    Sign in
                  </button>
                </>
              )}
            </p>
          </details>
        </section>
      ) : (
        <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-ink/75">
              Signed in as <span className="font-semibold text-ink">{user.email ?? user.id}</span>
            </p>
            <button
              type="button"
              onClick={() => void logoutUser()}
              className="rounded-full border border-ink/15 px-4 py-2 text-sm font-bold text-ink/80 hover:bg-ink/5"
            >
              Sign out
            </button>
          </div>
          {loadError ? <p className="text-sm font-medium text-red-700">{loadError}</p> : null}
          {slugs.length === 0 && !loadError ? (
            <p className="text-ink/75">
              No saved places yet. Open any place and use <strong className="text-ink">Save place</strong>.
            </p>
          ) : null}
          <ul className="grid gap-4 sm:grid-cols-2">
            {slugs.map((slug) => {
              const place = getPlaceBySlug(slug)
              if (!place) {
                return (
                  <li
                    key={slug}
                    className="flex items-center justify-between gap-2 rounded-2xl border border-ink/10 bg-white/40 px-4 py-3"
                  >
                    <span className="text-sm text-ink/70">Removed listing ({slug})</span>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => void removeSlug(slug)}
                      className="shrink-0 text-sm font-bold text-clay underline decoration-2 underline-offset-2 hover:text-clay-dark disabled:opacity-50"
                    >
                      Remove
                    </button>
                  </li>
                )
              }
              return (
                <li key={slug}>
                  <article className={`${listingCardPlaceRowClass()} relative`}>
                    <ListingCardImageLink
                      to={`/places/${place.slug}`}
                      src={place.image?.url}
                      ariaLabel={`${place.title}, ${place.city}, view place`}
                    />
                    <div className={`${listingCardBodyClasses} flex flex-col`}>
                      <div className="flex flex-wrap items-baseline justify-between gap-2">
                        <Link
                          to={`/regions/${regionToSlug(place.region)}`}
                          className="relative z-10 text-xs font-bold uppercase tracking-wide text-sage-dark underline decoration-2 underline-offset-2 hover:text-clay"
                        >
                          {place.region}
                        </Link>
                        {place.category ? (
                          <Link
                            to={`/categories/${encodeParam(place.category)}`}
                            className="relative z-10 text-xs font-bold uppercase tracking-wide text-ink/55 underline decoration-2 underline-offset-2 hover:text-clay"
                          >
                            {place.category}
                          </Link>
                        ) : null}
                      </div>
                      <Link
                        to={`/places/${place.slug}`}
                        className="font-display relative z-10 mt-1 text-lg text-sky-deep underline decoration-2 underline-offset-2 hover:text-clay"
                      >
                        {place.title}
                      </Link>
                      <span className="text-sm text-ink/65">{place.city}</span>
                    </div>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => void removeSlug(slug)}
                      className="absolute right-3 top-3 z-20 rounded-full bg-cream/90 px-3 py-1 text-xs font-bold text-ink/80 ring-1 ring-ink/10 hover:bg-ink/10 disabled:opacity-50"
                      aria-label={`Remove ${place.title} from saved`}
                    >
                      Remove
                    </button>
                  </article>
                </li>
              )
            })}
          </ul>
        </section>
      )}
    </div>
  )
}
