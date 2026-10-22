import { Show } from '@clerk/react'
import { Link } from 'react-router-dom'
import { GameChronicle } from '@/components/GameChronicle'
import { Leaderboard } from '@/components/Leaderboard'
import { buttonVariants } from '@/components/ui/button'
import { useClubBoard } from '@/lib/use-board'
import { cn } from '@/lib/utils'

export function GamesPage() {
  return (
    <main className="mx-auto max-w-5xl px-6 pb-20">
      <Show when="signed-out">
        <SignedOutNotice />
      </Show>
      <Show when="signed-in">
        <GamesBoard />
      </Show>
    </main>
  )
}

function SignedOutNotice() {
  return (
    <section className="max-w-xl">
      <p className="text-xs font-bold tracking-[0.14em] text-secondary uppercase">Games</p>
      <h1 className="mt-3 text-5xl font-bold leading-tight tracking-normal">Sign in to see every game.</h1>
      <Link className={cn(buttonVariants({ size: 'lg' }), 'mt-7 hover:bg-secondary')} to="/sign-in">
        Sign in
      </Link>
    </section>
  )
}

function GamesBoard() {
  const { board } = useClubBoard()
  const standings = board.status === 'ready' ? (board.board.gameStandings ?? []) : []
  const games = board.status === 'ready' ? (board.board.games ?? []) : []

  return (
    <section>
      <p className="text-xs font-bold tracking-[0.14em] text-secondary uppercase">All games</p>
      <h1 className="mt-3 text-5xl font-bold leading-tight tracking-normal">Every shared game.</h1>
      <p className="mt-4 max-w-2xl text-lg text-muted-foreground">
        Each game scores on its own. Domestic Elo starts at 1200 and only moves when two club players meet.
      </p>
      {board.status === 'loading' ? <p className="mt-8 text-muted-foreground">Checking shared games…</p> : null}
      {board.status === 'error' ? <p className="mt-8 text-muted-foreground">{board.message}</p> : null}
      {board.status === 'ready' ? (
        <div className="mt-10 grid gap-8">
          <Leaderboard
            heading="Leaderboard"
            kicker="Games"
            more={{ to: '/', label: 'Tournament matches' }}
            scoring="A win is 1, a draw is 0.5. Elo starts at 1200."
            showElo
            standings={standings}
          />
          <GameChronicle games={games} />
        </div>
      ) : null}
    </section>
  )
}
