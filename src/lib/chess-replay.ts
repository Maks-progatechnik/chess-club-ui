import { decode } from '@savi2w/chess-tcn'
import { Chess } from 'chess.js'
import type { Square } from 'chess.js'

export interface IReplayMove {
  san: string
  from: string
  to: string
}

export interface IGameReplay {
  fens: string[]
  moves: IReplayMove[]
}

interface ITcnStep {
  from?: string
  to?: string
  promotion?: string
}

type Promotion = 'q' | 'r' | 'b' | 'n'

export function replayMoveList(moveList: string | null): IGameReplay | null {
  if (!moveList || moveList.length < 2 || moveList.length % 2 !== 0) {
    return null
  }

  const chess = new Chess()
  const fens = [chess.fen()]
  const moves: IReplayMove[] = []

  for (let index = 0; index < moveList.length; index += 2) {
    const step = decode(moveList.slice(index, index + 2)) as ITcnStep
    const from = squareOf(step.from)
    const to = squareOf(step.to)
    if (!from || !to) {
      return null
    }
    const played = chess.move({
      from,
      to,
      promotion: promotionOf(step.promotion),
    })
    if (!played) {
      return null
    }
    fens.push(chess.fen())
    moves.push({ san: played.san, from: played.from, to: played.to })
  }

  return { fens, moves }
}

function squareOf(value: string | undefined): Square | null {
  if (!value || !/^[a-h][1-8]$/.test(value)) {
    return null
  }
  return value as Square
}

function promotionOf(value: string | undefined): Promotion | undefined {
  if (value === 'q' || value === 'r' || value === 'b' || value === 'n') {
    return value
  }
  return undefined
}
