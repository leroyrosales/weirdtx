/* Sign-in paused: no callers while IdentityProvider is commented out in App. */

import { useContext } from 'react'
import { IdentityContext, type IdentityContextValue } from '../contexts/identityContextBase'

export function useIdentity(): IdentityContextValue {
  const ctx = useContext(IdentityContext)
  if (!ctx) throw new Error('useIdentity must be used within IdentityProvider')
  return ctx
}
