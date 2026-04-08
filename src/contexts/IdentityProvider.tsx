/* Sign-in paused: not mounted from App.tsx. Restore wrapper in App when re-enabling. */

import {
  getUser,
  handleAuthCallback,
  login,
  logout,
  oauthLogin,
  onAuthChange,
  signup,
} from '@netlify/identity'
import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { IdentityContext, type IdentityContextValue } from './identityContextBase'

export function IdentityProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<IdentityContextValue['user']>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let unsub: (() => void) | undefined
    ;(async () => {
      try {
        await handleAuthCallback()
      } catch {
        // Invalid hash or network; continue unauthenticated
      }
      const u = await getUser()
      setUser(u)
      setReady(true)
      unsub = onAuthChange((_event, next) => setUser(next))
    })()
    return () => unsub?.()
  }, [])

  const loginWithGoogle = useCallback(() => {
    oauthLogin('google')
  }, [])

  const loginWithPassword = useCallback(async (email: string, password: string) => {
    const u = await login(email.trim(), password)
    setUser(u)
  }, [])

  const signupWithPassword = useCallback(async (email: string, password: string) => {
    await signup(email.trim(), password)
    const u = await getUser()
    setUser(u)
  }, [])

  const logoutUser = useCallback(async () => {
    await logout()
    setUser(null)
  }, [])

  const value = useMemo(
    () => ({
      user,
      ready,
      loginWithGoogle,
      loginWithPassword,
      signupWithPassword,
      logoutUser,
    }),
    [user, ready, loginWithGoogle, loginWithPassword, signupWithPassword, logoutUser],
  )

  return <IdentityContext.Provider value={value}>{children}</IdentityContext.Provider>
}
