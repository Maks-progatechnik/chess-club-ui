import { Show, useAuth } from '@clerk/react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { buttonVariants } from '@/components/ui/button'
import { clubGet } from '@/lib/club-api'
import { cn } from '@/lib/utils'

interface IAccount {
  id: number
  name: string
  surname: string
  chessCom: string | null
  elo: number
}

interface IAccountsResponse {
  accounts: IAccount[]
}

type MembersState =
  | { status: 'loading' }
  | { status: 'ready'; accounts: IAccount[] }
  | { status: 'error'; message: string }

interface IAccountListProps {
  accounts: IAccount[]
}

interface IAccountRowProps {
  account: IAccount
}

export function MembersPage() {
  return (
    <main className="mx-auto max-w-5xl px-6 pb-20">
      <Show when="signed-out">
        <SignedOutNotice />
      </Show>
      <Show when="signed-in">
        <AccountRoster />
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

function AccountRoster() {
  const { getToken } = useAuth()
  const [members, setMembers] = useState<MembersState>({ status: 'loading' })

  useEffect(() => {
    let cancelled = false

    async function loadAccounts() {
      try {
        const token = await getToken()
        if (!token) {
          throw new Error('Clerk has not issued a session token yet.')
        }

        const body = await clubGet<IAccountsResponse>('/accounts', token)
        if (!Array.isArray(body.accounts)) {
          throw new Error('The club API returned an unexpected account list.')
        }

        if (!cancelled) {
          setMembers({ status: 'ready', accounts: body.accounts })
        }
      } catch (error) {
        if (!cancelled) {
          const message = error instanceof Error ? error.message : 'Could not reach the club API.'
          setMembers({ status: 'error', message })
        }
      }
    }

    void loadAccounts()

    return () => {
      cancelled = true
    }
  }, [getToken])

  const count =
    members.status === 'ready'
      ? members.accounts.length === 1
        ? '1 account'
        : `${members.accounts.length} accounts`
      : 'Members'

  return (
    <section>
      <p className="text-xs font-bold tracking-[0.14em] text-secondary uppercase">{count}</p>
      <h1 className="mt-3 text-5xl font-bold leading-tight tracking-normal">Members</h1>
      {members.status === 'loading' ? <p className="mt-6 text-muted-foreground">Loading accounts…</p> : null}
      {members.status === 'error' ? <p className="mt-6 text-muted-foreground">{members.message}</p> : null}
      {members.status === 'ready' ? <AccountList accounts={members.accounts} /> : null}
    </section>
  )
}

function AccountList(props: IAccountListProps) {
  const { accounts } = props

  if (accounts.length === 0) {
    return <p className="mt-8 text-muted-foreground">No accounts yet.</p>
  }

  return (
    <ul className="mt-8 border-t">
      {accounts.map((account) => (
        <AccountRow account={account} key={account.id} />
      ))}
    </ul>
  )
}

function AccountRow(props: IAccountRowProps) {
  const { account } = props

  return (
    <li className="flex items-center justify-between gap-4 border-b py-3.5">
      <div>
        <p className="font-bold">
          {account.name} {account.surname}
        </p>
        {account.chessCom ? (
          <a
            className="text-sm text-secondary underline underline-offset-4"
            href={`https://www.chess.com/member/${account.chessCom}`}
            rel="noreferrer"
            target="_blank"
          >
            {account.chessCom}
          </a>
        ) : (
          <p className="text-sm text-muted-foreground">No Chess.com account</p>
        )}
      </div>
      <p className="text-sm text-muted-foreground">Elo {account.elo}</p>
    </li>
  )
}
