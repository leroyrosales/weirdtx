/** Simplified Texas flag for small listing thumbnails (official colors approx.). */
export function TexasFlagPlaceholder({ className = '' }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 90 60"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden
      focusable="false"
    >
      {/* Hoist: blue with lone star; fly: white over red */}
      <rect width="30" height="60" fill="#002868" />
      <rect x="30" width="60" height="30" fill="#ffffff" />
      <rect x="30" y="30" width="60" height="30" fill="#BF0A30" />
      {/* Five-point star, center (15,30), ~radius 9 in viewBox units */}
      <path
        fill="#ffffff"
        d="M15 19.2l1.76 5.4h5.7l-4.62 3.36 1.76 5.42L15 30.82l-4.6 3.36 1.76-5.42-4.62-3.36h5.7z"
      />
    </svg>
  )
}
