import { Show, useAuth, useUser } from '@clerk/react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { buttonVariants } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'

interface IMember {
  id: string
  name: string
  email: string | null
  imageUrl: string
  joinedAt: string
}

interface IMembersResponse {
  members: IMember[]
}

interface IApiError {
  error?: string
}

type ClubHomeState =
  | { status: 'loading' }
  | { status: 'ready'; member: IMember; members: IMember[] }
  | { status: 'error'; message: string }

interface IMemberListProps {
  members: IMember[]
  currentUserId: string
}

interface IMemberRowProps {
  member: IMember
  isCurrentUser: boolean
}

interface IClubRosterProps {
  home: ClubHomeState
}

const apiUrl = import.meta.env.VITE_API_URL ?? '/api'

export function HomePage() {
  return (
    <main className="mx-auto max-w-3xl px-6 pb-20">
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
      <p className="mt-4 text-lg text-muted-foreground">Sign in to see who's already at the club.</p>
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
  const { getToken } = useAuth()
  const [home, setHome] = useState<ClubHomeState>({ status: 'loading' })
  const fallbackName = user?.fullName || user?.username || 'member'
  const name = home.status === 'ready' ? home.member.name : fallbackName

  useEffect(() => {
    let cancelled = false

    async function loadHome() {
      try {
        const token = await getToken()
        if (!token) {
          throw new Error('Clerk has not issued a session token yet.')
        }

        const headers = { Authorization: `Bearer ${token}` }
        const [meResponse, membersResponse] = await Promise.all([
          fetch(`${apiUrl}/me`, { headers }),
          fetch(`${apiUrl}/members`, { headers }),
        ])

        if (!meResponse.ok || !membersResponse.ok) {
          const failed = meResponse.ok ? membersResponse : meResponse
          const errorBody = (await failed.json()) as IApiError
          throw new Error(errorBody.error ?? 'The club API did not accept this session.')
        }

        const member = (await meResponse.json()) as IMember
        const membersBody = (await membersResponse.json()) as IMembersResponse
        if (!member.id || !Array.isArray(membersBody.members)) {
          throw new Error('The club API returned an unexpected member list.')
        }

        if (!cancelled) {
          setHome({ status: 'ready', member, members: membersBody.members })
        }
      } catch (error) {
        if (!cancelled) {
          const message =
            error instanceof Error ? error.message : 'Could not reach the club API.'
          setHome({ status: 'error', message })
        }
      }
    }

    void loadHome()

    return () => {
      cancelled = true
    }
  }, [getToken])

  return (
    <section className="max-w-xl">
      <p className="text-xs font-bold tracking-[0.14em] text-secondary uppercase">Signed in</p>
      <h1 className="mt-3 text-5xl font-bold leading-tight tracking-normal">Welcome back, {name}.</h1>
      <ClubRoster home={home} />
    </section>
  )
}

function ClubRoster(props: IClubRosterProps) {
  const { home } = props

  if (home.status === 'loading') {
    return <p className="mt-6 text-muted-foreground">Loading the club…</p>
  }

  if (home.status === 'error') {
    return <p className="mt-6 text-muted-foreground">{home.message}</p>
  }

  const countLabel = home.members.length === 1 ? '1 member' : `${home.members.length} members`

  return (
    <>
      <p className="mt-4 text-lg text-muted-foreground">{countLabel} so far.</p>
      <MemberList currentUserId={home.member.id} members={home.members} />
    </>
  )
}

function MemberList(props: IMemberListProps) {
  const { members, currentUserId } = props

  return (
    <ul className="mt-8 border-t">
      {members.map((member) => (
        <MemberRow isCurrentUser={member.id === currentUserId} key={member.id} member={member} />
      ))}
    </ul>
  )
}

function MemberRow(props: IMemberRowProps) {
  const { member, isCurrentUser } = props
  const joined = new Date(member.joinedAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })

  return (
    <li className="flex items-center gap-3 border-b py-3.5">
      <Avatar className="size-11">
        <AvatarImage alt="" src={member.imageUrl} />
        <AvatarFallback>{member.name.slice(0, 1)}</AvatarFallback>
      </Avatar>
      <div>
        <p className="font-bold">
          {member.name}
          {isCurrentUser ? (
            <span className="ml-2 text-xs tracking-[0.12em] text-secondary uppercase">You</span>
          ) : null}
        </p>
        {member.email && member.email !== member.name ? (
          <p className="text-sm text-muted-foreground">{member.email}</p>
        ) : null}
        <p className="text-sm text-muted-foreground">Joined {joined}</p>
      </div>
    </li>
  )
}
