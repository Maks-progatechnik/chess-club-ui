export function playerPath(name: string): string {
  return `/players/${encodeURIComponent(name)}`
}
