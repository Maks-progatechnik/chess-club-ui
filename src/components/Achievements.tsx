import { useState } from 'react'
import { ChevronDown, Crown, Flag, HeartPulse, Hourglass, Timer, Users } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { IAchievements, IRecordMark } from '@/lib/board'
import { playerPath } from '@/lib/players'
import { cn } from '@/lib/utils'

interface IAchievementsProps {
  achievements: IAchievements
}

interface IAchievementFact {
  value: string
  context: string | null
}

interface IAchievementCardProps {
  title: string
  caption: string
  icon: LucideIcon
  marks: IRecordMark[]
  fact: (mark: IRecordMark) => IAchievementFact
}

interface IHolderRowProps {
  mark: IRecordMark
  fact: IAchievementFact
  muted?: boolean
}

interface IMarkNamesProps {
  names: string[]
  muted?: boolean
}

export function Achievements(props: IAchievementsProps) {
  const { achievements } = props

  return (
    <section>
      <p className="text-xs font-bold tracking-[0.14em] text-secondary uppercase">Club</p>
      <h2 className="text-3xl font-bold tracking-normal">Achievements</h2>
      <div className="mt-5 grid items-start gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <AchievementCard
          caption="The earliest shared game."
          fact={firstFact}
          icon={Flag}
          marks={achievements.firstGame}
          title="First club game"
        />
        <AchievementCard
          caption="Fewest moves in a win."
          fact={quickestFact}
          icon={Timer}
          marks={achievements.quickestWin}
          title="Quickest win"
        />
        <AchievementCard
          caption="Most moves in a game."
          fact={longestFact}
          icon={Hourglass}
          marks={achievements.longestGame}
          title="Longest game"
        />
        <AchievementCard
          caption="Most shared games."
          fact={mostGamesFact}
          icon={Users}
          marks={achievements.mostGames}
          title="Most games"
        />
        <AchievementCard
          caption="Biggest material deficit in a win. A one-move recapture, such as a queen trade, does not count."
          fact={recoveryFact}
          icon={HeartPulse}
          marks={achievements.recovery}
          title="Best recovery"
        />
        <AchievementCard
          caption="Won the tournament. A tie on points is shared."
          fact={tournamentFact}
          icon={Crown}
          marks={achievements.tournament}
          title="Tournament winner"
        />
      </div>
    </section>
  )
}

function AchievementCard(props: IAchievementCardProps) {
  const { title, caption, icon: Icon, marks, fact } = props
  const current = marks.filter((mark) => mark.current)
  const earlier = marks.filter((mark) => !mark.current)
  const locked = current.length === 0
  const [open, setOpen] = useState(false)

  return (
    <article
      className={cn(
        'flex flex-col rounded-3xl border p-5',
        locked ? 'border-dashed border-border bg-muted/40' : 'border-border bg-card',
      )}
    >
      <div className="flex items-center gap-2">
        <Icon className={cn('size-4', locked ? 'text-muted-foreground' : 'text-secondary')} />
        <h3 className="font-bold">{title}</h3>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">{caption}</p>
      {locked ? <p className="mt-4 text-sm font-bold text-muted-foreground">Not yet</p> : null}
      {current.length > 0 ? (
        <ul className="mt-4 grid gap-3">
          {current.map((mark) => (
            <li className="border-t border-border pt-3 first:border-t-0 first:pt-0" key={markKey(mark)}>
              <HolderRow fact={fact(mark)} mark={mark} />
            </li>
          ))}
        </ul>
      ) : null}
      {earlier.length > 0 ? (
        <div className="mt-4 border-t border-border pt-3">
          <button
            aria-expanded={open}
            className="flex w-full items-center justify-between text-sm font-bold text-muted-foreground"
            onClick={() => setOpen((value) => !value)}
            type="button"
          >
            <span>{earlierLabel(earlier.length)}</span>
            <ChevronDown className={cn('size-4 transition-transform', open && 'rotate-180')} />
          </button>
          {open ? (
            <ul className="mt-3 grid gap-3">
              {earlier.map((mark) => (
                <li key={markKey(mark)}>
                  <HolderRow fact={fact(mark)} mark={mark} muted />
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}
    </article>
  )
}

function HolderRow(props: IHolderRowProps) {
  const { mark, fact, muted = false } = props

  return (
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <MarkNames muted={muted} names={mark.names} />
        {fact.context ? <p className="text-sm text-muted-foreground">{fact.context}</p> : null}
      </div>
      <p className={cn('shrink-0 text-right', muted ? 'text-sm text-muted-foreground' : 'font-bold')}>{fact.value}</p>
    </div>
  )
}

function MarkNames(props: IMarkNamesProps) {
  const { names, muted = false } = props

  return (
    <p className={muted ? 'text-sm' : 'font-bold'}>
      {names.map((name, index) => (
        <span key={`${name}-${index}`}>
          {index > 0 ? <span className="mx-1 font-normal text-muted-foreground">vs</span> : null}
          <Link className="underline-offset-4 hover:text-secondary hover:underline" to={playerPath(name)}>
            {name}
          </Link>
        </span>
      ))}
    </p>
  )
}

function firstFact(mark: IRecordMark): IAchievementFact {
  return { value: formatPlayedAt(mark.playedAt) ?? 'Date unknown', context: null }
}

function quickestFact(mark: IRecordMark): IAchievementFact {
  const moves = mark.moves === 1 ? '1 move' : `${mark.moves ?? 0} moves`
  return { value: moves, context: joinContext(mark.opponent ? `vs ${mark.opponent}` : null, formatPlayedAt(mark.playedAt)) }
}

function longestFact(mark: IRecordMark): IAchievementFact {
  const moves = mark.moves === 1 ? '1 move' : `${mark.moves ?? 0} moves`
  return { value: moves, context: formatPlayedAt(mark.playedAt) }
}

function mostGamesFact(mark: IRecordMark): IAchievementFact {
  const count = mark.games ?? 0
  const games = count === 1 ? '1 game' : `${count} games`
  return { value: games, context: formatPlayedAt(mark.playedAt) }
}

function recoveryFact(mark: IRecordMark): IAchievementFact {
  return {
    value: `−${mark.deficit ?? 0}`,
    context: joinContext(mark.opponent ? `vs ${mark.opponent}` : null, formatPlayedAt(mark.playedAt)),
  }
}

function tournamentFact(): IAchievementFact {
  return { value: 'Lead', context: null }
}

function earlierLabel(count: number): string {
  return count === 1 ? '1 earlier' : `${count} earlier`
}

function joinContext(left: string | null, right: string | null): string | null {
  const parts = [left, right].filter((part) => part)
  return parts.length > 0 ? parts.join(' · ') : null
}

function markKey(mark: IRecordMark): string {
  return `${mark.names.join('|')}-${mark.games ?? ''}-${mark.moves ?? ''}-${mark.deficit ?? ''}-${mark.playedAt ?? ''}-${mark.url ?? ''}`
}

function formatPlayedAt(value: string | null): string | null {
  if (!value) {
    return null
  }
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return null
  }
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
  })
}
