import { useAuth } from '@clerk/react'
import { useEffect, useState } from 'react'
import { clubGet, clubPost } from '@/lib/club-api'
import { isClubBoard } from '@/lib/board'
import type { IAddMatchGame, IClubBoard, ISignupPlayer } from '@/lib/board'

export type BoardState =
  | { status: 'loading' }
  | { status: 'ready'; board: IClubBoard }
  | { status: 'error'; message: string }

interface IRosterAccount {
  id: number
  name: string
  surname: string
  chessCom: string | null
}

interface IAccountsResponse {
  accounts: IRosterAccount[]
}

interface IAccountResponse {
  account: IRosterAccount | null
}

export interface ITestSide {
  name: string
  points: number
  gameWins: number
}

export interface ITestPairing {
  white: string
  black: string | null
  kind: 'same' | 'up' | 'down' | 'bye'
  rematch: boolean
  reason: string
  whitePlayer: ITestSide
  blackPlayer: ITestSide | null
}

interface IPreviewResponse {
  round: number
  pairs: ITestPairing[]
}

interface IGenerateResponse {
  rematch?: boolean
  pairs?: ITestPairing[]
}

// 'score' pairs by points; 'random' ignores points. Kept pairs are saved as they are.
export interface IGenerateChoice {
  mode?: 'score' | 'random'
  kept?: ITestPairing[]
}

interface IUseClubBoard {
  board: BoardState
  roster: ISignupPlayer[]
  addGame: (drawId: number, game: IAddMatchGame) => Promise<string | null>
  // Returns the proposed pairs when the organizer has to confirm them: they repeat an old match, or they
  // are a random draw.
  generateRound: (round: number, choice?: IGenerateChoice) => Promise<ITestPairing[] | string | null>
  previewRound: (round: number) => Promise<ITestPairing[] | string>
}

export function useClubBoard(): IUseClubBoard {
  const { getToken } = useAuth()
  const [board, setBoard] = useState<BoardState>({ status: 'loading' })
  const [roster, setRoster] = useState<ISignupPlayer[]>([])

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const token = await getToken()
        if (!token) {
          throw new Error('Clerk has not issued a session token yet.')
        }
        const next = await fetchBoard(token)
        if (!cancelled) {
          setRoster(next.roster)
          setBoard({ status: 'ready', board: next.board })
        }
      } catch (error) {
        if (!cancelled) {
          const message = error instanceof Error ? error.message : 'Could not reach the club API.'
          setBoard({ status: 'error', message })
        }
      }
    }

    void load()

    return () => {
      cancelled = true
    }
  }, [getToken])

  async function addGame(drawId: number, game: IAddMatchGame): Promise<string | null> {
    try {
      const token = await getToken()
      if (!token) {
        return 'Clerk has not issued a session token yet.'
      }
      await clubPost(`/draws/${drawId}/games`, token, {
        white: game.white,
        black: game.black,
        url: game.url,
      })
      try {
        const next = await fetchBoard(token)
        setRoster(next.roster)
        setBoard({ status: 'ready', board: next.board })
      } catch {
        return 'Saved, but the board did not refresh.'
      }
      return null
    } catch (error) {
      return error instanceof Error ? error.message : 'Could not save this game.'
    }
  }

  async function generateRound(round: number, choice: IGenerateChoice = {}): Promise<ITestPairing[] | string | null> {
    try {
      const token = await getToken()
      if (!token) {
        return 'Clerk has not issued a session token yet.'
      }
      const { kept, mode = 'score' } = choice
      const body = kept ? { round, pairs: kept.map((pair) => ({ white: pair.white, black: pair.black })) } : { round, mode }
      const generated = await clubPost<IGenerateResponse>('/draws/next', token, body)
      if (generated.rematch) {
        return Array.isArray(generated.pairs) ? generated.pairs : 'The club API returned an unexpected pairing.'
      }
      try {
        const next = await fetchBoard(token)
        setRoster(next.roster)
        setBoard({ status: 'ready', board: next.board })
      } catch {
        return 'Saved, but the board did not refresh.'
      }
      return null
    } catch (error) {
      return error instanceof Error ? error.message : 'Could not generate the next round.'
    }
  }

  async function previewRound(round: number): Promise<ITestPairing[] | string> {
    try {
      const token = await getToken()
      if (!token) {
        return 'Clerk has not issued a session token yet.'
      }
      const preview = await clubPost<IPreviewResponse>('/draws/preview', token, { round })
      if (!Array.isArray(preview.pairs)) {
        return 'The club API returned an unexpected pairing.'
      }
      return preview.pairs
    } catch (error) {
      return error instanceof Error ? error.message : 'Could not build a test pairing.'
    }
  }

  return { board, roster, addGame, generateRound, previewRound }
}

async function fetchBoard(token: string): Promise<{ board: IClubBoard; roster: ISignupPlayer[] }> {
  const body = await clubGet<unknown>('/board', token)
  if (!isClubBoard(body)) {
    throw new Error('The club API returned an unexpected board.')
  }

  try {
    const [accountsBody, meBody] = await Promise.all([
      clubGet<IAccountsResponse>('/accounts', token),
      clubGet<IAccountResponse>('/accounts/me', token),
    ])
    const mine = meBody.account?.id ?? null
    const roster = Array.isArray(accountsBody.accounts)
      ? accountsBody.accounts.map((account) => toRosterPlayer(account, mine))
      : []
    return { board: body, roster }
  } catch {
    return { board: body, roster: [] }
  }
}

function toRosterPlayer(account: IRosterAccount, mine: number | null): ISignupPlayer {
  return {
    name: `${account.name} ${account.surname}`.trim(),
    chessCom: account.chessCom,
    claimed: true,
    mine: account.id === mine,
  }
}
