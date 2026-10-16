import { Show, useAuth } from '@clerk/react'
import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { buttonVariants } from '@/components/ui/button'
import { clubGet, clubPut } from '@/lib/club-api'
import { cn } from '@/lib/utils'

interface IAccount {
  id: number
  name: string
  surname: string
  chessCom: string | null
  elo: number
}

interface IAccountResponse {
  account: IAccount | null
}

interface IAccountFormValues {
  name: string
  surname: string
  chessCom: string
}

type AccountState =
  | { status: 'loading' }
  | { status: 'ready'; account: IAccount | null }
  | { status: 'error'; message: string }

interface IAccountFormProps {
  account: IAccount | null
  onSave: (values: IAccountFormValues) => Promise<string | null>
}

export function AccountsPage() {
  return (
    <main className="mx-auto max-w-5xl px-6 pb-20">
      <Show when="signed-out">
        <SignedOutNotice />
      </Show>
      <Show when="signed-in">
        <MyAccount />
      </Show>
    </main>
  )
}

function SignedOutNotice() {
  return (
    <section className="max-w-xl">
      <p className="text-xs font-bold tracking-[0.14em] text-secondary uppercase">Account</p>
      <h1 className="mt-3 text-5xl font-bold leading-tight tracking-normal">Sign in to save your account.</h1>
      <Link className={cn(buttonVariants({ size: 'lg' }), 'mt-7 hover:bg-secondary')} to="/sign-in">
        Sign in
      </Link>
    </section>
  )
}

function MyAccount() {
  const { getToken } = useAuth()
  const [account, setAccount] = useState<AccountState>({ status: 'loading' })

  useEffect(() => {
    let cancelled = false

    async function loadAccount() {
      try {
        const token = await getToken()
        if (!token) {
          throw new Error('Clerk has not issued a session token yet.')
        }

        const body = await clubGet<IAccountResponse>('/accounts/me', token)
        if (!cancelled) {
          setAccount({ status: 'ready', account: body.account })
        }
      } catch (error) {
        if (!cancelled) {
          const message = error instanceof Error ? error.message : 'Could not reach the club API.'
          setAccount({ status: 'error', message })
        }
      }
    }

    void loadAccount()

    return () => {
      cancelled = true
    }
  }, [getToken])

  async function saveAccount(values: IAccountFormValues): Promise<string | null> {
    try {
      const token = await getToken()
      if (!token) {
        return 'Clerk has not issued a session token yet.'
      }

      const saved = await clubPut<IAccount>('/accounts/me', token, {
        name: values.name,
        surname: values.surname,
        chessCom: values.chessCom.trim() || null,
      })
      setAccount({ status: 'ready', account: saved })
      return null
    } catch (error) {
      return error instanceof Error ? error.message : 'Could not save this account.'
    }
  }

  const saved = account.status === 'ready' ? account.account : null

  return (
    <section className="max-w-xl">
      <p className="text-xs font-bold tracking-[0.14em] text-secondary uppercase">
        {saved ? `Elo ${saved.elo}` : 'Your account'}
      </p>
      <h1 className="mt-3 text-5xl font-bold leading-tight tracking-normal">
        {saved ? 'Edit your account' : 'Add your account'}
      </h1>
      <p className="mt-4 text-lg text-muted-foreground">
        This is stored in the club database for the Clerk user who is signed in. Elo starts at 1200.
      </p>
      {account.status === 'loading' ? <p className="mt-6 text-muted-foreground">Loading your account…</p> : null}
      {account.status === 'error' ? <p className="mt-6 text-muted-foreground">{account.message}</p> : null}
      {account.status === 'ready' ? <AccountForm account={saved} onSave={saveAccount} /> : null}
    </section>
  )
}

function AccountForm(props: IAccountFormProps) {
  const { account, onSave } = props
  const [name, setName] = useState(account?.name ?? '')
  const [surname, setSurname] = useState(account?.surname ?? '')
  const [chessCom, setChessCom] = useState(account?.chessCom ?? '')
  const [message, setMessage] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaved(false)
    const nextMessage = await onSave({ name, surname, chessCom })
    setMessage(nextMessage)
    setSaved(nextMessage === null)
  }

  return (
    <form className="mt-8 grid max-w-md gap-3" onSubmit={(event) => void submit(event)}>
      <input
        aria-label="Name"
        className="h-9 rounded-lg border border-border bg-background px-3 text-foreground outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        onChange={(event) => setName(event.target.value)}
        placeholder="Name"
        value={name}
      />
      <input
        aria-label="Surname"
        className="h-9 rounded-lg border border-border bg-background px-3 text-foreground outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        onChange={(event) => setSurname(event.target.value)}
        placeholder="Surname"
        value={surname}
      />
      <input
        aria-label="Chess.com username"
        className="h-9 rounded-lg border border-border bg-background px-3 text-foreground outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        onChange={(event) => setChessCom(event.target.value)}
        placeholder="Chess.com"
        value={chessCom}
      />
      <button className={cn(buttonVariants({ size: 'lg' }), 'mt-2 w-fit hover:bg-secondary')} type="submit">
        {account ? 'Save changes' : 'Save account'}
      </button>
      {message ? <p className="text-secondary">{message}</p> : null}
      {saved ? <p className="text-muted-foreground">Saved.</p> : null}
    </form>
  )
}
