export type DrawGroup = 'beginner' | 'advanced'

export interface IPairing {
  white: string
  black: string | null
  games: string[]
  across?: boolean
}

export interface IDrawnGroups {
  advanced: IPairing[]
  beginner: IPairing[]
}

export function drawGroups(advancedNames: string[], beginnerNames: string[]): IDrawnGroups {
  const advanced = drawGroup(advancedNames)
  const beginner = drawGroup(beginnerNames)
  const advancedBye = popBye(advanced)
  const beginnerBye = popBye(beginner)

  if (advancedBye && beginnerBye) {
    const advancedWhite = Math.random() < 0.5
    advanced.push({
      white: advancedWhite ? advancedBye : beginnerBye,
      black: advancedWhite ? beginnerBye : advancedBye,
      games: [],
      across: true,
    })
  } else {
    if (advancedBye) {
      advanced.push({ white: advancedBye, black: null, games: [] })
    }
    if (beginnerBye) {
      beginner.push({ white: beginnerBye, black: null, games: [] })
    }
  }

  return { advanced, beginner }
}

export function drawGroup(names: string[]): IPairing[] {
  const order = shuffle(names)
  const pairs: IPairing[] = []

  for (let index = 0; index < order.length; index += 2) {
    const white = order[index]
    if (!white) {
      continue
    }
    pairs.push({ white, black: order[index + 1] ?? null, games: [] })
  }

  return pairs
}

function popBye(pairs: IPairing[]): string | null {
  const last = pairs[pairs.length - 1]
  if (!last || last.black) {
    return null
  }
  pairs.pop()
  return last.white
}

function shuffle(names: string[]): string[] {
  const order = [...names]

  for (let index = order.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(Math.random() * (index + 1))
    const current = order[index]
    order[index] = order[swap] ?? current
    order[swap] = current
  }

  return order
}
