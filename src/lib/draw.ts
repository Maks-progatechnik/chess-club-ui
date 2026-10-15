export type DrawGroup = 'beginner' | 'advanced'

export interface IPairing {
  white: string
  black: string | null
}

export function drawGroup(names: string[]): IPairing[] {
  const order = shuffle(names)
  const pairs: IPairing[] = []

  for (let index = 0; index < order.length; index += 2) {
    const white = order[index]
    if (!white) {
      continue
    }
    pairs.push({ white, black: order[index + 1] ?? null })
  }

  return pairs
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
