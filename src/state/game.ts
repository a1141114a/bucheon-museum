import {freshTime,type TimeProgress} from './time'
import {freshPaintings,parsePaintings,nearPoint,nearPortal,alignedPainting,artworkPositions,type PaintingProgress,type Pose} from './paintings'
import {clueIds,parseGallery,type ClueId,type GalleryProgress} from './exploration'
import { artifacts, storageJarArtifact } from '../data/artifacts'
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
  gallery: GalleryProgress
  time: TimeProgress
  photo: PaintingProgress
}
export const initialState: GameState = {version:2, language:'zh', artifacts:{}, score:0, completedLevels:[], hintsUsed:0,restoration:freshRestoration(),gallery:{clues:[],opened:false},time:freshTime(),photo:freshPaintings()}
export type Action = {type:'language'; language:Language} | {type:'discover'|'unlock'; id:string} | {type:'hint'} | {type:'reset'} | {type:'restore-start'|'restore-restart'|'restore-hint'} | {type:'restore-rotate';id:string;direction:1|-1} | {type:'restore-place';id:string;target:string} | {type:'gallery-clue';id:ClueId} | {type:'gallery-open'|'gallery-restart'} | {type:'time-rotate';ring:number;direction:1|-1} | {type:'time-hint'|'time-check'|'time-restart'}
function withProgress(state:GameState,restoration=state.restoration,gallery=state.gallery,time=state.time):GameState {
  const score = Object.values(state.artifacts).filter(status => status === 'unlocked').length * 10
    + restorationScore(restoration) + gallery.clues.length * 15 + (gallery.opened ? 60 : 0)
  const completedLevels: LevelId[] = []
  if (restoration.placed.length === 9) completedLevels.push(1)
  if (gallery.opened) completedLevels.push(2)
  if (state.photo.finished) completedLevels.push(3)
  return {...state,restoration,gallery,time,score,completedLevels}
}
const validId = (id:string) => artifacts.some(a=>a.id===id)
export const statusOf = (s:GameState,id:string):ArtifactStatus => s.artifacts[id] || 'locked'
export type PaintingAction = {type:'photo-start'|'photo-restart'} | {type:'photo-find'|'photo-place'|'photo-enter'|'photo-key'|'photo-finish';pose:Pose}
export function gameReducer(state:GameState, action:Action|PaintingAction):GameState {
  if(action.type.startsWith('photo-')) {
    if(!isLevelUnlocked(state,3))return state
    const a=action as PaintingAction,p=state.photo,n=p.room+1
    let photo=p
    if(a.type==='photo-start')photo={...p,entered:true}
    else if(a.type==='photo-restart')photo={...freshPaintings(),entered:true}
    else if(p.entered&&!p.finished&&'pose' in a){
      if(a.type==='photo-find'&&p.room<4&&!p.found.includes(n)&&nearPoint(a.pose,artworkPositions[p.room]))photo={...p,found:[...p.found,n]}
      if(a.type==='photo-place'&&p.found.includes(n)&&!p.placed.includes(n)&&alignedPainting(a.pose))photo={...p,placed:[...p.placed,n]}
      if(a.type==='photo-enter'&&p.placed.includes(n)&&nearPortal(a.pose))photo={...p,room:n}
      if(a.type==='photo-key'&&p.room===4&&nearPoint(a.pose,artworkPositions[4]))photo={...p,key:true}
      if(a.type==='photo-finish'&&p.room===4&&p.key&&nearPortal(a.pose))photo={...p,finished:true}
    }
    return photo===p?state:withProgress({...state,photo})
  }
  switch(action.type) {
    case 'language': return {...state, language:action.language}
    case 'reset': return {...initialState, language:state.language}
    case 'hint': return {...state, hintsUsed:state.hintsUsed+1}
    case 'restore-start': return withProgress(state,{...state.restoration,started:true})
    case 'restore-restart': return withProgress(state,{...freshRestoration(),started:true})
    case 'restore-hint': return state.restoration.started&&state.restoration.hints<3&&state.restoration.placed.length<9?withProgress(state,{...state.restoration,hints:state.restoration.hints+1}):state
    case 'restore-rotate': return fragmentIds.includes(action.id)&&!state.restoration.placed.includes(action.id)?withProgress(state,{...state.restoration,rotations:{...state.restoration.rotations,[action.id]:(rotationOf(state.restoration,action.id)+action.direction+4)%4}}):state
    case 'restore-place': return placementResult(state.restoration,action.id,action.target)==='correct'?withProgress(state,{...state.restoration,placed:[...state.restoration.placed,action.id]}):state
    case 'gallery-clue':
      if (!isLevelUnlocked(state,2) || !clueIds.includes(action.id) || state.gallery.clues.includes(action.id)) return state
      return withProgress(state,state.restoration,{...state.gallery,clues:[...state.gallery.clues,action.id]})
    case 'gallery-restart':
      if (!isLevelUnlocked(state,2)) return state
      return withProgress(state,state.restoration,{clues:[],opened:false})
    case 'gallery-open':
      if (!isLevelUnlocked(state,2) || state.gallery.opened || state.gallery.clues.length !== clueIds.length) return state
      return withProgress(state,state.restoration,{...state.gallery,opened:true})
    case 'time-rotate':
    case 'time-hint':
    case 'time-check':
    case 'time-restart':
      return state // Archived gear chapter cannot change the replacement chapter.
    case 'discover': return validId(action.id) && statusOf(state,action.id)==='locked'
      ? {...state,artifacts:{...state.artifacts,[action.id]:'discovered'}} : state
    case 'unlock': return validId(action.id) && statusOf(state,action.id)==='discovered'
      ? {...state,artifacts:{...state.artifacts,[action.id]:'unlocked'}, score:state.score+10} : state
  }
  return state
}
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
      const saved=values as Record<string,unknown>
      const v=saved[a.id] ?? (a.id===storageJarArtifact.id ? saved['test-vessel'] : undefined)
      if(v==='discovered'||v==='unlocked') records[a.id]=v
    }
    const restoration=candidate.version===2?parseRestoration(candidate.restoration):freshRestoration()
    const gallery=candidate.version===2?parseGallery(candidate.gallery):initialState.gallery
    const hintsUsed=typeof candidate.hintsUsed==='number'&&Number.isSafeInteger(candidate.hintsUsed)?Math.max(0,candidate.hintsUsed):0
    return withProgress({...initialState,language,artifacts:records,hintsUsed,photo:gallery.opened?parsePaintings(candidate.photo):freshPaintings()},restoration,gallery,freshTime())
  } catch { return {...initialState} }
}
