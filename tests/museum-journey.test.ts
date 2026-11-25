import {describe,it,expect} from 'vitest'
import {readFileSync} from 'node:fs'
import {createHash} from 'node:crypto'
import {gameReducer,initialState,parseSave,isLevelUnlocked} from '../src/state/game'
import {fragmentIds} from '../src/state/restoration'
import {freshPaintings} from '../src/state/paintings'
import {museumPortal,nearMuseumPortal} from '../src/state/museumJourney'
import {museumWalkable} from '../src/data/modernMuseum'
import {storageJarArtifact} from '../src/data/artifacts'
const completed=()=>parseSave(JSON.stringify({...initialState,language:'ko',artifacts:{[storageJarArtifact.id]:'unlocked'},restoration:{...initialState.restoration,started:true,placed:fragmentIds},gallery:{clues:['west','east','rear'],opened:true},photo:{schema:1,entered:true,room:4,found:[1,2,3,4],placed:[1,2,3,4],key:true,finished:true}}))
describe('modern museum prologue and painting entry',()=>{
 it('starts a fresh chapter run at the portal, retaining the collection and language',()=>{
  const old=completed(),s=gameReducer(old,{type:'journey-start'})
  expect(s.language).toBe('ko');expect(s.artifacts).toEqual(old.artifacts);expect(s.restoration.started).toBe(true);expect(s.restoration.placed).toEqual([]);expect(s.gallery).toEqual({clues:[],opened:false});expect(s.photo).toEqual(freshPaintings());expect(s.completedLevels).toEqual([]);expect(isLevelUnlocked(s,2)).toBe(false);expect(parseSave(JSON.stringify(s))).toEqual(s)
 })
 it('always enters the first painting from the gallery even with an old finished save',()=>{
  const old=completed(),s=gameReducer(old,{type:'photo-start'})
  expect(s.photo).toEqual({...freshPaintings(),entered:true});expect(s.completedLevels).toEqual([1,2]);expect(s.artifacts[storageJarArtifact.id]).toBe('unlocked');expect(s.score).toBe(old.score);expect(parseSave(JSON.stringify(s)).photo.room).toBe(0)
 })
 it('keeps direct chapter resume and the final modern museum ending intact',()=>{
  expect(completed().photo.finished).toBe(true)
  let s=gameReducer(completed(),{type:'photo-start'});expect(gameReducer(s,{type:'photo-finish',pose:{x:0,z:-8,yaw:0,pitch:0}})).toBe(s)
  s={...completed(),photo:{...completed().photo,finished:false}}
  expect(gameReducer(s,{type:'photo-finish',pose:{x:0,z:-8,yaw:0,pitch:0}}).photo.finished).toBe(true)
 })
 it('does not allow a locked gallery entry to bypass the first two chapters',()=>{
  expect(gameReducer(initialState,{type:'photo-start'})).toBe(initialState)
 })
 it('clears downstream painting completion when replaying the gallery',()=>{
  const s=gameReducer(completed(),{type:'gallery-restart'});expect(s.photo).toEqual(freshPaintings());expect(s.completedLevels).toEqual([1]);expect(parseSave(JSON.stringify(s)).photo).toEqual(freshPaintings())
 })
 it('reveals the portal only near a reachable, clear section of the end wall',()=>{
  const p={x:-1.45,z:-4.2};expect(museumWalkable(5,p.x,p.z)).toBe(true);expect(nearMuseumPortal(p)).toBe(true);expect(nearMuseumPortal({x:1.1,z:5.7})).toBe(false);expect(nearMuseumPortal({x:1.1,z:0})).toBe(false);expect(nearMuseumPortal({x:NaN,z:-5})).toBe(false)
 })
})

it('ships the complete user-supplied portal movie and four-panel comic without modifying source bytes',()=>{
 const m=JSON.parse(readFileSync(new URL('../public/ui/journey/manifest.json',import.meta.url),'utf8'))
 expect(m.introOnly).toBe(true)
 for(const key of ['video','comic']){const a=m[key],b=readFileSync(new URL('../public/ui/journey/'+a.file,import.meta.url));expect(b.length).toBe(a.bytes);expect(createHash('sha256').update(b).digest('hex')).toBe(a.sha256)}
 const png=readFileSync(new URL('../public/ui/journey/arrival-comic.png',import.meta.url));expect(png.readUInt32BE(16)).toBe(1536);expect(png.readUInt32BE(20)).toBe(1024)
 const mp4=readFileSync(new URL('../public/ui/journey/museum-portal.mp4',import.meta.url));expect(mp4.subarray(4,8).toString()).toBe('ftyp')
})
