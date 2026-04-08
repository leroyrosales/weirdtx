/* Sign-in paused: used only when IdentityProvider is mounted again. */

import type { User } from '@netlify/identity'
import { createContext } from 'react'

export type IdentityContextValue = {
  user: User | null
  /** False until the first client-side auth check finishes (handleAuthCallback + getUser). */
  ready: boolean
  /** Redirects to Google (Netlify Identity). Browser only. */
  loginWithGoogle: () => void
  loginWithPassword: (email: string, password: string) => Promise<void>
  signupWithPassword: (email: string, password: string) => Promise<void>
  logoutUser: () => Promise<void>
}

export const IdentityContext = createContext<IdentityContextValue | null>(null)
