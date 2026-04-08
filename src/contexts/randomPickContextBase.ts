import { createContext } from 'react'

export type RandomPickContextValue = {
  startRandomPick: () => void
  /** True while the full-screen “Vamonos” splash is open or leaving. */
  randomJourneyActive: boolean
}

export const RandomPickContext = createContext<RandomPickContextValue | null>(null)
