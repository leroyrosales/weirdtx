import { Link } from 'react-router-dom'

import { TexasFlagPlaceholder } from './TexasFlagPlaceholder'

/** Square thumbnail; matches homepage “Featured places” cards. */
export const listingCardThumbClasses =
  'relative h-[4.5rem] w-[6.5rem] shrink-0 overflow-hidden rounded-lg border border-ink/10 bg-ink/5 sm:h-[5.25rem] sm:w-[8.25rem]'

export const listingCardBodyClasses = 'min-w-0 flex-1'

export function listingCardPlaceRowClass(): string {
  return 'flex items-stretch gap-4 rounded-xl border border-ink/10 bg-white/55 p-3 shadow-sm transition-all hover:border-sage/45 hover:shadow sm:p-4'
}

export function listingCardEventRowClass(): string {
  return 'flex items-stretch gap-4 rounded-xl border border-ink/10 bg-white/55 p-3 shadow-sm transition-all hover:border-sand/55 hover:shadow sm:p-4'
}

/** Image or Texas-flag placeholder inside a thumb-sized box (e.g. inside a parent `Link`). */
export function ListingCardThumbMedia({ src }: { src?: string | null }) {
  return src ? (
    <img src={src} alt="" loading="lazy" className="h-full w-full object-cover" />
  ) : (
    <TexasFlagPlaceholder className="h-full w-full" />
  )
}

/** Thumbnail link for cards that also contain other links (region, tags, etc.). */
export function ListingCardImageLink({
  to,
  src,
  ariaLabel,
}: {
  to: string
  src?: string | null
  ariaLabel: string
}) {
  return (
    <Link to={to} className={listingCardThumbClasses} aria-label={ariaLabel}>
      <ListingCardThumbMedia src={src} />
    </Link>
  )
}
