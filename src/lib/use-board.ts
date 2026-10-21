import { useAuth } from '@clerk/react'
import { useEffect, useState } from 'react'
import { clubGet, clubPost } from '@/lib/club-api'
import { isClubBoard } from '@/lib/board'
import type { IAddMatchGame, IClubBoard, ISignupPlayer } from '@/lib/board'

export type BoardState =
  | { status: 'loading' }
  | { status: 'ready'; board: IClubBoard }
  | { status: 'error'; message: string }

interface IDummiesResponse {
  dummies: ISignupPlayer[]
}

interface IUseClubBoard {
  board: BoardState
  roster: ISignupPlayer[]
  addGame: (drawId: number, game: IAddMatchGame) => Promise<string | null>
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
        group: game.group,
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

  return { board, roster, addGame }
}

async function fetchBoard(token: string): Promise<{ board: IClubBoard; roster: ISignupPlayer[] }> {
  const body = await clubGet<unknown>('/board', token)
  if (!isClubBoard(body)) {
    throw new Error('The club API returned an unexpected board.')
  }

  let roster: ISignupPlayer[] = []
  try {
    const sheet = await clubGet<IDummiesResponse>('/dummies', token)
    roster = Array.isArray(sheet.dummies) ? sheet.dummies : []
  } catch {
    roster = []
  }

  return { board: body, roster }
}
