export const fragmentIds=Array.from({length:9},(_,i)=>`shard_${Math.floor(i/3)}_${i%3}`)
export const trayOrder=[5,0,7,2,8,1,6,4,3].map(i=>fragmentIds[i])
export const initialRotation=(id:string)=>[1,3,2,1,2,3,1,3,2][fragmentIds.indexOf(id)]??0
export interface RestorationState {started:boolean;placed:string[];rotations:Record<string,number>;hints:number}
export const freshRestoration=():RestorationState=>({started:false,placed:[],rotations:{},hints:0})
export const rotationOf=(s:RestorationState,id:string)=>s.rotations[id]??initialRotation(id)
export function placementResult(s:RestorationState,id:string,target:string):'correct'|'wrongSlot'|'wrongRotation'|'invalid'{
  if(!s.started||!fragmentIds.includes(id)||!fragmentIds.includes(target)||s.placed.includes(id))return 'invalid'
  if(id!==target)return 'wrongSlot'
  return rotationOf(s,id)===0?'correct':'wrongRotation'
}
export const restorationScore=(s:RestorationState)=>Math.max(0,s.placed.length*20+(s.placed.length===9?100:0)-s.hints*5)
export function parseRestoration(value:unknown):RestorationState{
  const s=freshRestoration()
  if(!value||typeof value!=='object')return s
  const v=value as Record<string,unknown>
  s.started=v.started===true
  s.placed=Array.isArray(v.placed)?[...new Set(v.placed.filter((id):id is string=>typeof id==='string'&&fragmentIds.includes(id)))]:[]
  if(s.placed.length)s.started=true
  if(v.rotations&&typeof v.rotations==='object')for(const id of fragmentIds){
    const r=(v.rotations as Record<string,unknown>)[id]
    if(typeof r==='number'&&Number.isSafeInteger(r))s.rotations[id]=((r%4)+4)%4
  }
  for(const id of s.placed)s.rotations[id]=0
  s.hints=typeof v.hints==='number'&&Number.isSafeInteger(v.hints)?Math.max(0,Math.min(3,v.hints)):0
  return s
}
