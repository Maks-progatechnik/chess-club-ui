import { useUser } from '@clerk/react'
import { useEffect } from 'react'
import type { ReactNode } from 'react'
import { AccountForm } from '@/components/AccountForm'
import type { IAccountFormValues } from '@/components/AccountForm'
import { useClubAccount } from '@/lib/club-account'

export function AccountSetup() {
  const { state, saveAccount } = useClubAccount()
  const showForm = state.status === 'ready' && !state.account

  if (!showForm) {
    return null
  }

  return (
    <SetupDialog>
      <InitForm onSave={saveAccount} />
    </SetupDialog>
  )
}

interface ISetupDialogProps {
  children: ReactNode
}

function SetupDialog(props: ISetupDialogProps) {
  const { children } = props

  useEffect(() => {
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previous
    }
  }, [])

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-foreground/40 p-4">
      <div
        aria-labelledby="account-setup-title"
        aria-modal="true"
        className="max-h-[min(40rem,calc(100%-2rem))] w-full max-w-3xl overflow-y-auto rounded-lg border border-border bg-background p-6 text-foreground"
        role="dialog"
      >
        {children}
      </div>
    </div>
  )
}

interface IInitFormProps {
  onSave: (values: IAccountFormValues) => Promise<string | null>
}

function InitForm(props: IInitFormProps) {
  const { onSave } = props
  const { user } = useUser()

  return (
    <section className="max-w-xl">
      <p className="text-xs font-bold tracking-[0.14em] text-secondary uppercase">Your account</p>
      <h2 className="mt-3 text-4xl font-bold leading-tight tracking-normal" id="account-setup-title">
        Add your account
      </h2>
      <p className="mt-4 text-lg text-muted-foreground">
        This is stored for the Clerk user who is signed in. Elo starts at 1200.
      </p>
      <AccountForm
        autoFocus
        onSave={onSave}
        submitLabel="Save account"
        values={{
          name: user?.firstName ?? '',
          surname: user?.lastName ?? '',
          chessCom: '',
        }}
      />
    </section>
  )
}
