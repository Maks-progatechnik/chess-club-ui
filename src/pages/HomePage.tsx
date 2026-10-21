import { Show, useUser } from '@clerk/react'
import { Link } from 'react-router-dom'
import { Achievements } from '@/components/Achievements'
import { ClubStats } from '@/components/ClubStats'
import { DrawRound } from '@/components/DrawRound'
import { Leaderboard } from '@/components/Leaderboard'
import { buttonVariants } from '@/components/ui/button'
import { useClubBoard } from '@/lib/use-board'
import { cn } from '@/lib/utils'

export function HomePage() {
  return (
    <main className="mx-auto max-w-5xl px-6 pb-20">
      <Show when="signed-out">
        <SignedOutHome />
      </Show>
      <Show when="signed-in">
        <SignedInHome />
      </Show>
    </main>
  )
}

function SignedOutHome() {
  return (
    <section className="max-w-xl">
      <p className="text-xs font-bold tracking-[0.14em] text-secondary uppercase">Members only</p>
      <h1 className="mt-3 text-5xl font-bold leading-tight tracking-normal">A quiet place to play.</h1>
      <p className="mt-4 text-lg text-muted-foreground">Sign in to see the club, the latest draw, and the standings.</p>
      <div className="mt-7 flex flex-wrap items-center gap-5">
        <Link className={cn(buttonVariants({ size: 'lg' }), 'hover:bg-secondary')} to="/sign-up">
          Join the club
        </Link>
        <Link className="font-semibold text-secondary underline underline-offset-4" to="/sign-in">
          I already have an account
        </Link>
      </div>
    </section>
  )
}

function SignedInHome() {
  const { user } = useUser()
  const name = user?.fullName || user?.username || 'member'
  const { board, roster, addGame } = useClubBoard()
  const latest = board.status === 'ready' ? (board.board.draws[0] ?? null) : null

  return (
    <section>
      <p className="text-xs font-bold tracking-[0.14em] text-secondary uppercase">Signed in</p>
      <h1 className="mt-3 text-5xl font-bold leading-tight tracking-normal">Welcome back, {name}.</h1>
      {board.status === 'loading' ? <p className="mt-8 text-muted-foreground">Checking shared games…</p> : null}
      {board.status === 'error' ? <p className="mt-8 text-muted-foreground">{board.message}</p> : null}
      {board.status === 'ready' ? (
        <div className="mt-10 grid items-start gap-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
          <Leaderboard standings={board.board.standings} />
          <div className="grid gap-4">
            {latest ? (
              <DrawRound
                collapsible
                compactMatches
                defaultOpen
                draw={latest}
                onAddGame={(game) => addGame(latest.id, game)}
                roster={roster}
              />
            ) : (
              <p className="text-muted-foreground">No draw yet.</p>
            )}
          </div>
        </div>
      ) : null}
      {board.status === 'ready' && board.board.stats ? (
        <div className="mt-8">
          <ClubStats stats={board.board.stats} />
        </div>
      ) : null}
      {board.status === 'ready' && board.board.achievements ? (
        <div className="mt-8">
          <Achievements achievements={board.board.achievements} />
        </div>
      ) : null}
    </section>
  )
}
