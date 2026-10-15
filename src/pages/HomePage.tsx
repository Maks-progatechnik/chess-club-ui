import { Show, useAuth, useUser } from '@clerk/react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

interface IClubSession {
  userId: string
}

interface IApiError {
  error?: string
}

type ClubSessionState =
  | { status: 'loading' }
  | { status: 'ready' }
  | { status: 'error'; message: string }

const apiUrl = import.meta.env.VITE_API_URL ?? '/api'

export function HomePage() {
  return (
    <main className="home">
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
    <section className="hero">
      <p className="eyebrow">Members only</p>
      <h1>A quiet place to play.</h1>
      <p className="lede">
        Sign in to see the club board. Games, nights, and pairings come next.
      </p>
      <div className="hero-actions">
        <Link className="button" to="/sign-up">
          Join the club
        </Link>
        <Link to="/sign-in">I already have an account</Link>
      </div>
    </section>
  )
}

function SignedInHome() {
  const { user } = useUser()
  const { getToken } = useAuth()
  const [session, setSession] = useState<ClubSessionState>({ status: 'loading' })
  const name = user?.fullName || user?.username || 'member'

  useEffect(() => {
    let cancelled = false

    async function loadSession() {
      try {
        const token = await getToken()
        if (!token) {
          throw new Error('Clerk has not issued a session token yet.')
        }

        const response = await fetch(`${apiUrl}/me`, {
          headers: { Authorization: `Bearer ${token}` },
        })

        if (!response.ok) {
          const errorBody = (await response.json()) as IApiError
          throw new Error(errorBody.error ?? 'The club API did not accept this session.')
        }

        const body = (await response.json()) as IClubSession
        if (!body.userId) {
          throw new Error('The club API returned an unexpected session.')
        }

        if (!cancelled) {
          setSession({ status: 'ready' })
        }
      } catch (error) {
        if (!cancelled) {
          const message =
            error instanceof Error ? error.message : 'Could not reach the club API.'
          setSession({ status: 'error', message })
        }
      }
    }

    void loadSession()

    return () => {
      cancelled = true
    }
  }, [getToken])

  return (
    <section className="hero">
      <p className="eyebrow">Signed in</p>
      <h1>Welcome back, {name}.</h1>
      <p className="lede">Your seat is saved. The club board is the next piece.</p>
      <SessionStatus session={session} />
    </section>
  )
}

interface ISessionStatusProps {
  session: ClubSessionState
}

function SessionStatus(props: ISessionStatusProps) {
  const { session } = props

  if (session.status === 'loading') {
    return <p className="session-note">Checking the club API…</p>
  }

  if (session.status === 'error') {
    return <p className="session-note">{session.message}</p>
  }

  return <p className="session-note">Club API accepted your session.</p>
}
