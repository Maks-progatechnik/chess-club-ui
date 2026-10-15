import { Show, useAuth } from '@clerk/react'
import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { buttonVariants } from '@/components/ui/button'
import { clubGet } from '@/lib/club-api'
import { drawGroup } from '@/lib/draw'
import type { DrawGroup, IPairing } from '@/lib/draw'
import { cn } from '@/lib/utils'

interface IAutumnSeed {
  name: string
  preference?: DrawGroup
}

interface IAutumnResponse {
  advanced: IAutumnSeed[]
  beginner: IAutumnSeed[]
  flagged: IAutumnSeed[]
}

interface IDrawPlayer {
  id: string
  name: string
  group: DrawGroup
  asked: DrawGroup | null
  ratedAdvanced: boolean
}

interface IDrawnPairs {
  advanced: IPairing[]
  beginner: IPairing[]
}

type DrawState =
  | { status: 'loading' }
  | { status: 'ready'; players: IDrawPlayer[] }
  | { status: 'error'; message: string }

interface IPlayerSectionProps {
  title: string
  players: IDrawPlayer[]
  onToggle: (id: string) => void
}

interface IPlayerRowProps {
  player: IDrawPlayer
  onToggle: (id: string) => void
}

interface IGroupToggleProps {
  name: string
  group: DrawGroup
  onToggle: () => void
}

interface IAddPlayerFormProps {
  onAdd: (name: string) => string | null
}

interface IPairSectionProps {
  title: string
  pairs: IPairing[]
}

interface IPairRowProps {
  pairing: IPairing
}

export function DrawPage() {
  return (
    <main className="mx-auto max-w-5xl px-6 pb-20">
      <Show when="signed-out">
        <SignedOutNotice />
      </Show>
      <Show when="signed-in">
        <DrawBoard />
      </Show>
    </main>
  )
}

function SignedOutNotice() {
  return (
    <section className="max-w-xl">
      <p className="text-xs font-bold tracking-[0.14em] text-secondary uppercase">Draw</p>
      <h1 className="mt-3 text-5xl font-bold leading-tight tracking-normal">Sign in to draw pairs.</h1>
      <Link className={cn(buttonVariants({ size: 'lg' }), 'mt-7 hover:bg-secondary')} to="/sign-in">
        Sign in
      </Link>
    </section>
  )
}

function DrawBoard() {
  const { getToken } = useAuth()
  const [draw, setDraw] = useState<DrawState>({ status: 'loading' })
  const [pairs, setPairs] = useState<IDrawnPairs | null>(null)

  useEffect(() => {
    let cancelled = false

    async function loadPlayers() {
      try {
        const token = await getToken()
        if (!token) {
          throw new Error('Clerk has not issued a session token yet.')
        }

        const body = await clubGet<IAutumnResponse>('/tournaments/autumn-2026', token)
        if (!Array.isArray(body.advanced) || !Array.isArray(body.beginner) || !Array.isArray(body.flagged)) {
          throw new Error('The club API returned an unexpected registration list.')
        }

        if (!cancelled) {
          setDraw({ status: 'ready', players: seedPlayers(body) })
        }
      } catch (error) {
        if (!cancelled) {
          const message = error instanceof Error ? error.message : 'Could not reach the club API.'
          setDraw({ status: 'error', message })
        }
      }
    }

    void loadPlayers()

    return () => {
      cancelled = true
    }
  }, [getToken])

  function togglePlayer(id: string) {
    setDraw((current) => {
      if (current.status !== 'ready') {
        return current
      }
      return {
        status: 'ready',
        players: current.players.map((player) =>
          player.id === id ? { ...player, group: otherGroup(player.group) } : player,
        ),
      }
    })
    setPairs(null)
  }

  function addPlayer(name: string): string | null {
    const trimmed = name.replace(/\s+/g, ' ').trim()
    if (!trimmed) {
      return 'Type a name first.'
    }
    if (draw.status !== 'ready') {
      return null
    }
    const taken = draw.players.some((player) => player.name.toLowerCase() === trimmed.toLowerCase())
    if (taken) {
      return `${trimmed} is already in the draw.`
    }

    setDraw({
      status: 'ready',
      players: [
        ...draw.players,
        { id: crypto.randomUUID(), name: trimmed, group: 'beginner', asked: null, ratedAdvanced: false },
      ],
    })
    setPairs(null)
    return null
  }

  function makeDraw() {
    if (draw.status !== 'ready') {
      return
    }
    setPairs({
      advanced: drawGroup(namesIn(draw.players, 'advanced')),
      beginner: drawGroup(namesIn(draw.players, 'beginner')),
    })
  }

  const players = draw.status === 'ready' ? draw.players : []
  const advanced = players.filter((player) => player.group === 'advanced')
  const beginner = players.filter((player) => player.group === 'beginner')

  return (
    <section>
      <p className="text-xs font-bold tracking-[0.14em] text-secondary uppercase">
        {draw.status === 'ready' ? `${players.length} players` : 'Tournament'}
      </p>
      <h1 className="mt-3 text-5xl font-bold leading-tight tracking-normal">Draw</h1>
      <p className="mt-4 max-w-2xl text-lg text-muted-foreground">
        Beginners play beginners. Advanced play advanced. Chess.com sets the groups, and anyone who asked for advanced on the form starts there too.
      </p>
      {draw.status === 'loading' ? <p className="mt-6 text-muted-foreground">Loading players…</p> : null}
      {draw.status === 'error' ? <p className="mt-6 text-muted-foreground">{draw.message}</p> : null}
      {draw.status === 'ready' ? (
        <>
          <AddPlayerForm onAdd={addPlayer} />
          <div className="mt-10 grid items-start gap-x-12 gap-y-10 md:grid-cols-2">
            <PlayerSection onToggle={togglePlayer} players={beginner} title="Beginner" />
            <PlayerSection onToggle={togglePlayer} players={advanced} title="Advanced" />
          </div>
          <button
            className={cn(buttonVariants({ size: 'lg' }), 'mt-10 hover:bg-secondary')}
            onClick={makeDraw}
            type="button"
          >
            Draw pairs
          </button>
          {pairs ? (
            <div className="mt-10 grid items-start gap-x-12 gap-y-10 md:grid-cols-2">
              <PairSection pairs={pairs.beginner} title="Beginner pairs" />
              <PairSection pairs={pairs.advanced} title="Advanced pairs" />
            </div>
          ) : null}
        </>
      ) : null}
    </section>
  )
}

function AddPlayerForm(props: IAddPlayerFormProps) {
  const { onAdd } = props
  const [name, setName] = useState('')
  const [message, setMessage] = useState<string | null>(null)

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const nextMessage = onAdd(name)
    setMessage(nextMessage)
    if (!nextMessage) {
      setName('')
    }
  }

  return (
    <form className="mt-8 flex max-w-xl flex-wrap items-center gap-3" onSubmit={submit}>
      <input
        aria-label="Add a player"
        className="h-9 min-w-48 flex-1 rounded-lg border border-border bg-background px-3 text-foreground outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        onChange={(event) => setName(event.target.value)}
        placeholder="Add a player"
        value={name}
      />
      <button className={cn(buttonVariants({ size: 'lg' }), 'hover:bg-secondary')} type="submit">
        Add
      </button>
      {message ? <p className="w-full text-secondary">{message}</p> : null}
    </form>
  )
}

function PlayerSection(props: IPlayerSectionProps) {
  const { title, players, onToggle } = props
  const count = players.length === 1 ? '1 player' : `${players.length} players`

  return (
    <section>
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h2 className="text-3xl font-bold tracking-normal">{title}</h2>
        <p className="text-xs font-bold tracking-[0.14em] text-secondary uppercase">{count}</p>
      </div>
      {players.length === 0 ? (
        <p className="mt-4 text-muted-foreground">No one in this group.</p>
      ) : (
        <ul className="mt-4">
          {players.map((player) => (
            <PlayerRow key={player.id} onToggle={onToggle} player={player} />
          ))}
        </ul>
      )}
    </section>
  )
}

function PlayerRow(props: IPlayerRowProps) {
  const { player, onToggle } = props
  const note = preferenceNote(player)

  return (
    <li className="flex items-center justify-between gap-4 border-b py-3">
      <span>
        <span className="font-bold">{player.name}</span>
        {note ? <span className="mt-1 block text-sm text-muted-foreground">{note}</span> : null}
      </span>
      <GroupToggle group={player.group} name={player.name} onToggle={() => onToggle(player.id)} />
    </li>
  )
}

function GroupToggle(props: IGroupToggleProps) {
  const { name, group, onToggle } = props
  const advanced = group === 'advanced'

  return (
    <button
      aria-checked={advanced}
      aria-label={`${name}, ${group}. Switch group.`}
      className={cn(
        'inline-flex h-8 items-center gap-2 rounded-full px-3 text-xs font-bold tracking-[0.08em] uppercase',
        advanced ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground',
      )}
      onClick={onToggle}
      role="switch"
      type="button"
    >
      <span className={cn('size-2.5 rounded-full', advanced ? 'bg-secondary' : 'bg-background')} />
      {advanced ? 'Advanced' : 'Beginner'}
    </button>
  )
}

function PairSection(props: IPairSectionProps) {
  const { title, pairs } = props

  return (
    <section>
      <h2 className="text-3xl font-bold tracking-normal">{title}</h2>
      {pairs.length === 0 ? (
        <p className="mt-4 text-muted-foreground">No pairs in this group.</p>
      ) : (
        <div className="mt-4">
          {pairs.map((pairing) => (
            <PairRow key={`${pairing.white}-${pairing.black ?? 'bye'}`} pairing={pairing} />
          ))}
        </div>
      )}
    </section>
  )
}

function PairRow(props: IPairRowProps) {
  const { pairing } = props

  if (!pairing.black) {
    return (
      <p className="border-b py-3">
        <span className="font-bold">{pairing.white}</span>
        <span className="text-muted-foreground"> has a bye.</span>
      </p>
    )
  }

  return (
    <p className="border-b py-3">
      <span className="font-bold">{pairing.white}</span>
      <span className="mx-3 text-xs font-bold tracking-[0.14em] text-secondary uppercase">vs</span>
      <span className="font-bold">{pairing.black}</span>
    </p>
  )
}

function seedPlayers(body: IAutumnResponse): IDrawPlayer[] {
  return [
    ...body.advanced.map((player) => toDrawPlayer(player, true)),
    ...body.beginner.map((player) => toDrawPlayer(player, false)),
    ...body.flagged.map((player) => toDrawPlayer(player, false)),
  ]
}

function toDrawPlayer(player: IAutumnSeed, ratedAdvanced: boolean): IDrawPlayer {
  const asked = player.preference === 'advanced' ? 'advanced' : 'beginner'
  const group = asked === 'advanced' || ratedAdvanced ? 'advanced' : 'beginner'
  return { id: crypto.randomUUID(), name: player.name, group, asked, ratedAdvanced }
}

function preferenceNote(player: IDrawPlayer): string | null {
  if (player.asked === 'advanced' && !player.ratedAdvanced) {
    return 'Asked for advanced'
  }
  if (player.asked === 'beginner' && player.ratedAdvanced) {
    return 'Asked for beginner'
  }
  return null
}

function namesIn(players: IDrawPlayer[], group: DrawGroup): string[] {
  return players.filter((player) => player.group === group).map((player) => player.name)
}

function otherGroup(group: DrawGroup): DrawGroup {
  return group === 'advanced' ? 'beginner' : 'advanced'
}
