import { BookOpen, Scale, Swords, Users } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { IClubStats, IOpeningCount } from '@/lib/board'

interface IClubStatsProps {
  stats: IClubStats
}

interface IStatBlockProps {
  title: string
  icon: LucideIcon
  value: string
  detail: string
}

export function ClubStats(props: IClubStatsProps) {
  const { stats } = props

  return (
    <section className="rounded-3xl border border-border bg-card p-5 sm:p-6">
      <p className="text-xs font-bold tracking-[0.14em] text-secondary uppercase">Club</p>
      <h2 className="text-3xl font-bold tracking-normal">Stats</h2>
      <div className="mt-5 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatBlock detail="Signed up for the club." icon={Users} title="Members" value={String(stats.members)} />
        <StatBlock detail="Shared games with a known result." icon={Swords} title="Games" value={String(stats.games)} />
        <StatBlock detail={openingDetail(stats.openings)} icon={BookOpen} title="Most played opening" value={openingValue(stats.openings)} />
        <StatBlock detail="White wins, black wins, and draws." icon={Scale} title="Results" value={resultsValue(stats)} />
      </div>
    </section>
  )
}

function StatBlock(props: IStatBlockProps) {
  const { title, icon: Icon, value, detail } = props

  return (
    <div>
      <div className="flex items-center gap-2">
        <Icon className="size-4 text-secondary" />
        <h3 className="font-bold">{title}</h3>
      </div>
      <p className="mt-3 text-2xl font-bold tracking-normal">{value}</p>
      <p className="mt-1 text-sm text-muted-foreground">{detail}</p>
    </div>
  )
}

function openingValue(openings: IOpeningCount[]): string {
  if (openings.length === 0) {
    return 'Not yet'
  }
  if (openings.length === 1) {
    return openings[0]?.name ?? 'Not yet'
  }
  return `${openings.length} tied`
}

function openingDetail(openings: IOpeningCount[]): string {
  const first = openings[0]
  if (!first) {
    return 'No named opening yet.'
  }
  const count = first.games === 1 ? '1 game' : `${first.games} games`
  if (openings.length === 1) {
    return count
  }
  return `${openings.map((opening) => opening.name).join(', ')} · ${count} each`
}

function resultsValue(stats: IClubStats): string {
  return `${stats.whiteWins}–${stats.blackWins}–${stats.draws}`
}
