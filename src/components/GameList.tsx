import { Link } from 'react-router-dom'
import { playerPath } from '@/lib/players'
import { cn } from '@/lib/utils'

export interface IClubGame {
  url: string
  opponent: string
  color: 'white' | 'black'
  outcome: 'win' | 'loss' | 'draw' | 'unknown'
  summary: string
  white: string
  black: string
  whiteRating: number | null
  blackRating: number | null
  whiteChange: number | null
  blackChange: number | null
  timeControl: string | null
  opening: string | null
  playedAt: string | null
  yours: boolean
}

interface IGameListProps {
  games: IClubGame[]
  voice: 'you' | 'player'
}

interface IGameRowProps {
  game: IClubGame
  voice: 'you' | 'player'
}

export function GameList(props: IGameListProps) {
  const { games, voice } = props

  return (
    <div className="mt-4">
      {games.map((game) => (
        <GameRow game={game} key={`${game.url}-${game.opponent}`} voice={voice} />
      ))}
    </div>
  )
}

function GameRow(props: IGameRowProps) {
  const { game, voice } = props
  const details = [game.timeControl, game.opening, formatPlayedAt(game.playedAt)].filter(Boolean)
  const colorNote = game.yours ? (voice === 'you' ? `you had ${game.color}` : `played ${game.color}`) : null

  return (
    <article className="border-b py-4">
      <p className="text-lg font-bold">
        <span className={cn(game.yours && game.outcome === 'loss' && 'text-secondary')}>{game.summary}</span>
        <span className="mx-3 text-xs font-bold tracking-[0.14em] text-secondary uppercase">vs</span>
        <Link className="underline-offset-4 hover:text-secondary hover:underline" to={playerPath(game.opponent)}>
          {game.opponent}
        </Link>
      </p>
      {game.white && game.black ? (
        <p className="mt-2 text-sm text-muted-foreground">
          {playerLabel(game.white, game.whiteRating, game.whiteChange)}
          <span className="mx-2 text-xs font-bold tracking-[0.14em] text-secondary uppercase">vs</span>
          {playerLabel(game.black, game.blackRating, game.blackChange)}
          {colorNote ? ` · ${colorNote}` : ''}
        </p>
      ) : null}
      {details.length > 0 ? <p className="mt-1 text-sm text-muted-foreground">{details.join(' · ')}</p> : null}
      <a className="mt-2 inline-block text-sm text-secondary underline underline-offset-4" href={game.url} rel="noreferrer" target="_blank">
        {game.url.replace('https://www.chess.com', 'chess.com')}
      </a>
    </article>
  )
}

function playerLabel(name: string, rating: number | null, change: number | null): string {
  const parts = [name]
  if (rating !== null) {
    parts.push(String(rating))
  }
  if (change !== null && change !== 0) {
    parts.push(change > 0 ? `+${change}` : String(change))
  }
  return parts.join(' ')
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
