export interface ITournamentRound {
  round: number
  pairing: string
  pairingOn: string
  deadline: string
  deadlineOn: string
}

export interface ITournamentStage {
  id: string
  title: string
}

export interface IMatchRule {
  id: string
  eyebrow: string
  title: string
  value: string
  detail: string
}

export type RoundTiming = 'past' | 'current' | 'upcoming'

export const swissOverview =
  'Швейцарська система — це формат турніру, в якому учасники проводять фіксовану кількість раундів, а в кожному наступному турі суперниками стають гравці з однаковою або максимально близькою кількістю очок без вибування після поразок.'

export const rounds: ITournamentRound[] = [
  { round: 1, pairing: 'Пт, 16 жовтня', pairingOn: '2026-10-16', deadline: 'Чт, 22 жовтня', deadlineOn: '2026-10-22' },
  { round: 2, pairing: 'Пт, 23 жовтня', pairingOn: '2026-10-23', deadline: 'Чт, 29 жовтня', deadlineOn: '2026-10-29' },
  { round: 3, pairing: 'Пт, 30 жовтня', pairingOn: '2026-10-30', deadline: 'Чт, 5 листопада', deadlineOn: '2026-11-05' },
  { round: 4, pairing: 'Пт, 6 листопада', pairingOn: '2026-11-06', deadline: 'Чт, 12 листопада', deadlineOn: '2026-11-12' },
]

export const stages: ITournamentStage[] = [
  { id: 'registration', title: 'Реєстрація' },
  { id: 'draw', title: 'Жеребкування' },
  { id: 'matches', title: 'Матчі' },
  { id: 'scoring', title: 'Підрахунок результатів' },
  { id: 'final', title: 'Фінал live трансляцією' },
]

export const matchRules: IMatchRule[] = [
  {
    id: 'time',
    eyebrow: 'Time control',
    title: 'Тривалість партії',
    value: '10 хв',
    detail: 'Each game is ten minutes.',
  },
  {
    id: 'deadline',
    eyebrow: 'Match deadline',
    title: 'Скільки днів є, щоб зіграти',
    value: '',
    detail: '',
  },
  {
    id: 'format',
    eyebrow: 'Match format',
    title: 'Формат матчу',
    value: 'До 2 перемог',
    detail: 'One match, played until someone wins two games.',
  },
  {
    id: 'points',
    eyebrow: 'Match points',
    title: 'Перемога в матчі',
    value: '1 очко',
    detail:
      'Граєте до 2 перемог. Якщо рахунок 2:0 або 2:1 — переможець отримує 1 турнірне очко, переможений — 0. Якщо всі партії закінчилися внічию або ліміт у 2 нічиї завершився без переможця — кожен отримує 0,5 очка.',
  },
]

export function roundSchedule(round: number): ITournamentRound | null {
  return rounds.find((item) => item.round === round) ?? null
}

export function roundTiming(round: ITournamentRound, today = new Date()): RoundTiming {
  const key = dayKey(today)
  if (key > round.deadlineOn) {
    return 'past'
  }
  if (key >= round.pairingOn) {
    return 'current'
  }
  return 'upcoming'
}

export function activeRound(today = new Date()): ITournamentRound | null {
  return rounds.find((round) => roundTiming(round, today) === 'current') ?? null
}

function dayKey(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}
