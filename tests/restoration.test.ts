import { storageJarArtifact } from '../src/data/artifacts'
import {describe,it,expect} from 'vitest'
import {gameReducer,initialState,parseSave} from '../src/state/game'
import {fragmentIds,rotationOf,placementResult,parseRestoration,restorationScore} from '../src/state/restoration'
const start=()=>gameReducer(initialState,{type:'restore-start'})
function solve(){let s=start();for(const id of fragmentIds){while(rotationOf(s.restoration,id)!==0)s=gameReducer(s,{type:'restore-rotate',id,direction:1});s=gameReducer(s,{type:'restore-place',id,target:id})}return s}
describe('restoration gameplay',()=>{
  it('requires starting and rejects unknown pieces',()=>{
    expect(placementResult(initialState.restoration,fragmentIds[0],fragmentIds[0])).toBe('invalid')
    expect(gameReducer(start(),{type:'restore-place',id:'unknown',target:'unknown'}).restoration.placed).toEqual([])
  })
  it('gives different feedback for wrong slot and wrong rotation',()=>{
    const s=start();expect(placementResult(s.restoration,fragmentIds[0],fragmentIds[1])).toBe('wrongSlot')
    expect(placementResult(s.restoration,fragmentIds[0],fragmentIds[0])).toBe('wrongRotation')
  })
  it('wraps rotations in both directions',()=>{
    let s=start();const id=fragmentIds[0];for(let i=0;i<5;i++)s=gameReducer(s,{type:'restore-rotate',id,direction:-1})
    expect(rotationOf(s.restoration,id)).toBe(0)
  })
  it('only snaps when identity and orientation match',()=>{
    let s=start();const id=fragmentIds[0]
    expect(gameReducer(s,{type:'restore-place',id,target:id})).toBe(s)
    s=gameReducer(s,{type:'restore-rotate',id,direction:-1});s=gameReducer(s,{type:'restore-place',id,target:id})
    expect(s.restoration.placed).toEqual([id]);expect(s.score).toBe(20)
    expect(gameReducer(s,{type:'restore-place',id,target:id})).toBe(s)
    expect(gameReducer(s,{type:'restore-rotate',id,direction:1})).toBe(s)
  })
  it('caps hints at three and deducts five each',()=>{
    let s=start();for(let i=0;i<7;i++)s=gameReducer(s,{type:'restore-hint'})
    expect(s.restoration.hints).toBe(3);expect(s.score).toBe(0)
    expect(restorationScore({...s.restoration,placed:fragmentIds.slice(0,2)})).toBe(25)
  })
  it('completes only after all nine, awards bonus once',()=>{
    const s=solve();expect(s.completedLevels).toEqual([1]);expect(s.score).toBe(280)
    expect(gameReducer(s,{type:'restore-place',id:fragmentIds[0],target:fragmentIds[0]}).score).toBe(280)
  })
  it('round trips partial and complete progress',()=>{
    const s=solve();expect(parseSave(JSON.stringify(s))).toEqual(s)
    let partial=start();partial=gameReducer(partial,{type:'restore-rotate',id:fragmentIds[0],direction:1})
    expect(parseSave(JSON.stringify(partial))).toEqual(partial)
  })
  it('migrates v1 saves and derives score rather than trusting it',()=>{
    const s=parseSave(JSON.stringify({version:1,language:'en',score:9999,artifacts:{[storageJarArtifact.id]:'unlocked'},restoration:{placed:fragmentIds}}))
    expect(s.version).toBe(2);expect(s.score).toBe(10);expect(s.restoration.placed).toEqual([])
  })
  it('sanitizes duplicate IDs, rotations and hints in loaded progress',()=>{
    const s=parseRestoration({started:false,placed:[fragmentIds[0],fragmentIds[0],'fake'],rotations:{[fragmentIds[1]]:-9},hints:100})
    expect(s.started).toBe(true);expect(s.placed).toEqual([fragmentIds[0]]);expect(s.rotations[fragmentIds[1]]).toBe(3);expect(s.hints).toBe(3)
  })
  it('replay clears only chapter progress and retains journal/language',()=>{
    let s=solve();s=gameReducer(s,{type:'discover',id:storageJarArtifact.id});s=gameReducer(s,{type:'unlock',id:storageJarArtifact.id});s=gameReducer(s,{type:'language',language:'en'});s=gameReducer(s,{type:'restore-restart'})
    expect(s.score).toBe(10);expect(s.language).toBe('en');expect(s.artifacts[storageJarArtifact.id]).toBe('unlocked');expect(s.completedLevels).toEqual([]);expect(s.restoration.placed).toEqual([])
  })
})
