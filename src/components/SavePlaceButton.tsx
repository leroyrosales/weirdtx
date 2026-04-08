/* Sign-in paused: not rendered from PlacePage. */

import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useIdentity } from '../hooks/useIdentity'
import { fetchSavedSlugs, postSavedSlug, SavedPlacesApiError } from '../lib/savedPlacesApi'

type Props = { slug: string; title: string }

export function SavePlaceButton({ slug, title }: Props) {
  const { user, ready } = useIdentity()
  const [saved, setSaved] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    if (!user) {
      setSaved(false)
      return
    }
    setError(null)
    try {
      const slugs = await fetchSavedSlugs()
      setSaved(slugs.includes(slug))
    } catch (e) {
      if (e instanceof SavedPlacesApiError && e.status === 401) {
        setError('Sign in again to sync saves.')
      } else {
        setError(null)
        setSaved(false)
      }
    }
  }, [user, slug])

  useEffect(() => {
    if (!ready || !user) return
    void refresh()
  }, [ready, user, refresh])

  const toggle = async () => {
    if (!user || busy) return
    setBusy(true)
    setError(null)
    try {
      const next = await postSavedSlug(saved ? 'remove' : 'add', slug)
      setSaved(next.includes(slug))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not update')
    } finally {
      setBusy(false)
    }
  }

  if (!ready) return null

  if (!user) {
    return (
      <p className="mt-4 text-sm text-ink/75">
        <Link
          to="/saved"
          className="font-bold text-clay underline decoration-2 underline-offset-2 hover:text-clay-dark"
        >
          Sign in with Google
        </Link>{' '}
        (or email) to save <span className="sr-only">{title} </span>to your list.
      </p>
    )
  }

  return (
    <div className="mt-4 flex flex-wrap items-center gap-3">
      <button
        type="button"
        disabled={busy}
        onClick={() => void toggle()}
        className={`inline-flex min-h-11 items-center justify-center rounded-full px-5 py-2.5 text-sm font-bold shadow-sm transition-colors sm:min-h-0 ${
          saved
            ? 'bg-sage text-white ring-2 ring-gold-bright/60 hover:bg-sage/90'
            : 'bg-clay text-white hover:bg-clay-dark'
        } disabled:opacity-60`}
        aria-pressed={saved}
      >
        {busy ? 'Saving…' : saved ? 'Saved' : 'Save place'}
      </button>
      <Link
        to="/saved"
        className="text-sm font-bold text-clay underline decoration-2 underline-offset-2 hover:text-clay-dark"
      >
        View saved list
      </Link>
      {error ? <span className="text-sm font-medium text-red-700">{error}</span> : null}
    </div>
  )
}
