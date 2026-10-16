import { useState } from 'react'
import type { FormEvent } from 'react'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export interface IAccountFormValues {
  name: string
  surname: string
  chessCom: string
}

interface IAccountFormProps {
  values: IAccountFormValues
  submitLabel: string
  autoFocus?: boolean
  onSave: (values: IAccountFormValues) => Promise<string | null>
}

export function AccountForm(props: IAccountFormProps) {
  const { values, submitLabel, autoFocus = false, onSave } = props
  const [name, setName] = useState(values.name)
  const [surname, setSurname] = useState(values.surname)
  const [chessCom, setChessCom] = useState(values.chessCom)
  const [message, setMessage] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const [pending, setPending] = useState(false)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaved(false)
    setPending(true)
    try {
      const nextMessage = await onSave({ name, surname, chessCom })
      setMessage(nextMessage)
      setSaved(nextMessage === null)
    } finally {
      setPending(false)
    }
  }

  return (
    <form className="mt-8 grid max-w-md gap-3" onSubmit={(event) => void submit(event)}>
      <input
        aria-label="Name"
        autoFocus={autoFocus}
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
      <button
        className={cn(buttonVariants({ size: 'lg' }), 'mt-2 w-fit hover:bg-secondary')}
        disabled={pending}
        type="submit"
      >
        {submitLabel}
      </button>
      {message ? <p className="text-secondary">{message}</p> : null}
      {saved ? <p className="text-muted-foreground">Saved.</p> : null}
    </form>
  )
}
