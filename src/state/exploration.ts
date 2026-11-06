export const movement = {forward:0,side:0}
// Camera radius included in obstacle bounds, so the player cannot enter plinths.
export function isWalkable(x:number,z:number) {
  if(x < -6.4 || x > 6.4 || z < -4.3 || z > 7.5)return false
  if(Math.abs(x)<1.45 && Math.abs(z)<1.35)return false
  if(Math.abs(Math.abs(x)-4)<1 && Math.abs(z+2)<1)return false
  if(Math.abs(x)<.78 && Math.abs(z+3.55)<.63)return false
  return true
}

export const clueIds = ['west', 'east', 'rear'] as const
export type ClueId = typeof clueIds[number]
export type Station = ClueId | 'chest'
export const stations = {
  west: [-4, -2],
  east: [4, -2],
  rear: [0, -3.55],
  chest: [0, 0],
} satisfies Record<Station, [number, number]>

export interface GalleryProgress {
  clues: ClueId[]
  opened: boolean
}

export function parseGallery(raw: unknown): GalleryProgress {
  if (!raw || typeof raw !== 'object') return {clues: [], opened: false}
  const record = raw as Record<string, unknown>
  const saved = record.clues
  const clues = clueIds.filter(id => Array.isArray(saved) && saved.includes(id))
  return {clues, opened: clues.length === clueIds.length && record.opened === true}
}

export function nearbyStation(x: number, z: number): Station | null {
  let result: Station | null = null
  let distance = 2.35
  for (const id of [...clueIds, 'chest'] as const) {
    const [sx, sz] = stations[id]
    const d = Math.hypot(sx - x, sz - z)
    if (d < distance) {
      result = id
      distance = d
    }
  }
  return result
}
