export type BoardGroup = 'beginner' | 'advanced'
export type GameOutcome = 'white' | 'black' | 'draw' | 'unknown'
export type MatchStatus = 'open' | 'playing' | 'played' | 'split' | 'bye'

export interface IBoardGame {
  url: string
  outcome: GameOutcome
  winnerName: string | null
  summary: string | null
  playedAt: string | null
}

export interface IBoardPair {
  group: BoardGroup
  white: string
  black: string | null
  across: boolean
  games: IBoardGame[]
  whiteGameWins: number
  blackGameWins: number
  status: MatchStatus
  winner: string | null
  whitePoints: number
  blackPoints: number
}

export interface IBoardDraw {
  id: number
  createdAt: string
  round: number
  pairs: IBoardPair[]
}

export interface IStanding {
  name: string
  points: number
  played: number
  wins: number
  draws: number
  losses: number
  gameWins: number
}

export interface IClubBoard {
  draws: IBoardDraw[]
  standings: IStanding[]
}

export interface ISignupPlayer {
  name: string
  chessCom: string | null
  claimed: boolean
  mine: boolean
}

export interface IAddMatchGame {
  group: BoardGroup
  white: string
  black: string
  url: string
}

export function isClubBoard(value: unknown): value is IClubBoard {
  if (!isRecord(value)) {
    return false
  }
  return Array.isArray(value.draws) && Array.isArray(value.standings)
}

export function pointLabel(points: number): string {
  const shown = Number.isInteger(points) ? String(points) : points.toFixed(1)
  return shown === '1' ? '1 pt' : `${shown} pts`
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}
