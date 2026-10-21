import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import type { CSSProperties, KeyboardEvent, ReactNode } from 'react'
import { Chessboard } from 'react-chessboard'
import type { ChessboardOptions } from 'react-chessboard'
import { buttonVariants } from '@/components/ui/button'
import { replayMoveList } from '@/lib/chess-replay'
import type { IGameReplay } from '@/lib/chess-replay'
import { cn } from '@/lib/utils'

interface IGameBoardProps {
  moveList: string | null
  boardId: string
  details: ReactNode
  action: ReactNode
}

interface IReplayControlsProps {
  ply: number
  total: number
  onPly: (ply: number) => void
}

interface IMoveListProps {
  replay: IGameReplay
  ply: number
  onPly: (ply: number) => void
}

const lastMoveStyle: CSSProperties = {
  backgroundColor: 'color-mix(in oklab, #e2b340 55%, transparent)',
}

export function GameBoard(props: IGameBoardProps) {
  const { moveList, boardId, details, action } = props
  const replay = useMemo(() => replayMoveList(moveList), [moveList])

  if (!replay) {
    return (
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          {details}
          <p className="mt-3 text-sm text-muted-foreground">Chess.com did not return moves for this game.</p>
        </div>
        <div className="shrink-0">{action}</div>
      </div>
    )
  }

  return <ReplayView action={action} boardId={boardId} details={details} replay={replay} />
}

interface IReplayViewProps {
  boardId: string
  replay: IGameReplay
  details: ReactNode
  action: ReactNode
}

function ReplayView(props: IReplayViewProps) {
  const { boardId, replay, details, action } = props
  const [ply, setPly] = useState(replay.moves.length)

  useEffect(() => {
    setPly(replay.moves.length)
  }, [replay])

  const fen = replay.fens[ply] ?? replay.fens[0] ?? ''
  const id = `game-${boardId.replace(/[^a-zA-Z0-9]/g, '')}`
  const current = ply > 0 ? replay.moves[ply - 1] : null
  const squareStyles: Record<string, CSSProperties> = {}
  if (current) {
    squareStyles[current.from] = lastMoveStyle
    squareStyles[current.to] = lastMoveStyle
  }

  const options: ChessboardOptions = {
    id,
    position: fen,
    allowDragging: false,
    allowDrawingArrows: false,
    animationDurationInMs: 180,
    boardStyle: { width: '100%', borderRadius: '12px' },
    squareStyles,
  }

  function onKey(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === 'ArrowLeft') {
      event.preventDefault()
      setPly((currentPly) => Math.max(0, currentPly - 1))
    }
    if (event.key === 'ArrowRight') {
      event.preventDefault()
      setPly((currentPly) => Math.min(replay.moves.length, currentPly + 1))
    }
  }

  return (
    <div className="flex items-start gap-3 outline-none" onKeyDown={onKey} tabIndex={0}>
      <div className="min-w-0 flex-1">
        {details}
        <div className="mt-6">
          <p className="text-sm font-bold">{plyLabel(replay, ply)}</p>
          <MoveList onPly={setPly} ply={ply} replay={replay} />
        </div>
      </div>
      <div className="flex w-36 shrink-0 flex-col items-end gap-3 sm:w-48">
        {action}
        <Chessboard options={options} />
        <ReplayControls onPly={setPly} ply={ply} total={replay.moves.length} />
      </div>
    </div>
  )
}

function ReplayControls(props: IReplayControlsProps) {
  const { ply, total, onPly } = props

  return (
    <div className="flex items-center justify-end gap-2">
      <button
        aria-label="Start"
        className={cn(buttonVariants({ size: 'icon-sm', variant: 'outline' }))}
        disabled={ply === 0}
        onClick={() => onPly(0)}
        type="button"
      >
        <ChevronsLeft />
      </button>
      <button
        aria-label="Previous move"
        className={cn(buttonVariants({ size: 'icon-sm', variant: 'outline' }))}
        disabled={ply === 0}
        onClick={() => onPly(Math.max(0, ply - 1))}
        type="button"
      >
        <ChevronLeft />
      </button>
      <button
        aria-label="Next move"
        className={cn(buttonVariants({ size: 'icon-sm', variant: 'outline' }))}
        disabled={ply === total}
        onClick={() => onPly(Math.min(total, ply + 1))}
        type="button"
      >
        <ChevronRight />
      </button>
      <button
        aria-label="Final position"
        className={cn(buttonVariants({ size: 'icon-sm', variant: 'outline' }))}
        disabled={ply === total}
        onClick={() => onPly(total)}
        type="button"
      >
        <ChevronsRight />
      </button>
    </div>
  )
}

function MoveList(props: IMoveListProps) {
  const { replay, ply, onPly } = props

  return (
    <div className="mt-3 flex flex-wrap gap-x-1 gap-y-1">
      {replay.moves.map((move, index) => {
        const movePly = index + 1
        const number = Math.floor(index / 2) + 1
        return (
          <button
            className={cn(
              'rounded-md px-1.5 py-0.5 text-sm tabular-nums hover:bg-muted',
              movePly === ply && 'bg-muted font-bold',
            )}
            key={movePly}
            onClick={() => onPly(movePly)}
            type="button"
          >
            {index % 2 === 0 ? <span className="mr-1 text-muted-foreground">{number}.</span> : null}
            {move.san}
          </button>
        )
      })}
    </div>
  )
}

function plyLabel(replay: IGameReplay, ply: number): string {
  if (ply === 0) {
    return 'Starting position'
  }
  const move = replay.moves[ply - 1]
  if (!move) {
    return 'Starting position'
  }
  const number = Math.ceil(ply / 2)
  return ply % 2 === 1 ? `${number}. ${move.san}` : `${number}... ${move.san}`
}
