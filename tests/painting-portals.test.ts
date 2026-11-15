import {describe,it,expect} from 'vitest'
import {PerspectiveCamera,Vector3,Vector4} from 'three'
import {insidePortal,throughPortal,parsePaintings,type Pose} from '../src/state/paintings'
import {configurePortalCamera} from '../src/components/portalProjection'
import {gameReducer,initialState,parseSave} from '../src/state/game'
import {fragmentIds} from '../src/state/restoration'
const pose=(z:number,yaw=0,x=0):Pose=>({x,z,yaw,pitch:.05})
const progress={schema:1,entered:true,room:4,found:[1,2,3,4],placed:[1,2,3,4],key:true,finished:false}
const game=()=>parseSave(JSON.stringify({...initialState,restoration:{...initialState.restoration,started:true,placed:fragmentIds},gallery:{clues:['west','east','rear'],opened:true},photo:progress}))
describe('continuous two-way painting portals',()=>{
 it('accepts either walking direction only within the actual frame opening',()=>{
  for(const yaw of [0,Math.PI,-1.2]){expect(insidePortal(pose(-8.35,yaw),'forward',1)).toBe(true);expect(insidePortal(pose(8.35,yaw),'back',1)).toBe(true)}
  expect(insidePortal(pose(-8.35,0,1),'forward',1)).toBe(false)
  expect(insidePortal(pose(-5),'forward',1)).toBe(false)
  expect(insidePortal(pose(NaN),'back',1)).toBe(false)
 })
 it('preserves lateral position and look direction across both openings',()=>{
  const p=pose(-8.37,.42,.21),forward=throughPortal(p,'forward')
  expect(forward).toEqual({...p,z:8.30})
  const back=throughPortal({...forward,z:8.37},'back')
  expect(back).toEqual({...p,z:-8.30})
 })
 it('retains future placements and the key when returning, saving and entering again',()=>{
  let s=game();const score=s.score
  expect(gameReducer(s,{type:'photo-back',pose:pose(0)})).toBe(s)
  for(let room=4;room>0;room--){s=gameReducer(s,{type:'photo-back',pose:pose(8.35,Math.PI)});expect(s.photo.room).toBe(room-1);s=parseSave(JSON.stringify(s));expect(s.photo.placed).toEqual([1,2,3,4]);expect(s.photo.found).toEqual([1,2,3,4]);expect(s.photo.key).toBe(true)}
  expect(gameReducer(s,{type:'photo-back',pose:pose(8.35)})).toBe(s)
  for(let room=0;room<4;room++){s=gameReducer(s,{type:'photo-enter',pose:pose(-8.35,Math.PI)});expect(s.photo.room).toBe(room+1)}
  expect(s.score).toBe(score)
  expect(parsePaintings({...progress,room:1}).key).toBe(true)
 })
 it('matches destination screen coordinates while clipping the outer wall',()=>{
  for(const direction of ['forward','back'] as const){
   const forward=direction==='forward',source=new PerspectiveCamera(55,1.5,.08,70),target=new PerspectiveCamera()
   source.position.set(.2,1.65,forward?-7:7);source.rotation.set(.07,forward?.1:Math.PI+.1,0,'YXZ');source.updateMatrixWorld()
   configurePortalCamera(source,target,direction)
   const shift=forward?16.8:-16.8
   for(const xyz of [[.4,1.8,forward?-12:12],[-1,2,forward?-14:14]]){
    const local=new Vector3(...xyz),destination=local.clone();destination.z+=shift
    const a=local.project(source),b=destination.project(target)
    expect(b.x).toBeCloseTo(a.x,8);expect(b.y).toBeCloseTo(a.y,8);expect(Math.abs(b.z)).toBeLessThan(1)
   }
   const wall=new Vector4(0,1.7,forward?9:-9,1).applyMatrix4(target.matrixWorldInverse).applyMatrix4(target.projectionMatrix)
   expect(wall.z).toBeLessThan(-wall.w)
  }
 })
})

