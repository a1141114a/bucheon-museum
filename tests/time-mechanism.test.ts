import {describe,it,expect} from 'vitest'
import {gameReducer,initialState,parseSave} from '../src/state/game'
import {fragmentIds} from '../src/state/restoration'
import {alignedPainting,artworkPositions,freshPaintings,paintingWalkable,parsePaintings,type Pose} from '../src/state/paintings'
const pose=(x=0,z=-4.8,yaw=0,pitch=0):Pose=>({x,z,yaw,pitch})
const unlocked=()=>parseSave(JSON.stringify({...initialState,restoration:{...initialState.restoration,started:true,placed:fragmentIds},gallery:{clues:['west','east','rear'],opened:true}}))
describe('formal painting chapter replaces the gear mechanism',()=>{
 it('keeps the entrance gated and ignores archived gear actions',()=>{
  expect(gameReducer(initialState,{type:'photo-start'})).toBe(initialState)
  const s=unlocked();for(const a of [{type:'time-check'},{type:'time-hint'},{type:'time-rotate',ring:0,direction:1}] as const)expect(gameReducer(s,a)).toBe(s)
 })
 it('requires nearby collection and fixed placement with the camera facing the frame',()=>{
  let s=gameReducer(unlocked(),{type:'photo-start'})
  expect(gameReducer(s,{type:'photo-find',pose:pose(0,8)})).toBe(s)
  expect(gameReducer(s,{type:'photo-place',pose:pose()})).toBe(s)
  s=gameReducer(s,{type:'photo-find',pose:pose(...artworkPositions[0])})
  expect(gameReducer(s,{type:'photo-place',pose:pose(0,-4.8,Math.PI)})).toBe(s)
  s=gameReducer(s,{type:'photo-place',pose:pose()});expect(s.photo.placed).toEqual([1])
  expect(gameReducer(s,{type:'photo-enter',pose:pose()})).toBe(s)
  expect(gameReducer(s,{type:'photo-enter',pose:pose(0,-7.6)}).photo.room).toBe(1)
 })
 it('supports all five worlds and a key-gated ending without awarding points',()=>{
  let s=gameReducer(unlocked(),{type:'photo-start'});const before=s.score
  for(let room=0;room<4;room++){
   s=gameReducer(s,{type:'photo-find',pose:pose(...artworkPositions[room])})
   s=gameReducer(s,{type:'photo-place',pose:pose()})
   s=gameReducer(s,{type:'photo-enter',pose:pose(0,-7.6)})
   expect(s.photo.room).toBe(room+1)
   expect(parseSave(JSON.stringify(s)).photo).toEqual(s.photo)
  }
  expect(gameReducer(s,{type:'photo-finish',pose:pose(0,-8)})).toBe(s)
  s=gameReducer(s,{type:'photo-key',pose:pose(...artworkPositions[4])})
  expect(gameReducer(s,{type:'photo-finish',pose:pose(0,5)})).toBe(s)
  s=gameReducer(s,{type:'photo-finish',pose:pose(0,-8)})
  expect(s.completedLevels).toEqual([1,2,3]);expect(s.score).toBe(before)
  expect(gameReducer(s,{type:'photo-finish',pose:pose(0,-8)})).toBe(s)
  const reset=gameReducer(s,{type:'photo-restart'});expect(reset.photo).toEqual({...freshPaintings(),entered:true});expect(reset.gallery).toEqual(s.gallery);expect(reset.restoration).toEqual(s.restoration);expect(reset.score).toBe(before)
 })
 it('migrates old completion without erasing the first two chapters or collections',()=>{
  const s=unlocked(),old=parseSave(JSON.stringify({...s,artifacts:{'bcm-937':'unlocked'},time:{rings:[0,1,2],hints:3,attempts:6,solved:true},completedLevels:[1,2,3],score:99999}))
  expect(old.completedLevels).toEqual([1,2]);expect(old.artifacts['bcm-937']).toBe('unlocked');expect(old.photo).toEqual(freshPaintings());expect(old.score).toBe(s.score+10)
 })
 it('sanitizes incomplete chains and nonfinite camera coordinates',()=>{
  expect(parsePaintings({schema:1,entered:true,room:4,found:[1,3,4],placed:[1,3,4],key:true,finished:true}).room).toBe(1)
  expect(alignedPainting(pose(NaN))).toBe(false);expect(alignedPainting(pose(0,-4.8,0,.8))).toBe(false)
  expect(parsePaintings(null)).toEqual(freshPaintings())
 })
 it('keeps paths open around sculptures, furniture, fountain and bridge',()=>{
  expect(paintingWalkable(0,-3.2,-.7)).toBe(false);expect(paintingWalkable(0,0,3.5)).toBe(true)
  expect(paintingWalkable(0,2.3,0)).toBe(false);expect(paintingWalkable(0,3.7,0)).toBe(true)
  expect(paintingWalkable(1,3.8,0)).toBe(false);expect(paintingWalkable(4,0,-1.7)).toBe(false)
  expect(paintingWalkable(4,3,-1.7)).toBe(true);expect(paintingWalkable(4,0,-7.6)).toBe(true);expect(paintingWalkable(4,0,-8.2)).toBe(false)
 })
})

