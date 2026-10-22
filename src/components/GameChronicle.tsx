import { ExternalLink } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { IClubGameRow } from '@/lib/board'
import { playerPath } from '@/lib/players'

interface IGameChronicleProps {
  games: IClubGameRow[]
}

interface IGameLineProps {
  game: IClubGameRow
}

export function GameChronicle(props: IGameChronicleProps) {
  const { games } = props

  return (
    <section>
      <p className="text-xs font-bold tracking-[0.14em] text-secondary uppercase">Shared</p>
      <h2 className="mt-3 text-3xl font-bold tracking-normal">Every game</h2>
      <p className="mt-3 text-sm text-muted-foreground">Earliest first.</p>
      {games.length === 0 ? <p className="mt-6 text-muted-foreground">No shared games yet.</p> : null}
      {games.length > 0 ? (
        <ol className="mt-4 divide-y divide-border rounded-3xl border border-border bg-card">
          {games.map((game) => (
            <GameLine game={game} key={game.url} />
          ))}
        </ol>
      ) : null}
    </section>
  )
}

function GameLine(props: IGameLineProps) {
  const { game } = props
  const detail = [formatPlayedAt(game.playedAt), game.opening].filter(Boolean).join(' · ')

  return (
    <li className="grid gap-2 px-5 py-4 sm:grid-cols-[7rem_minmax(0,1fr)_auto] sm:items-center">
      <p className="text-xs font-bold tracking-[0.14em] text-secondary uppercase">Round {game.round}</p>
      <div className="min-w-0">
        <p className="font-bold">
          <Player name={game.white} />
          <span className="mx-2 text-xs font-bold tracking-[0.14em] text-muted-foreground uppercase">vs</span>
          <Player name={game.black} />
        </p>
        {detail ? <p className="mt-1 text-sm text-muted-foreground">{detail}</p> : null}
      </div>
      <div className="flex flex-wrap items-center gap-3 sm:justify-end">
        <p className="font-bold">{resultLabel(game)}</p>
        <a
          className="inline-flex items-center gap-1 text-sm text-secondary underline underline-offset-4"
          href={game.url}
          rel="noreferrer"
          target="_blank"
        >
          <ExternalLink className="size-3.5" />
          Game
        </a>
      </div>
    </li>
  )
}

interface IPlayerProps {
  name: string
}

function Player(props: IPlayerProps) {
  const { name } = props

  return (
    <Link className="underline-offset-4 hover:text-secondary hover:underline" to={playerPath(name)}>
      {name}
    </Link>
  )
}

function resultLabel(game: IClubGameRow): string {
  if (game.winnerName) {
    return `${game.winnerName} won`
  }
  if (game.outcome === 'draw') {
    return 'Draw'
  }
  return 'Pending'
}

function formatPlayedAt(value: string | null): string | null {
  if (!value) {
    return null
  }
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return null
  }
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}
