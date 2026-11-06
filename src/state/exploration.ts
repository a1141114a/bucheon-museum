export const movement = {forward:0,side:0}
export const galleryBounds = {width:28,depth:26}
export const gallerySpawn = [0,1.75,10.8] as const

export const displays = [
  {id:'bcm-1072',x:-5.2,z:4.4},
  {id:'bcm-937',x:5.2,z:4.4},
  {id:'bcm-exh-1659-tae',x:-5.2,z:-4.5},
  {id:'bcm-569',x:5.2,z:-4.5},
] as const

export const clueCover = [
  {x:-10.65,z:-6.9,width:3.8,depth:.95,height:1.12},
  {x:10.6,z:6.4,width:3.4,depth:1.0,height:1.5},
  {x:.1,z:-9.5,width:4.4,depth:1.1,height:1.4},
] as const

const obstacles = [
  {x:0,z:0,width:3.4,depth:3},
  ...displays.map(({x,z}) => ({x,z,width:2.4,depth:1.7})),
  ...clueCover,
]

function hitsObstacle(x:number,z:number,padding:number) {
  return obstacles.some(box => Math.abs(x-box.x)<box.width/2+padding && Math.abs(z-box.z)<box.depth/2+padding)
}

export function isWalkable(x:number,z:number) {
  return Math.abs(x)<galleryBounds.width/2-.48 && Math.abs(z)<galleryBounds.depth/2-.48 && !hitsObstacle(x,z,.33)
}

export const clueIds = ['west','east','rear'] as const
export type ClueId = typeof clueIds[number]
export type Station = ClueId | 'chest'
export const stations = {
  west: [-11.8,-7.73],
  east: [11.24,7.23],
  rear: [.9,-10.4],
  chest: [0,0],
} satisfies Record<Station,[number,number]>

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

export function nearbyStation(x:number,z:number):Station|null {
  if (Math.hypot(x,z)<2.55) return 'chest'
  for (const id of clueIds) {
    const [sx,sz]=stations[id]
    if (Math.hypot(sx-x,sz-z)>1.28) continue
    // A seal cannot be noticed through the cabinet or divider it is hidden behind.
    if ([.15,.35,.55,.75,.95].every(t=>!hitsObstacle(x+(sx-x)*t,z+(sz-z)*t,0))) return id
  }
  return null
}

export function nearbyExhibit(x:number,z:number):string|null {
  return displays.find(d => Math.abs(x-d.x)<1.75 && z-d.z>1.12 && z-d.z<3.0)?.id ?? null
}
