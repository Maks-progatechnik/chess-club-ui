import { Show, useAuth } from '@clerk/react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useClubAccount } from '@/lib/club-account'
import { buttonVariants } from '@/components/ui/button'
import { isClubBoard } from '@/lib/board'
import type { IGameStanding } from '@/lib/board'
import { clubGet } from '@/lib/club-api'
import { playerPath } from '@/lib/players'
import { cn } from '@/lib/utils'

interface IAccount {
  id: number
  name: string
  surname: string
  chessCom: string | null
  signupName: string | null
}

interface IAccountsResponse {
  accounts: IAccount[]
}

type MembersState =
  | { status: 'loading' }
  | { status: 'ready'; accounts: IAccount[]; standings: IGameStanding[] }
  | { status: 'error'; message: string }

interface IAccountListProps {
  accounts: IAccount[]
  standings: IGameStanding[]
}

interface IAccountRowProps {
  account: IAccount
  elo: number
}

export function MembersPage() {
  return (
    <main className="mx-auto max-w-5xl px-6 pb-20">
      <Show when="signed-out">
        <SignedOutNotice />
      </Show>
      <Show when="signed-in">
        <MemberLists />
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

function MemberLists() {
  return <AccountRoster />
}

function AccountRoster() {
  const { getToken } = useAuth()
  const { state } = useClubAccount()
  const accountId = state.status === 'ready' ? (state.account?.id ?? 0) : -1
  const [members, setMembers] = useState<MembersState>({ status: 'loading' })

  useEffect(() => {
    let cancelled = false

    async function loadAccounts() {
      try {
        const token = await getToken()
        if (!token) {
          throw new Error('Clerk has not issued a session token yet.')
        }

        const [body, board] = await Promise.all([
          clubGet<IAccountsResponse>('/accounts', token),
          clubGet<unknown>('/board', token),
        ])
        if (!Array.isArray(body.accounts)) {
          throw new Error('The club API returned an unexpected account list.')
        }
        const standings = isClubBoard(board) && Array.isArray(board.gameStandings) ? board.gameStandings : []

        if (!cancelled) {
          setMembers({ status: 'ready', accounts: body.accounts, standings })
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
  }, [accountId, getToken])

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
      {members.status === 'ready' ? <AccountList accounts={members.accounts} standings={members.standings} /> : null}
    </section>
  )
}

function AccountList(props: IAccountListProps) {
  const { accounts, standings } = props

  if (accounts.length === 0) {
    return <p className="mt-8 text-muted-foreground">No accounts yet.</p>
  }

  return (
    <ul className="mt-8 border-t">
      {accounts.map((account) => (
        <AccountRow account={account} elo={domesticElo(account, standings)} key={account.id} />
      ))}
    </ul>
  )
}

function AccountRow(props: IAccountRowProps) {
  const { account, elo } = props

  return (
    <li className="flex items-center justify-between gap-4 border-b py-3.5">
      <div>
        <p className="font-bold">
          <Link className="underline-offset-4 hover:text-secondary hover:underline" to={playerPath(`${account.name} ${account.surname}`)}>
            {account.name} {account.surname}
          </Link>
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
      <p className="text-sm text-muted-foreground" title="Domestic Elo from shared games">
        Elo {elo}
      </p>
    </li>
  )
}

const DOMESTIC_START = 1200

function domesticElo(account: IAccount, standings: IGameStanding[]): number {
  const names = [account.signupName, `${account.name} ${account.surname}`]
  for (const name of names) {
    const key = name?.trim().toLowerCase()
    if (!key) {
      continue
    }
    const standing = standings.find((row) => row.name.trim().toLowerCase() === key)
    if (standing) {
      return standing.elo
    }
  }
  return DOMESTIC_START
}
