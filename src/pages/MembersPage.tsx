import { Show, useAuth } from '@clerk/react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { clubGet } from '@/lib/club-api'
import { buttonVariants } from '@/components/ui/button'
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

type MembersState =
  | { status: 'loading' }
  | { status: 'ready'; currentUserId: string; members: IMember[] }
  | { status: 'error'; message: string }

interface IMemberListProps {
  currentUserId: string
  members: IMember[]
}

interface IMemberRowProps {
  isCurrentUser: boolean
  member: IMember
}

export function MembersPage() {
  return (
    <main className="mx-auto max-w-5xl px-6 pb-20">
      <Show when="signed-out">
        <SignedOutNotice />
      </Show>
      <Show when="signed-in">
        <MembersRoster />
      </Show>
    </main>
  )
}

function SignedOutNotice() {
  return (
    <section className="max-w-xl">
      <p className="text-xs font-bold tracking-[0.14em] text-secondary uppercase">Members</p>
      <h1 className="mt-3 text-5xl font-bold leading-tight tracking-normal">Sign in to see the club.</h1>
      <Link className={cn(buttonVariants({ size: 'lg' }), 'mt-7 hover:bg-secondary')} to="/sign-in">
        Sign in
      </Link>
    </section>
  )
}

function MembersRoster() {
  const { getToken, userId } = useAuth()
  const [members, setMembers] = useState<MembersState>({ status: 'loading' })

  useEffect(() => {
    let cancelled = false

    async function loadMembers() {
      try {
        const token = await getToken()
        if (!token || !userId) {
          throw new Error('Clerk has not issued a session token yet.')
        }

        const body = await clubGet<IMembersResponse>('/members', token)
        if (!Array.isArray(body.members)) {
          throw new Error('The club API returned an unexpected member list.')
        }

        if (!cancelled) {
          setMembers({ status: 'ready', currentUserId: userId, members: body.members })
        }
      } catch (error) {
        if (!cancelled) {
          const message = error instanceof Error ? error.message : 'Could not reach the club API.'
          setMembers({ status: 'error', message })
        }
      }
    }

    void loadMembers()

    return () => {
      cancelled = true
    }
  }, [getToken, userId])

  const count =
    members.status === 'ready'
      ? members.members.length === 1
        ? '1 member'
        : `${members.members.length} members`
      : 'Members'

  return (
    <section>
      <p className="text-xs font-bold tracking-[0.14em] text-secondary uppercase">{count}</p>
      <h1 className="mt-3 text-5xl font-bold leading-tight tracking-normal">Members</h1>
      {members.status === 'loading' ? <p className="mt-6 text-muted-foreground">Loading the club…</p> : null}
      {members.status === 'error' ? <p className="mt-6 text-muted-foreground">{members.message}</p> : null}
      {members.status === 'ready' ? (
        <MemberList currentUserId={members.currentUserId} members={members.members} />
      ) : null}
    </section>
  )
}

function MemberList(props: IMemberListProps) {
  const { currentUserId, members } = props

  return (
    <ul className="mt-8 border-t">
      {members.map((member) => (
        <MemberRow isCurrentUser={member.id === currentUserId} key={member.id} member={member} />
      ))}
    </ul>
  )
}

function MemberRow(props: IMemberRowProps) {
  const { isCurrentUser, member } = props
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
