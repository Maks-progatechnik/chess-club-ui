import { Show } from '@clerk/react'
import { Link } from 'react-router-dom'
import { AccountForm } from '@/components/AccountForm'
import { MyGames } from '@/components/MyGames'
import { useClubAccount } from '@/lib/club-account'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

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
  const { state, saveAccount } = useClubAccount()
  const account = state.status === 'ready' ? state.account : null

  return (
    <>
      <section className="max-w-xl">
        <p className="text-xs font-bold tracking-[0.14em] text-secondary uppercase">
          {account ? `Elo ${account.elo}` : 'Your account'}
        </p>
        <h1 className="mt-3 text-5xl font-bold leading-tight tracking-normal">
          {account ? 'Edit your account' : 'Add your account'}
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">
          This is stored in the club database for the Clerk user who is signed in. Elo starts at 1200.
        </p>
        {state.status === 'loading' ? <p className="mt-6 text-muted-foreground">Loading your account…</p> : null}
        {state.status === 'error' ? <p className="mt-6 text-muted-foreground">{state.message}</p> : null}
        {state.status === 'ready' ? (
          <AccountForm
            onSave={saveAccount}
            submitLabel={account ? 'Save changes' : 'Save account'}
            values={{
              name: account?.name ?? '',
              surname: account?.surname ?? '',
              chessCom: account?.chessCom ?? '',
            }}
          />
        ) : null}
      </section>
      {account ? <MyGames accountId={account.id} /> : null}
    </>
  )
}
