import { useAuth } from '@clerk/react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { buttonVariants } from '@/components/ui/button'
import { clubDelete, clubGet, clubPost } from '@/lib/club-api'
import { useClubAccount } from '@/lib/club-account'
import { playerPath } from '@/lib/players'
import { cn } from '@/lib/utils'

export interface IDummyUser {
  name: string
  chessCom: string | null
  timeControl: string | null
  claimed: boolean
  mine: boolean
}

interface IDummiesResponse {
  dummies: IDummyUser[]
}

type DummiesState =
  | { status: 'loading' }
  | { status: 'ready'; dummies: IDummyUser[] }
  | { status: 'error'; message: string }

interface IDummyUsersProps {
  canClaim: boolean
  compact?: boolean
  titleId?: string
  onClaimed?: () => void
  onMatched?: (matched: boolean) => void
}

interface IDummyTableProps {
  dummies: IDummyUser[]
  canClaim: boolean
  compact: boolean
  pendingName: string | null
  onClaim: (name: string) => void
  onDelete: (name: string) => void
}

interface IDummyRowProps {
  dummy: IDummyUser
  showClaim: boolean
  showDelete: boolean
  pending: boolean
  onClaim: (name: string) => void
  onDelete: (name: string) => void
}

export function DummyUsers(props: IDummyUsersProps) {
  const { canClaim, compact = false, titleId, onClaimed, onMatched } = props
  const { getToken } = useAuth()
  const { claimVersion, noteClaimed } = useClubAccount()
  const [dummies, setDummies] = useState<DummiesState>({ status: 'loading' })
  const [pendingName, setPendingName] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function loadDummies() {
      try {
        const token = await getToken()
        if (!token) {
          throw new Error('Clerk has not issued a session token yet.')
        }

        const body = await clubGet<IDummiesResponse>('/dummies', token)
        if (!Array.isArray(body.dummies)) {
          throw new Error('The club API returned an unexpected signup list.')
        }

        if (!cancelled) {
          setDummies({ status: 'ready', dummies: body.dummies })
          onMatched?.(body.dummies.some((dummy) => dummy.mine))
        }
      } catch (error) {
        if (!cancelled) {
          const nextMessage = error instanceof Error ? error.message : 'Could not reach the club API.'
          setDummies({ status: 'error', message: nextMessage })
          onMatched?.(false)
        }
      }
    }

    void loadDummies()

    return () => {
      cancelled = true
    }
  }, [claimVersion, getToken, onMatched])

  async function claim(name: string) {
    setMessage(null)
    setPendingName(name)
    try {
      const token = await getToken()
      if (!token) {
        setMessage('Clerk has not issued a session token yet.')
        return
      }

      const saved = await clubPost<IDummyUser>('/dummies/claim', token, { name })
      setDummies((current) => {
        if (current.status !== 'ready') {
          return current
        }
        return {
          status: 'ready',
          dummies: current.dummies.map((dummy) => (dummy.name === saved.name ? saved : { ...dummy, mine: false })),
        }
      })
      noteClaimed()
      onClaimed?.()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not mark that player.')
    } finally {
      setPendingName(null)
    }
  }

  async function remove(name: string) {
    setMessage(null)
    setPendingName(name)
    try {
      const token = await getToken()
      if (!token) {
        setMessage('Clerk has not issued a session token yet.')
        return
      }

      await clubDelete<{ name: string }>('/dummies', token, { name })
      setDummies((current) => {
        if (current.status !== 'ready') {
          return current
        }
        return {
          status: 'ready',
          dummies: current.dummies.filter((dummy) => dummy.name.toLowerCase() !== name.toLowerCase()),
        }
      })
      noteClaimed()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not delete that player.')
    } finally {
      setPendingName(null)
    }
  }

  const rows = dummies.status === 'ready' ? sortDummies(dummies.dummies) : []
  const matched = rows.some((dummy) => dummy.mine)
  const allClaimed = rows.length > 0 && rows.every((dummy) => dummy.claimed)
  const count = dummies.status === 'ready' ? (rows.length === 1 ? '1 player' : `${rows.length} players`) : 'Signup sheet'

  if (!compact && dummies.status === 'ready' && allClaimed) {
    return null
  }

  return (
    <section className={compact ? '' : 'mt-16 border-t pt-10'}>
      <p className="text-xs font-bold tracking-[0.14em] text-secondary uppercase">{count}</p>
      <h2 className="mt-3 text-3xl font-bold tracking-normal" id={titleId}>
        Dummy users
      </h2>
      <p className="mt-2 max-w-2xl text-muted-foreground">
        {compact && matched
          ? 'This row matches your account. Confirm if that is you.'
          : 'The signup sheet. Mark the row that is you.'}
      </p>
      {dummies.status === 'loading' ? <p className="mt-6 text-muted-foreground">Loading the signup sheet…</p> : null}
      {dummies.status === 'error' ? <p className="mt-6 text-muted-foreground">{dummies.message}</p> : null}
      {dummies.status === 'ready' && compact && allClaimed && !matched ? (
        <p className="mt-4 text-muted-foreground">Everyone on the signup sheet already has an account.</p>
      ) : null}
      {dummies.status === 'ready' && (!allClaimed || (compact && matched)) ? (
        <DummyTable
          canClaim={canClaim}
          compact={compact}
          dummies={rows}
          onClaim={(name) => void claim(name)}
          onDelete={(name) => void remove(name)}
          pendingName={pendingName}
        />
      ) : null}
      {message ? <p className="mt-3 text-secondary">{message}</p> : null}
    </section>
  )
}

function sortDummies(dummies: IDummyUser[]): IDummyUser[] {
  return [...dummies].sort((left, right) => dummyRank(left) - dummyRank(right) || left.name.localeCompare(right.name))
}

function dummyRank(dummy: IDummyUser): number {
  if (dummy.mine) {
    return 0
  }
  if (dummy.claimed) {
    return 1
  }
  return 2
}

function DummyTable(props: IDummyTableProps) {
  const { dummies, canClaim, compact, pendingName, onClaim, onDelete } = props
  const mine = dummies.some((dummy) => dummy.mine)

  if (dummies.length === 0) {
    return <p className="mt-4 text-muted-foreground">No one on the signup sheet.</p>
  }

  return (
    <div
      className={cn(
        'mt-4 max-w-full overflow-x-auto overflow-y-hidden',
        compact && 'max-h-80 overflow-y-auto',
      )}
    >
      <table className="w-full text-left">
        <thead>
          <tr className="border-b text-xs tracking-[0.14em] text-secondary uppercase">
            <th className="py-3 pr-4 font-bold">Name</th>
            <th className="py-3 pr-4 font-bold">Chess.com</th>
            <th className="py-3 font-bold">
              <span className="sr-only">Mark</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {dummies.map((dummy) => (
            <DummyRow
              dummy={dummy}
              key={dummy.name}
              onClaim={onClaim}
              onDelete={onDelete}
              pending={pendingName === dummy.name}
              showClaim={canClaim && !mine && !dummy.claimed}
              showDelete={!compact}
            />
          ))}
        </tbody>
      </table>
    </div>
  )
}

function DummyRow(props: IDummyRowProps) {
  const { dummy, showClaim, showDelete, pending, onClaim, onDelete } = props

  return (
    <tr className="border-b align-middle">
      <td className="py-3 pr-4 font-bold">
        <Link className="underline-offset-4 hover:text-secondary hover:underline" to={playerPath(dummy.name)}>
          {dummy.name}
        </Link>
      </td>
      <td className="py-3 pr-4">
        {dummy.chessCom ? (
          <a
            className="text-secondary underline underline-offset-4"
            href={`https://www.chess.com/member/${dummy.chessCom}`}
            rel="noreferrer"
            target="_blank"
          >
            {dummy.chessCom}
          </a>
        ) : (
          <span className="text-muted-foreground">—</span>
        )}
      </td>
      <td className="py-3 text-right">
        <div className="flex items-center justify-end gap-3">
          {showDelete ? <DeleteDummy disabled={pending} name={dummy.name} onDelete={onDelete} /> : null}
          <ClaimMark dummy={dummy} onClaim={onClaim} pending={pending} showClaim={showClaim} />
        </div>
      </td>
    </tr>
  )
}

interface IDeleteDummyProps {
  name: string
  disabled: boolean
  onDelete: (name: string) => void
}

function DeleteDummy(props: IDeleteDummyProps) {
  const { name, disabled, onDelete } = props
  const [confirming, setConfirming] = useState(false)

  if (!confirming) {
    return (
      <button
        className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}
        disabled={disabled}
        onClick={() => setConfirming(true)}
        type="button"
      >
        Delete
      </button>
    )
  }

  return (
    <span className="inline-flex items-center gap-2">
      <button
        className={cn(buttonVariants({ variant: 'destructive', size: 'sm' }))}
        disabled={disabled}
        onClick={() => onDelete(name)}
        type="button"
      >
        Remove
      </button>
      <button
        className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }))}
        disabled={disabled}
        onClick={() => setConfirming(false)}
        type="button"
      >
        Keep
      </button>
    </span>
  )
}

interface IClaimMarkProps {
  dummy: IDummyUser
  showClaim: boolean
  pending: boolean
  onClaim: (name: string) => void
}

function ClaimMark(props: IClaimMarkProps) {
  const { dummy, showClaim, pending, onClaim } = props

  if (dummy.mine) {
    return <span className="text-xs font-bold tracking-[0.14em] text-secondary uppercase">You</span>
  }

  if (dummy.claimed) {
    return <span className="text-sm text-muted-foreground">Claimed</span>
  }

  if (!showClaim) {
    return <span className="text-sm text-muted-foreground">Open</span>
  }

  return (
    <button
      className={cn(buttonVariants({ size: 'sm' }), 'hover:bg-secondary')}
      disabled={pending}
      onClick={() => onClaim(dummy.name)}
      type="button"
    >
      This is me
    </button>
  )
}
