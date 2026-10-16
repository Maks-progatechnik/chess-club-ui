import { Show, useAuth } from '@clerk/react'
import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { buttonVariants } from '@/components/ui/button'
import { clubGet, clubPost } from '@/lib/club-api'
import { chessGameUrl } from '@/lib/chess-game'
import { playerPath } from '@/lib/players'
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

interface ISavedDraw {
  id: number
  createdAt: string
  result: IDrawnPairs
}

interface IDrawsResponse {
  draws: ISavedDraw[]
}

type HistoryState =
  | { status: 'loading' }
  | { status: 'ready'; draws: ISavedDraw[] }
  | { status: 'error'; message: string }

interface ISignupPlayer {
  name: string
  chessCom: string | null
  claimed: boolean
  mine: boolean
}

interface IDummiesResponse {
  dummies: ISignupPlayer[]
}

interface IAddGame {
  drawId: number
  group: DrawGroup
  pairing: IPairing
  url: string
}

interface IDrawHistoryProps {
  history: HistoryState
  roster: ISignupPlayer[]
  onAddGame: (game: IAddGame) => Promise<string | null>
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
  onAdd: (name: string) => Promise<string | null>
}

interface IPairSectionProps {
  title: string
  pairs: IPairing[]
  roster: ISignupPlayer[]
  pending?: boolean
  onAddGame: (pairing: IPairing, url: string) => Promise<string | null>
}

interface IPairRowProps {
  pairing: IPairing
  roster: ISignupPlayer[]
  pending: boolean
  onAddGame: (url: string) => Promise<string | null>
}

interface IGameModalProps {
  pairing: IPairing
  roster: ISignupPlayer[]
  games: string[]
  onAdd: (url: string) => Promise<string | null>
  onClose: () => void
}

interface IPlayerLabelProps {
  name: string
  roster: ISignupPlayer[]
}

interface IGameLinkProps {
  href: string
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
  const [savedDrawId, setSavedDrawId] = useState<number | null>(null)
  const [roster, setRoster] = useState<ISignupPlayer[]>([])
  const [history, setHistory] = useState<HistoryState>({ status: 'loading' })
  const [saving, setSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState<string | null>(null)

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

        const sheet = await clubGet<IDummiesResponse>('/dummies', token)
        if (!cancelled) {
          setDraw({ status: 'ready', players: seedPlayers(body) })
          setRoster(Array.isArray(sheet.dummies) ? sheet.dummies : [])
        }
      } catch (error) {
        if (!cancelled) {
          const message = error instanceof Error ? error.message : 'Could not reach the club API.'
          setDraw({ status: 'error', message })
        }
      }
    }

    async function loadHistory() {
      try {
        const token = await getToken()
        if (!token) {
          throw new Error('Clerk has not issued a session token yet.')
        }

        const body = await clubGet<IDrawsResponse>('/draws', token)
        if (!Array.isArray(body.draws)) {
          throw new Error('The club API returned an unexpected draw history.')
        }

        if (!cancelled) {
          setHistory({
            status: 'ready',
            draws: body.draws.map((draw) => ({ ...draw, result: withGames(draw.result) })),
          })
        }
      } catch (error) {
        if (!cancelled) {
          const message = error instanceof Error ? error.message : 'Could not reach the club API.'
          setHistory({ status: 'error', message })
        }
      }
    }

    void loadPlayers()
    void loadHistory()

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
    setSavedDrawId(null)
  }

  async function addPlayer(name: string): Promise<string | null> {
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

    try {
      const token = await getToken()
      if (!token) {
        return 'Clerk has not issued a session token yet.'
      }

      const saved = await clubPost<{ name: string }>('/dummies', token, { name: trimmed })
      setDraw((current) => {
        if (current.status !== 'ready') {
          return current
        }
        if (current.players.some((player) => player.name.toLowerCase() === saved.name.toLowerCase())) {
          return current
        }
        return {
          status: 'ready',
          players: [
            ...current.players,
            { id: crypto.randomUUID(), name: saved.name, group: 'beginner', asked: null, ratedAdvanced: false },
          ],
        }
      })
      setPairs(null)
      setSavedDrawId(null)
      return null
    } catch (error) {
      return error instanceof Error ? error.message : 'Could not add this player.'
    }
  }

  async function makeDraw() {
    if (draw.status !== 'ready' || saving) {
      return
    }
    const next = {
      advanced: drawGroup(namesIn(draw.players, 'advanced')),
      beginner: drawGroup(namesIn(draw.players, 'beginner')),
    }
    setPairs(next)
    setSavedDrawId(null)
    setSaveMessage(null)
    setSaving(true)
    const message = await persistDraw(next)
    setSaveMessage(message)
    setSaving(false)
  }

  async function retrySave() {
    if (!pairs || saving) {
      return
    }
    setSaveMessage(null)
    setSaving(true)
    const message = await persistDraw(pairs)
    setSaveMessage(message)
    setSaving(false)
  }

  async function persistDraw(next: IDrawnPairs): Promise<string | null> {
    try {
      const token = await getToken()
      if (!token) {
        return 'Clerk has not issued a session token yet.'
      }

      const saved = await clubPost<ISavedDraw>('/draws', token, next)
      setSavedDrawId(saved.id)
      setPairs(withGames(saved.result))
      setHistory((current) => {
        const previous = current.status === 'ready' ? current.draws : []
        return { status: 'ready', draws: [saved, ...previous.filter((item) => item.id !== saved.id)] }
      })
      return null
    } catch (error) {
      return error instanceof Error ? error.message : 'Could not save this draw.'
    }
  }

  async function addCurrentGame(group: DrawGroup, pairing: IPairing, url: string): Promise<string | null> {
    const game = chessGameUrl(url)
    if (!game) {
      return 'Paste a Chess.com game link.'
    }
    if ((pairing.games ?? []).includes(game)) {
      return 'That game is already on this match.'
    }
    if (savedDrawId !== null && pairing.black) {
      return postGame({ drawId: savedDrawId, group, pairing, url: game })
    }

    setPairs((current) => {
      if (!current) {
        return current
      }
      return {
        ...current,
        [group]: current[group].map((pair) =>
          samePair(pair, pairing) ? { ...pair, games: [...(pair.games ?? []), game] } : pair,
        ),
      }
    })
    return null
  }

  async function postGame(game: IAddGame): Promise<string | null> {
    const { drawId, group, pairing, url } = game
    try {
      const token = await getToken()
      if (!token) {
        return 'Clerk has not issued a session token yet.'
      }

      const saved = await clubPost<ISavedDraw>(`/draws/${drawId}/games`, token, {
        group,
        white: pairing.white,
        black: pairing.black,
        url,
      })
      setHistory((current) => {
        const previous = current.status === 'ready' ? current.draws : []
        const rest = previous.filter((draw) => draw.id !== saved.id)
        return { status: 'ready', draws: [saved, ...rest] }
      })
      if (savedDrawId === saved.id) {
        setPairs(withGames(saved.result))
      }
      return null
    } catch (error) {
      return error instanceof Error ? error.message : 'Could not save this game.'
    }
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
          <div className="mt-10 flex flex-wrap items-center gap-3">
            <button
              className={cn(buttonVariants({ size: 'lg' }), 'hover:bg-secondary')}
              disabled={saving}
              onClick={() => void makeDraw()}
              type="button"
            >
              {saving ? 'Saving…' : 'Draw pairs'}
            </button>
            {pairs && savedDrawId === null && !saving ? (
              <button
                className={cn(buttonVariants({ size: 'lg', variant: 'outline' }))}
                onClick={() => void retrySave()}
                type="button"
              >
                Save this draw
              </button>
            ) : null}
          </div>
          {saveMessage ? <p className="mt-3 text-secondary">{saveMessage}</p> : null}
          {pairs ? (
            <div className="mt-10 grid items-start gap-x-12 gap-y-10 md:grid-cols-2">
              <PairSection
                onAddGame={(pairing, url) => addCurrentGame('beginner', pairing, url)}
                pairs={pairs.beginner}
                pending={saving}
                roster={roster}
                title="Beginner pairs"
              />
              <PairSection
                onAddGame={(pairing, url) => addCurrentGame('advanced', pairing, url)}
                pairs={pairs.advanced}
                pending={saving}
                roster={roster}
                title="Advanced pairs"
              />
            </div>
          ) : null}
        </>
      ) : null}
      <DrawHistory history={withoutCurrent(history, savedDrawId)} onAddGame={postGame} roster={roster} />
    </section>
  )
}

function DrawHistory(props: IDrawHistoryProps) {
  const { history, roster, onAddGame } = props

  return (
    <section className="mt-16 border-t pt-10">
      <h2 className="text-3xl font-bold tracking-normal">History</h2>
      {history.status === 'loading' ? <p className="mt-4 text-muted-foreground">Loading saved draws…</p> : null}
      {history.status === 'error' ? <p className="mt-4 text-muted-foreground">{history.message}</p> : null}
      {history.status === 'ready' && history.draws.length === 0 ? (
        <p className="mt-4 text-muted-foreground">No saved draws.</p>
      ) : null}
      {history.status === 'ready'
        ? history.draws.map((saved) => (
            <article className="mt-8" key={saved.id}>
              <p className="text-xs font-bold tracking-[0.14em] text-secondary uppercase">
                {formatSavedAt(saved.createdAt)}
              </p>
              <div className="mt-4 grid items-start gap-x-12 gap-y-8 md:grid-cols-2">
                <PairSection
                  onAddGame={(pairing, url) =>
                    onAddGame({ drawId: saved.id, group: 'beginner', pairing, url })
                  }
                  pairs={saved.result.beginner}
                  roster={roster}
                  title="Beginner pairs"
                />
                <PairSection
                  onAddGame={(pairing, url) =>
                    onAddGame({ drawId: saved.id, group: 'advanced', pairing, url })
                  }
                  pairs={saved.result.advanced}
                  roster={roster}
                  title="Advanced pairs"
                />
              </div>
            </article>
          ))
        : null}
    </section>
  )
}

function formatSavedAt(value: string): string {
  return new Date(value).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

function AddPlayerForm(props: IAddPlayerFormProps) {
  const { onAdd } = props
  const [name, setName] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setPending(true)
    try {
      const nextMessage = await onAdd(name)
      setMessage(nextMessage)
      if (!nextMessage) {
        setName('')
      }
    } finally {
      setPending(false)
    }
  }

  return (
    <form className="mt-8 flex max-w-xl flex-wrap items-center gap-3" onSubmit={(event) => void submit(event)}>
      <input
        aria-label="Add a player"
        className="h-9 min-w-48 flex-1 rounded-lg border border-border bg-background px-3 text-foreground outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        onChange={(event) => setName(event.target.value)}
        placeholder="Add a player"
        value={name}
      />
      <button className={cn(buttonVariants({ size: 'lg' }), 'hover:bg-secondary')} disabled={pending} type="submit">
        Add
      </button>
      <p className="w-full text-sm text-muted-foreground">Added players are saved on the signup sheet.</p>
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
  const { title, pairs, roster, pending = false, onAddGame } = props

  return (
    <section>
      <h2 className="text-3xl font-bold tracking-normal">{title}</h2>
      {pairs.length === 0 ? (
        <p className="mt-4 text-muted-foreground">No pairs in this group.</p>
      ) : (
        <div className="mt-4">
          {pairs.map((pairing) => (
            <PairRow
              key={`${pairing.white}-${pairing.black ?? 'bye'}`}
              onAddGame={(url) => onAddGame(pairing, url)}
              pairing={pairing}
              pending={pending}
              roster={roster}
            />
          ))}
        </div>
      )}
    </section>
  )
}

function PairRow(props: IPairRowProps) {
  const { pairing, roster, pending, onAddGame } = props
  const [open, setOpen] = useState(false)
  const games = pairing.games ?? []

  if (!pairing.black) {
    return (
      <p className="border-b py-3">
        <PlayerLabel name={pairing.white} roster={roster} />
        <span className="text-muted-foreground"> has a bye.</span>
      </p>
    )
  }

  return (
    <div className="border-b py-3">
      <div className="flex items-start justify-between gap-4">
        <p>
          <PlayerLabel name={pairing.white} roster={roster} />
          <span className="mx-3 text-xs font-bold tracking-[0.14em] text-secondary uppercase">vs</span>
          <PlayerLabel name={pairing.black} roster={roster} />
        </p>
        <button
          className={cn(buttonVariants({ size: 'sm', variant: 'outline' }), 'shrink-0')}
          disabled={pending}
          onClick={() => setOpen(true)}
          type="button"
        >
          {games.length === 0 ? 'Add game' : 'Add another'}
        </button>
      </div>
      {games.length > 0 ? (
        <ul className="mt-2">
          {games.map((game) => (
            <li key={game}>
              <GameLink href={game} />
            </li>
          ))}
        </ul>
      ) : null}
      {open ? (
        <GameModal
          games={games}
          onAdd={onAddGame}
          onClose={() => setOpen(false)}
          pairing={pairing}
          roster={roster}
        />
      ) : null}
    </div>
  )
}

function GameModal(props: IGameModalProps) {
  const { pairing, roster, games, onAdd, onClose } = props
  const [url, setUrl] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  useEffect(() => {
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = previous
      window.removeEventListener('keydown', onKey)
    }
  }, [onClose])

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setPending(true)
    try {
      const nextMessage = await onAdd(url)
      setMessage(nextMessage)
      if (!nextMessage) {
        setUrl('')
      }
    } finally {
      setPending(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-foreground/40 p-4"
      onClick={onClose}
      role="presentation"
    >
      <div
        aria-labelledby="game-link-title"
        aria-modal="true"
        className="w-full max-w-lg rounded-lg border border-border bg-background p-6 text-foreground"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
      >
        <p className="text-xs font-bold tracking-[0.14em] text-secondary uppercase">Chess.com</p>
        <h2 className="mt-3 text-3xl font-bold tracking-normal" id="game-link-title">
          Add a game
        </h2>
        <p className="mt-4">
          <PlayerLabel name={pairing.white} roster={roster} />
          <span className="mx-3 text-xs font-bold tracking-[0.14em] text-secondary uppercase">vs</span>
          <PlayerLabel name={pairing.black ?? ''} roster={roster} />
        </p>
        {games.length > 0 ? (
          <ul className="mt-4">
            {games.map((game) => (
              <li className="border-b py-2" key={game}>
                <GameLink href={game} />
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-4 text-muted-foreground">No games for this match yet.</p>
        )}
        <form className="mt-5 grid gap-3" onSubmit={(event) => void submit(event)}>
          <input
            aria-label="Chess.com game link"
            autoFocus
            className="h-9 rounded-lg border border-border bg-background px-3 text-foreground outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
            onChange={(event) => setUrl(event.target.value)}
            placeholder="https://www.chess.com/game/live/…"
            value={url}
          />
          <div className="flex flex-wrap items-center gap-3">
            <button className={cn(buttonVariants({ size: 'lg' }), 'hover:bg-secondary')} disabled={pending} type="submit">
              {pending ? 'Adding…' : 'Add game'}
            </button>
            <button className={cn(buttonVariants({ size: 'lg', variant: 'outline' }))} onClick={onClose} type="button">
              Done
            </button>
          </div>
          {message ? <p className="text-secondary">{message}</p> : null}
        </form>
      </div>
    </div>
  )
}

function GameLink(props: IGameLinkProps) {
  const { href } = props

  return (
    <a className="text-sm text-secondary underline underline-offset-4" href={href} rel="noreferrer" target="_blank">
      {href.replace('https://www.chess.com', 'chess.com')}
    </a>
  )
}

function PlayerLabel(props: IPlayerLabelProps) {
  const { name, roster } = props
  const player = roster.find((row) => row.name.toLowerCase() === name.toLowerCase())
  const note = playerNote(player)

  return (
    <span className="font-bold">
      <Link className="underline-offset-4 hover:text-secondary hover:underline" to={playerPath(name)}>
        {name}
      </Link>
      {note ? <span className="mt-1 block text-sm font-normal text-muted-foreground">{note}</span> : null}
    </span>
  )
}

function playerNote(player: ISignupPlayer | undefined): string | null {
  if (!player || (!player.claimed && !player.mine)) {
    return null
  }
  if (player.mine) {
    return player.chessCom ? `You · ${player.chessCom}` : 'You'
  }
  return player.chessCom
}

function withoutCurrent(history: HistoryState, savedDrawId: number | null): HistoryState {
  if (history.status !== 'ready' || savedDrawId === null) {
    return history
  }
  return { status: 'ready', draws: history.draws.filter((draw) => draw.id !== savedDrawId) }
}

function withGames(result: IDrawnPairs): IDrawnPairs {
  return {
    beginner: result.beginner.map((pair) => ({ ...pair, games: pair.games ?? [] })),
    advanced: result.advanced.map((pair) => ({ ...pair, games: pair.games ?? [] })),
  }
}

function samePair(left: IPairing, right: IPairing): boolean {
  return (
    left.white.toLowerCase() === right.white.toLowerCase() &&
    (left.black ?? '').toLowerCase() === (right.black ?? '').toLowerCase()
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
