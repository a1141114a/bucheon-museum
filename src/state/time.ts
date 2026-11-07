export const timeArtifactIds=['bcm-937','bcm-exh-1659-tae','bcm-1760'] as const
export const timeSolution=[0,1,2] as const
export interface TimeProgress {
  rings:[number,number,number]
  hints:number
  attempts:number
  solved:boolean
}
export const freshTime=():TimeProgress=>({rings:[1,2,0],hints:0,attempts:0,solved:false})
export const timeAligned=(rings:readonly number[])=>rings.length===3&&rings.every((value,index)=>value===timeSolution[index])
export const timeScore=(time:TimeProgress)=>time.solved?180-time.hints*5:0
export function parseTime(value:unknown):TimeProgress {
  const fresh=freshTime()
  if(!value||typeof value!=='object')return fresh
  const data=value as Record<string,unknown>
  if(Array.isArray(data.rings)&&data.rings.length===3&&data.rings.every(v=>Number.isInteger(v)&&v>=0&&v<=2)) {
    fresh.rings=[data.rings[0],data.rings[1],data.rings[2]]
  }
  if(typeof data.hints==='number'&&Number.isInteger(data.hints))fresh.hints=Math.min(3,Math.max(0,data.hints))
  if(typeof data.attempts==='number'&&Number.isSafeInteger(data.attempts))fresh.attempts=Math.max(0,data.attempts)
  fresh.solved=data.solved===true&&timeAligned(fresh.rings)
  return fresh
}
