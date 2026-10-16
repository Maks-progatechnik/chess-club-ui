import { Show, useAuth } from '@clerk/react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { buttonVariants } from '@/components/ui/button'
import { clubGet } from '@/lib/club-api'
import { playerPath } from '@/lib/players'
import { cn } from '@/lib/utils'

type RatingMode = 'rapid' | 'blitz' | 'bullet'

interface IAutumnPlayer {
  name: string
  username: string | null
  timeControl: string | null
  profileName: string | null
  profileUrl: string | null
  rating: number | null
  ratingMode: RatingMode | null
  rapid: number | null
  blitz: number | null
  bullet: number | null
  games: number | null
  unavailable: boolean
  flag: string | null
}

interface IAutumnResponse {
  title: string
  advancedAt: number
  advanced: IAutumnPlayer[]
  beginner: IAutumnPlayer[]
  flagged: IAutumnPlayer[]
}

interface IAutumnBoard {
  title: string
  advancedAt: number
  advanced: IAutumnPlayer[]
  beginner: IAutumnPlayer[]
  flagged: IAutumnPlayer[]
}

type AutumnState =
  | { status: 'loading' }
  | { status: 'ready'; board: IAutumnBoard }
  | { status: 'error'; message: string }

interface IPlayerGroupProps {
  title: string
  note: string
  players: IAutumnPlayer[]
  empty: string
}

interface IPlayerTableProps {
  players: IAutumnPlayer[]
  showFlag: boolean
}

interface IPlayerRowProps {
  player: IAutumnPlayer
  showFlag: boolean
}

interface IRatingCellProps {
  player: IAutumnPlayer
}

interface IGamesCellProps {
  games: number | null
}

interface IModeRating {
  mode: RatingMode
  value: number | null
}

export function AutumnPage() {
  return (
    <main className="mx-auto max-w-5xl px-6 pb-20">
      <Show when="signed-out">
        <SignedOutNotice />
      </Show>
      <Show when="signed-in">
        <AutumnRegistration />
      </Show>
    </main>
  )
}

function SignedOutNotice() {
  return (
    <section className="max-w-xl">
      <p className="text-xs font-bold tracking-[0.14em] text-secondary uppercase">Autumn 2026</p>
      <h1 className="mt-3 text-5xl font-bold leading-tight tracking-normal">Sign in to see registration.</h1>
      <Link className={cn(buttonVariants({ size: 'lg' }), 'mt-7 hover:bg-secondary')} to="/sign-in">
        Sign in
      </Link>
    </section>
  )
}

function AutumnRegistration() {
  const { getToken } = useAuth()
  const [autumn, setAutumn] = useState<AutumnState>({ status: 'loading' })

  useEffect(() => {
    let cancelled = false

    async function loadRegistration() {
      try {
        const token = await getToken()
        if (!token) {
          throw new Error('Clerk has not issued a session token yet.')
        }

        const body = await clubGet<IAutumnResponse>('/tournaments/autumn-2026', token)
        if (!Array.isArray(body.advanced) || !Array.isArray(body.beginner) || !Array.isArray(body.flagged)) {
          throw new Error('The club API returned an unexpected registration list.')
        }

        if (!cancelled) {
          setAutumn({
            status: 'ready',
            board: {
              title: body.title,
              advancedAt: body.advancedAt,
              advanced: body.advanced,
              beginner: body.beginner,
              flagged: body.flagged,
            },
          })
        }
      } catch (error) {
        if (!cancelled) {
          const message = error instanceof Error ? error.message : 'Could not reach the club API.'
          setAutumn({ status: 'error', message })
        }
      }
    }

    void loadRegistration()

    return () => {
      cancelled = true
    }
  }, [getToken])

  const board = autumn.status === 'ready' ? autumn.board : null
  const playerCount = board ? board.advanced.length + board.beginner.length + board.flagged.length : 0
  const count = board ? (playerCount === 1 ? '1 player' : `${playerCount} players`) : 'Tournament'

  return (
    <section>
      <p className="text-xs font-bold tracking-[0.14em] text-secondary uppercase">{count}</p>
      <h1 className="mt-3 text-5xl font-bold leading-tight tracking-normal">Autumn registration</h1>
      <p className="mt-4 max-w-2xl text-lg text-muted-foreground">
        {board
          ? `Split by Chess.com. Advanced is ${board.advancedAt} or higher in rapid, blitz, or bullet.`
          : 'Split by Chess.com rating.'}
      </p>
      {autumn.status === 'loading' ? <p className="mt-6 text-muted-foreground">Loading Chess.com ratings…</p> : null}
      {autumn.status === 'error' ? <p className="mt-6 text-muted-foreground">{autumn.message}</p> : null}
      {board ? (
        <div className="mt-10 space-y-12">
          {board.flagged.length > 0 ? (
            <PlayerGroup
              empty=""
              note="These usernames don't match the person who registered."
              players={board.flagged}
              title="Check the account"
            />
          ) : null}
          <PlayerGroup
            empty={`No one is ${board.advancedAt} or higher yet.`}
            note="Best of rapid, blitz, and bullet. Games are the total of those."
            players={board.advanced}
            title="Advanced"
          />
          <PlayerGroup
            empty="No one under the line yet."
            note="Under the line, or no rated games yet."
            players={board.beginner}
            title="Beginner"
          />
        </div>
      ) : null}
    </section>
  )
}

function PlayerGroup(props: IPlayerGroupProps) {
  const { title, note, players, empty } = props
  const count = players.length === 1 ? '1 player' : `${players.length} players`

  return (
    <section>
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h2 className="text-3xl font-bold tracking-normal">{title}</h2>
        <p className="text-xs font-bold tracking-[0.14em] text-secondary uppercase">{count}</p>
      </div>
      <p className="mt-2 text-muted-foreground">{note}</p>
      {players.length > 0 ? (
        <PlayerTable players={players} showFlag={players.some((player) => player.flag)} />
      ) : (
        <p className="mt-4 text-muted-foreground">{empty}</p>
      )}
    </section>
  )
}

function PlayerTable(props: IPlayerTableProps) {
  const { players, showFlag } = props

  return (
    <div className="mt-4 overflow-x-auto">
      <table className="w-full text-left">
        <thead>
          <tr className="border-b text-xs tracking-[0.14em] text-secondary uppercase">
            <th className="py-3 pr-4 font-bold">Name</th>
            <th className="py-3 pr-4 font-bold">Chess.com</th>
            <th className="py-3 pr-4 font-bold">{showFlag ? 'Account' : 'Rating'}</th>
            <th className="py-3 pr-4 font-bold">Games</th>
            <th className="py-3 font-bold">Time control</th>
          </tr>
        </thead>
        <tbody>
          {players.map((player) => (
            <PlayerRow key={player.name} player={player} showFlag={showFlag} />
          ))}
        </tbody>
      </table>
    </div>
  )
}

function PlayerRow(props: IPlayerRowProps) {
  const { player, showFlag } = props

  return (
    <tr className="border-b align-top">
      <td className="py-3 pr-4 font-bold">
        <Link className="underline-offset-4 hover:text-secondary hover:underline" to={playerPath(player.name)}>
          {player.name}
        </Link>
      </td>
      <td className="py-3 pr-4">
        {player.username && player.profileUrl ? (
          <a
            className="text-secondary underline underline-offset-4"
            href={player.profileUrl}
            rel="noreferrer"
            target="_blank"
          >
            {player.username}
          </a>
        ) : (
          <span className="text-muted-foreground">—</span>
        )}
      </td>
      <td className="py-3 pr-4">
        {showFlag ? <span className="text-secondary">{player.flag}</span> : <RatingCell player={player} />}
      </td>
      <td className="py-3 pr-4">
        <GamesCell games={player.games} />
      </td>
      <td className="py-3">{player.timeControl ?? <span className="text-muted-foreground">—</span>}</td>
    </tr>
  )
}

function GamesCell(props: IGamesCellProps) {
  const { games } = props

  if (games === null) {
    return <span className="text-muted-foreground">—</span>
  }

  return <span className="font-bold">{games.toLocaleString('en-US')}</span>
}

function RatingCell(props: IRatingCellProps) {
  const { player } = props
  const extras = otherRatings(player)

  if (player.unavailable) {
    return <span className="text-muted-foreground">Couldn't reach Chess.com</span>
  }

  if (player.rating === null || !player.ratingMode) {
    return <span className="text-muted-foreground">Unrated</span>
  }

  return (
    <span>
      <span className="font-bold">{player.rating}</span>
      <span className="ml-2 text-muted-foreground">{player.ratingMode}</span>
      {extras.length > 0 ? <span className="mt-1 block text-sm text-muted-foreground">{extras.join(' · ')}</span> : null}
    </span>
  )
}

function otherRatings(player: IAutumnPlayer): string[] {
  const modes: IModeRating[] = [
    { mode: 'rapid', value: player.rapid },
    { mode: 'blitz', value: player.blitz },
    { mode: 'bullet', value: player.bullet },
  ]

  return modes
    .filter((entry) => entry.mode !== player.ratingMode && entry.value !== null)
    .map((entry) => `${entry.value} ${entry.mode}`)
}
