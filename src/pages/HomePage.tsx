import { Show, useAuth, useUser } from '@clerk/react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { buttonVariants } from '@/components/ui/button'
import { clubGet, clubPost } from '@/lib/club-api'
import { cn } from '@/lib/utils'
import { PairSection } from '@/pages/DrawPage'
import type { IDrawnPairs, IPairGame, ISignupPlayer } from '@/pages/DrawPage'

interface ISavedDraw {
  id: number
  createdAt: string
  result: IDrawnPairs
}

interface IDrawsResponse {
  draws: ISavedDraw[]
}

type LatestState =
  | { status: 'loading' }
  | { status: 'ready'; draw: ISavedDraw | null }
  | { status: 'error'; message: string }

interface IDummiesResponse {
  dummies: ISignupPlayer[]
}

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
      <p className="mt-4 text-lg text-muted-foreground">Sign in to see the club and the latest draw.</p>
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

  return (
    <section>
      <p className="text-xs font-bold tracking-[0.14em] text-secondary uppercase">Signed in</p>
      <h1 className="mt-3 text-5xl font-bold leading-tight tracking-normal">Welcome back, {name}.</h1>
      <LatestDraw />
    </section>
  )
}

function LatestDraw() {
  const { getToken } = useAuth()
  const [state, setState] = useState<LatestState>({ status: 'loading' })
  const [roster, setRoster] = useState<ISignupPlayer[]>([])

  useEffect(() => {
    let cancelled = false

    async function loadDraw() {
      try {
        const token = await getToken()
        if (!token) {
          throw new Error('Clerk has not issued a session token yet.')
        }
        const body = await clubGet<IDrawsResponse>('/draws', token)
        if (!Array.isArray(body.draws)) {
          throw new Error('The club API returned an unexpected draw.')
        }
        const sheet = await clubGet<IDummiesResponse>('/dummies', token)
        if (!cancelled) {
          setRoster(Array.isArray(sheet.dummies) ? sheet.dummies : [])
          setState({ status: 'ready', draw: body.draws[0] ?? null })
        }
      } catch (error) {
        if (!cancelled) {
          const message = error instanceof Error ? error.message : 'Could not reach the club API.'
          setState({ status: 'error', message })
        }
      }
    }

    void loadDraw()

    return () => {
      cancelled = true
    }
  }, [getToken])

  async function addGame(game: IPairGame): Promise<string | null> {
    if (state.status !== 'ready' || !state.draw) {
      return 'The draw is still loading.'
    }
    const drawId = state.draw.id

    try {
      const token = await getToken()
      if (!token) {
        return 'Clerk has not issued a session token yet.'
      }

      const saved = await clubPost<ISavedDraw>(`/draws/${drawId}/games`, token, {
        group: game.group,
        white: game.pairing.white,
        black: game.pairing.black,
        url: game.url,
      })
      setState({ status: 'ready', draw: saved })
      return null
    } catch (error) {
      return error instanceof Error ? error.message : 'Could not save this game.'
    }
  }

  return (
    <div className="mt-10">
      {state.status === 'loading' ? <p className="text-muted-foreground">Loading the draw…</p> : null}
      {state.status === 'error' ? <p className="text-muted-foreground">{state.message}</p> : null}
      {state.status === 'ready' && !state.draw ? (
        <p className="text-muted-foreground">No draw yet.</p>
      ) : null}
      {state.status === 'ready' && state.draw ? (
        <>
          <p className="text-xs font-bold tracking-[0.14em] text-secondary uppercase">
            {formatSavedAt(state.draw.createdAt)}
          </p>
          <h2 className="mt-4 text-3xl font-bold tracking-normal">Pairs</h2>
          <PairSection onAddGame={addGame} result={state.draw.result} roster={roster} />
        </>
      ) : null}
    </div>
  )
}

function formatSavedAt(value: string): string {
  return new Date(value).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}
