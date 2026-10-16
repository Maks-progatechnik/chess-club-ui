import { useUser } from '@clerk/react'
import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { AccountForm } from '@/components/AccountForm'
import type { IAccountFormValues } from '@/components/AccountForm'
import { useClubAccount } from '@/lib/club-account'
import { DummyUsers } from '@/components/DummyUsers'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export function AccountSetup() {
  const { state, saveAccount } = useClubAccount()
  const [marking, setMarking] = useState(false)
  const account = state.status === 'ready' ? state.account : null
  const showForm = state.status === 'ready' && !account
  const showSheet = Boolean(account) && marking

  if (!showForm && !showSheet) {
    return null
  }

  return (
    <SetupDialog>
      {showForm ? (
        <InitForm
          onSave={async (values) => {
            const message = await saveAccount(values)
            if (!message) {
              setMarking(true)
            }
            return message
          }}
        />
      ) : (
        <MarkSheet onDone={() => setMarking(false)} />
      )}
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

interface IMarkSheetProps {
  onDone: () => void
}

function MarkSheet(props: IMarkSheetProps) {
  const { onDone } = props
  const [matched, setMatched] = useState(false)

  return (
    <section>
      <DummyUsers canClaim compact onClaimed={onDone} onMatched={setMatched} titleId="account-setup-title" />
      <div className="mt-6 flex flex-wrap gap-3">
        {matched ? (
          <button className={cn(buttonVariants({ size: 'lg' }), 'hover:bg-secondary')} onClick={onDone} type="button">
            Confirm
          </button>
        ) : null}
        <button className={cn(buttonVariants({ size: 'lg', variant: 'outline' }))} onClick={onDone} type="button">
          I'm not on this list
        </button>
      </div>
    </section>
  )
}
