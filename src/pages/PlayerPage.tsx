import { Show, useAuth } from '@clerk/react'
import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { GameList } from '@/components/GameList'
import type { IClubGame } from '@/components/GameList'
import { buttonVariants } from '@/components/ui/button'
import { clubGet } from '@/lib/club-api'
import { cn } from '@/lib/utils'

interface IPlayer {
  name: string
  chessCom: string | null
  elo: number | null
  level: string | null
  timeControl: string | null
  games: IClubGame[]
}

interface IPlayerResponse {
  player: IPlayer
}

type PlayerState =
  | { status: 'loading' }
  | { status: 'ready'; player: IPlayer }
  | { status: 'missing' }
  | { status: 'error'; message: string }

export function PlayerPage() {
  return (
    <main className="mx-auto max-w-5xl px-6 pb-20">
      <Show when="signed-out">
        <SignedOutNotice />
      </Show>
      <Show when="signed-in">
        <PlayerProfile />
      </Show>
    </main>
  )
}

function SignedOutNotice() {
  return (
    <section className="max-w-xl">
      <p className="text-xs font-bold tracking-[0.14em] text-secondary uppercase">Player</p>
      <h1 className="mt-3 text-5xl font-bold leading-tight tracking-normal">Sign in to see players.</h1>
      <Link className={cn(buttonVariants({ size: 'lg' }), 'mt-7 hover:bg-secondary')} to="/sign-in">
        Sign in
      </Link>
    </section>
  )
}

function PlayerProfile() {
  const { name: rawName } = useParams()
  const name = rawName ?? ''
  const { getToken } = useAuth()
  const [state, setState] = useState<PlayerState>({ status: 'loading' })
  const [trackedName, setTrackedName] = useState(name)
  if (trackedName !== name) {
    setTrackedName(name)
    setState({ status: 'loading' })
  }

  useEffect(() => {
    let cancelled = false

    async function load() {
      if (!name) {
        return
      }
      try {
        const token = await getToken()
        if (!token) {
          throw new Error('Clerk has not issued a session token yet.')
        }
        const body = await clubGet<IPlayerResponse>(`/players/${encodeURIComponent(name)}`, token)
        if (!body.player || typeof body.player.name !== 'string' || !Array.isArray(body.player.games)) {
          throw new Error('The club API returned an unexpected player.')
        }
        if (!cancelled) {
          setState({ status: 'ready', player: body.player })
        }
      } catch (error) {
        if (cancelled) {
          return
        }
        const message = error instanceof Error ? error.message : 'Could not load this player.'
        if (message === 'That player is not in the club.') {
          setState({ status: 'missing' })
          return
        }
        setState({ status: 'error', message })
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [name, getToken])

  if (state.status === 'loading') {
    return <p className="text-muted-foreground">Loading player…</p>
  }
  if (!name || state.status === 'missing') {
    return (
      <section className="max-w-xl">
        <h1 className="text-5xl font-bold leading-tight tracking-normal">Player not found.</h1>
        <Link className="mt-6 inline-block font-semibold text-secondary underline underline-offset-4" to="/members">
          Back to members
        </Link>
      </section>
    )
  }
  if (state.status === 'error') {
    return <p className="text-muted-foreground">{state.message}</p>
  }

  const { player } = state
  const eyebrow = [player.level, player.elo === null ? null : `Elo ${player.elo}`].filter(Boolean).join(' · ')

  return (
    <section className="max-w-3xl">
      <p className="text-xs font-bold tracking-[0.14em] text-secondary uppercase">{eyebrow || 'Player'}</p>
      <h1 className="mt-3 text-5xl font-bold leading-tight tracking-normal">{player.name}</h1>
      <p className="mt-4 text-lg text-muted-foreground">
        {player.chessCom ? (
          <a
            className="text-secondary underline underline-offset-4"
            href={`https://www.chess.com/member/${player.chessCom}`}
            rel="noreferrer"
            target="_blank"
          >
            {player.chessCom}
          </a>
        ) : (
          'No Chess.com account'
        )}
        {player.timeControl ? ` · ${player.timeControl}` : ''}
      </p>
      <h2 className="mt-16 border-t pt-10 text-3xl font-bold tracking-normal">Games</h2>
      {player.games.length === 0 ? (
        <p className="mt-4 text-muted-foreground">No Chess.com games on these matches yet.</p>
      ) : (
        <GameList games={player.games} voice="player" />
      )}
    </section>
  )
}
