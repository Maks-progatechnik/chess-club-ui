import { useState } from 'react'
import { buttonVariants } from '@/components/ui/button'
import { rounds } from '@/lib/tournament'
import { cn } from '@/lib/utils'

interface INextRoundProps {
  drawCount: number
  onGenerate: (round: number) => Promise<string | null>
}

export function NextRound(props: INextRoundProps) {
  const { drawCount, onGenerate } = props
  const round = nextRoundNumber(drawCount)
  const [pending, setPending] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  if (round === null) {
    return null
  }
  const roundNumber = round

  async function generate() {
    setPending(true)
    setMessage(null)
    const error = await onGenerate(roundNumber)
    setMessage(error)
    setPending(false)
  }

  return (
    <section className="rounded-3xl border border-border bg-card p-5 sm:p-6">
      <p className="text-xs font-bold tracking-[0.14em] text-secondary uppercase">Round {roundNumber}</p>
      <h2 className="mt-2 text-3xl font-bold tracking-normal">Next pairings</h2>
      <p className="mt-3 text-sm text-muted-foreground">
        Swiss pairings from match points, kept inside each group. A match that is not finished scores 0 for both
        players. Round {roundNumber} can be generated once.
      </p>
      <button
        className={cn(buttonVariants({ size: 'lg' }), 'mt-5 hover:bg-secondary')}
        disabled={pending}
        onClick={() => void generate()}
        type="button"
      >
        {pending ? 'Pairing…' : `Generate round ${roundNumber}`}
      </button>
      {message ? <p className="mt-3 text-sm text-secondary">{message}</p> : null}
    </section>
  )
}

function nextRoundNumber(drawCount: number): number | null {
  const next = drawCount + 1
  const current = rounds.find((round) => round.round === drawCount)
  const upcoming = rounds.find((round) => round.round === next)
  if (!current || !upcoming) {
    return null
  }
  const today = dayKey(new Date())
  if (today < current.deadlineOn && today < upcoming.pairingOn) {
    return null
  }
  return next
}

function dayKey(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}
