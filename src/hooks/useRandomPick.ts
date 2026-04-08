import { useContext } from 'react'
import { RandomPickContext, type RandomPickContextValue } from '../contexts/randomPickContextBase'

export function useRandomPick(): RandomPickContextValue {
  const ctx = useContext(RandomPickContext)
  if (!ctx) throw new Error('useRandomPick must be used within RandomPickProvider')
  return ctx
}
