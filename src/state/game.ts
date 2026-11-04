import { artifacts } from '../data/artifacts'
import type { ArtifactStatus, Language, LevelId } from '../types'
import {freshRestoration,fragmentIds,placementResult,rotationOf,restorationScore,parseRestoration,type RestorationState} from './restoration'
export const STORAGE_KEY = 'bucheon-museum:prototype:v1'
export interface GameState {
  version: 2
  language: Language
  artifacts: Record<string, ArtifactStatus>
  score: number
  completedLevels: LevelId[]
  hintsUsed: number
  restoration: RestorationState
}
export const initialState: GameState = {version:2, language:'zh', artifacts:{}, score:0, completedLevels:[], hintsUsed:0,restoration:freshRestoration()}
export type Action = {type:'language'; language:Language} | {type:'discover'|'unlock'; id:string} | {type:'hint'} | {type:'reset'} | {type:'restore-start'|'restore-restart'|'restore-hint'} | {type:'restore-rotate';id:string;direction:1|-1} | {type:'restore-place';id:string;target:string}
function withRestoration(state:GameState,r:RestorationState):GameState{return {...state,restoration:r,score:Object.values(state.artifacts).filter(x=>x==='unlocked').length*10+restorationScore(r),completedLevels:r.placed.length===9?[1]:[]}}
const validId = (id:string) => artifacts.some(a=>a.id===id)
export const statusOf = (s:GameState,id:string):ArtifactStatus => s.artifacts[id] || 'locked'
export function gameReducer(state:GameState, action:Action):GameState {
  switch(action.type) {
    case 'language': return {...state, language:action.language}
    case 'reset': return {...initialState, language:state.language}
    case 'hint': return {...state, hintsUsed:state.hintsUsed+1}
    case 'restore-start': return withRestoration(state,{...state.restoration,started:true})
    case 'restore-restart': return withRestoration(state,{...freshRestoration(),started:true})
    case 'restore-hint': return state.restoration.started&&state.restoration.hints<3&&state.restoration.placed.length<9?withRestoration(state,{...state.restoration,hints:state.restoration.hints+1}):state
    case 'restore-rotate': return fragmentIds.includes(action.id)&&!state.restoration.placed.includes(action.id)?withRestoration(state,{...state.restoration,rotations:{...state.restoration.rotations,[action.id]:(rotationOf(state.restoration,action.id)+action.direction+4)%4}}):state
    case 'restore-place': return placementResult(state.restoration,action.id,action.target)==='correct'?withRestoration(state,{...state.restoration,placed:[...state.restoration.placed,action.id]}):state
    case 'discover': return validId(action.id) && statusOf(state,action.id)==='locked'
      ? {...state,artifacts:{...state.artifacts,[action.id]:'discovered'}} : state
    case 'unlock': return validId(action.id) && statusOf(state,action.id)==='discovered'
      ? {...state,artifacts:{...state.artifacts,[action.id]:'unlocked'}, score:state.score+10} : state
  }
}
// Level two still shows its development screen, even after level one's completion.
export const isLevelUnlocked = (s:GameState, id:LevelId) => id===1 || (s.completedLevels.includes((id-1) as LevelId))
export function parseSave(raw:string|null):GameState {
  if(!raw) return {...initialState}
  try {
    const data:unknown=JSON.parse(raw)
    if(!data || typeof data!=='object' || !('version' in data) || (data.version!==1&&data.version!==2)) return {...initialState}
    const candidate=data as Record<string,unknown>
    const language:Language=candidate.language==='en'||candidate.language==='ko'?candidate.language:'zh'
    const records:Record<string,ArtifactStatus>={}
    const values=candidate.artifacts
    if(values && typeof values==='object') for(const a of artifacts) {
      const v=(values as Record<string,unknown>)[a.id]
      if(v==='discovered'||v==='unlocked') records[a.id]=v
    }
    const restoration=candidate.version===2?parseRestoration(candidate.restoration):freshRestoration()
    return {version:2,language,artifacts:records,score:Object.values(records).filter(x=>x==='unlocked').length*10+restorationScore(restoration),restoration,
      completedLevels:restoration.placed.length===9?[1]:[],hintsUsed:typeof candidate.hintsUsed==='number'&&Number.isSafeInteger(candidate.hintsUsed)?Math.max(0,candidate.hintsUsed):0}
  } catch { return {...initialState} }
}
