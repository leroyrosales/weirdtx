// Sign-in nav paused: restore useIdentity + saved item below.
// import { useIdentity } from './useIdentity'

export type LayoutNavLinkItem = {
  kind: 'link'
  to: string
  label: string
  ariaLabel?: string
}

export type LayoutNavRandomItem = {
  kind: 'random'
  label: string
  ariaLabel?: string
}

export type LayoutNavEntry = LayoutNavLinkItem | LayoutNavRandomItem

const STATIC_NAV: LayoutNavEntry[] = [
  { kind: 'link', to: '/', label: 'Home' },
  { kind: 'link', to: '/explore', label: 'Near me' },
  { kind: 'link', to: '/places', label: 'Places' },
  { kind: 'link', to: '/events', label: 'Events' },
  { kind: 'random', label: 'Random', ariaLabel: 'Random place or event' },
]

export function useLayoutNav(): LayoutNavEntry[] {
  // const { user, ready } = useIdentity()
  return [
    ...STATIC_NAV,
    // {
    //   kind: 'link' as const,
    //   to: '/saved',
    //   label: ready && user ? 'Howdy!' : 'Sign in',
    //   ariaLabel: ready && user ? 'Saved places' : 'Sign in for saved places',
    // },
  ]
}
