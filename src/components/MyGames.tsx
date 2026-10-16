import { useAuth } from '@clerk/react'
import { useEffect, useState } from 'react'
import { GameList } from '@/components/GameList'
import type { IClubGame } from '@/components/GameList'
import { clubGet } from '@/lib/club-api'

interface IMyGamesProps {
  accountId: number
}

interface IMyGamesResponse {
  games: IClubGame[]
}

type GamesState =
  | { status: 'loading' }
  | { status: 'ready'; games: IClubGame[] }
  | { status: 'error'; message: string }

export function MyGames(props: IMyGamesProps) {
  const { accountId } = props
  const { getToken } = useAuth()
  const [state, setState] = useState<GamesState>({ status: 'loading' })

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const token = await getToken()
        if (!token) {
          throw new Error('Clerk has not issued a session token yet.')
        }
        const body = await clubGet<IMyGamesResponse>('/accounts/me/games', token)
        if (!Array.isArray(body.games)) {
          throw new Error('The club API returned an unexpected game list.')
        }
        if (!cancelled) {
          setState({ status: 'ready', games: body.games })
        }
      } catch (error) {
        if (!cancelled) {
          const message = error instanceof Error ? error.message : 'Could not load your games.'
          setState({ status: 'error', message })
        }
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [accountId, getToken])

  return (
    <section className="mt-16 max-w-3xl border-t pt-10">
      <h2 className="text-3xl font-bold tracking-normal">Games</h2>
      {state.status === 'loading' ? <p className="mt-4 text-muted-foreground">Loading your games…</p> : null}
      {state.status === 'error' ? <p className="mt-4 text-muted-foreground">{state.message}</p> : null}
      {state.status === 'ready' && state.games.length === 0 ? (
        <p className="mt-4 text-muted-foreground">No Chess.com games on your matches yet.</p>
      ) : null}
      {state.status === 'ready' && state.games.length > 0 ? <GameList games={state.games} voice="you" /> : null}
    </section>
  )
}
