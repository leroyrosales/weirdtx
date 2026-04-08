import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { pickRandomListingPath } from '../lib/randomListing'
import { usePageSeo } from '../lib/seo'

export function RandomListingPage() {
  const navigate = useNavigate()

  usePageSeo({
    title: 'Random listing',
    description: 'Jump to a random Weird TX place or event.',
    noIndex: true,
  })

  useEffect(() => {
    navigate(pickRandomListingPath(), { replace: true })
  }, [navigate])

  return (
    <div className="flex min-h-[45vh] flex-col items-center justify-center gap-3 px-4 py-16 text-center">
      <p
        className="font-display text-2xl tracking-wide text-sky-deep sm:text-3xl"
        role="status"
        aria-live="polite"
      >
        Shuffling the atlas…
      </p>
      <p className="max-w-sm text-ink/70">Hold tight while we pick a random Texas oddity for you.</p>
    </div>
  )
}
