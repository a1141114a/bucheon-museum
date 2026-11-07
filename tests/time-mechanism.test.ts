import { describe,expect,it } from 'vitest'
import { gameReducer, initialState, isLevelUnlocked, parseSave } from '../src/state/game'
import { fragmentIds } from '../src/state/restoration'
import { freshTime, parseTime, timeAligned, timeScore } from '../src/state/time'

function unlocked(){
  return parseSave(JSON.stringify({...initialState,restoration:{...initialState.restoration,started:true,placed:fragmentIds},
    gallery:{clues:['west','east','rear'],opened:true}}))
}

describe('time mechanism',()=>{
  it('locks actions until chapter two is complete',()=>{
    expect(gameReducer(initialState,{type:'time-check'})).toBe(initialState)
    expect(gameReducer(initialState,{type:'time-rotate',ring:0,direction:1})).toBe(initialState)
    expect(isLevelUnlocked(unlocked(),3)).toBe(true)
  })

  it('does not complete on a wrong alignment, then completes and awards only once',()=>{
    let game=unlocked()
    const score=game.score
    game=gameReducer(game,{type:'time-check'})
    expect(game.time.attempts).toBe(1)
    expect(game.time.solved).toBe(false)
    game=gameReducer(game,{type:'time-hint'})
    for(const ring of [0,1,2])game=gameReducer(game,{type:'time-rotate',ring,direction:-1})
    expect(timeAligned(game.time.rings)).toBe(true)
    game=gameReducer(game,{type:'time-check'})
    expect(game.completedLevels).toEqual([1,2,3])
    expect(game.score).toBe(score+175)
    expect(gameReducer(game,{type:'time-check'})).toBe(game)
    expect(gameReducer(game,{type:'time-rotate',ring:0,direction:1})).toBe(game)
    expect(parseSave(JSON.stringify(game))).toEqual(game)
  })

  it('caps hints and keeps other chapters and collection records on replay',()=>{
    let game=unlocked()
    for(let i=0;i<8;i++)game=gameReducer(game,{type:'time-hint'})
    expect(game.time.hints).toBe(3)
    const before={...game,artifacts:{'bcm-937':'discovered' as const}}
    const restarted=gameReducer(before,{type:'time-restart'})
    expect(restarted.time).toEqual(freshTime())
    expect(restarted.restoration).toBe(before.restoration)
    expect(restarted.gallery).toBe(before.gallery)
    expect(restarted.artifacts).toEqual(before.artifacts)
  })

  it('migrates old saves and sanitizes ring data',()=>{
    const raw=JSON.parse(JSON.stringify(unlocked()))
    delete raw.time
    expect(parseSave(JSON.stringify(raw)).time).toEqual(freshTime())
    expect(parseTime({rings:[4,0,1],hints:99,solved:true}).solved).toBe(false)
    expect(parseTime({rings:[0,1,2],solved:true}).solved).toBe(true)
    expect(timeScore({...freshTime(),solved:false,hints:3})).toBe(0)
    expect(gameReducer(unlocked(),{type:'time-rotate',ring:9,direction:1})).toEqual(unlocked())
  })
})
