import { createContext, useContext } from 'react'
import type { IAccountFormValues } from '@/components/AccountForm'

export interface IAccount {
  id: number
  name: string
  surname: string
  chessCom: string | null
  elo: number
  signupName: string | null
}

export type ClubAccountState =
  | { status: 'loading' }
  | { status: 'signed-out' }
  | { status: 'ready'; account: IAccount | null }
  | { status: 'error'; message: string }

export interface IClubAccountContext {
  state: ClubAccountState
  saveAccount: (values: IAccountFormValues) => Promise<string | null>
}

export const ClubAccountContext = createContext<IClubAccountContext | null>(null)

export function useClubAccount(): IClubAccountContext {
  const context = useContext(ClubAccountContext)
  if (!context) {
    throw new Error('useClubAccount must be used inside ClubAccountProvider')
  }
  return context
}
