const POINT_TONES = [
  'bg-[#ddd9d3]',
  'bg-[#c9daf5]',
  'bg-[#b7d7b0]',
  'bg-[#9fd9cf]',
  'bg-[#f3d19a]',
  'bg-[#f0c0a4]',
  'bg-[#e7aeb8]',
  'bg-[#d4b8ea]',
  'bg-[#c5c9a4]',
]

export function pointsTone(points: number): string {
  const index = Math.max(0, Math.round(points * 2))
  return POINT_TONES[index] ?? POINT_TONES[POINT_TONES.length - 1] ?? 'bg-muted'
}

export function formatPoints(points: number): string {
  return Number.isInteger(points) ? String(points) : points.toFixed(1)
}
