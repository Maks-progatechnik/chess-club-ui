import { Show } from '@clerk/react'
import { Link } from 'react-router-dom'
import { DrawRound } from '@/components/DrawRound'
import { NextRound } from '@/components/NextRound'
import { buttonVariants } from '@/components/ui/button'
import { useClubBoard } from '@/lib/use-board'
import { cn } from '@/lib/utils'

export function DrawPage() {
  return (
    <main className="mx-auto max-w-5xl px-6 pb-20">
      <Show when="signed-out">
        <SignedOutNotice />
      </Show>
      <Show when="signed-in">
        <DrawBoard />
      </Show>
    </main>
  )
}

function SignedOutNotice() {
  return (
    <section className="max-w-xl">
      <p className="text-xs font-bold tracking-[0.14em] text-secondary uppercase">Draw</p>
      <h1 className="mt-3 text-5xl font-bold leading-tight tracking-normal">Sign in to see past draws.</h1>
      <Link className={cn(buttonVariants({ size: 'lg' }), 'mt-7 hover:bg-secondary')} to="/sign-in">
        Sign in
      </Link>
    </section>
  )
}

function DrawBoard() {
  const { board, roster, addGame, generateRound } = useClubBoard()

  return (
    <section>
      <p className="text-xs font-bold tracking-[0.14em] text-secondary uppercase">Past draws</p>
      <h1 className="mt-3 text-5xl font-bold leading-tight tracking-normal">Draw</h1>
      <p className="mt-4 max-w-2xl text-lg text-muted-foreground">
        A green check means the game is already shared. Two wins is one point. Two draws with no winner is half a point each.
      </p>
      {board.status === 'loading' ? <p className="mt-8 text-muted-foreground">Checking shared games…</p> : null}
      {board.status === 'error' ? <p className="mt-8 text-muted-foreground">{board.message}</p> : null}
      {board.status === 'ready' ? (
        <div className="mt-8">
          <NextRound drawCount={board.board.draws.length} onGenerate={generateRound} />
        </div>
      ) : null}
      {board.status === 'ready' && board.board.draws.length === 0 ? (
        <p className="mt-8 text-muted-foreground">No saved draws.</p>
      ) : null}
      {board.status === 'ready'
        ? board.board.draws.map((draw) => (
            <div className="mt-8" key={draw.id}>
              <DrawRound
                draw={draw}
                onAddGame={(game) => addGame(draw.id, game)}
                roster={roster}
              />
            </div>
          ))
        : null}
    </section>
  )
}
