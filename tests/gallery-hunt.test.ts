import { describe, expect, it } from 'vitest'
import { clueIds, nearbyStation } from '../src/state/exploration'
import { gameReducer, initialState, parseSave } from '../src/state/game'
import { fragmentIds } from '../src/state/restoration'

describe('chapter two hunt', () => {
  it('requires chapter one and all three seals, awards points once, and restores progress', () => {
    expect(gameReducer(initialState,{type:'gallery-clue',id:'west'})).toBe(initialState)
    let game = parseSave(JSON.stringify({...initialState,restoration:{...initialState.restoration,started:true,placed:fragmentIds}}))
    const before = game.score
    expect(gameReducer(game,{type:'gallery-open'})).toBe(game)
    for (const id of clueIds) game=gameReducer(game,{type:'gallery-clue',id})
    expect(gameReducer(game,{type:'gallery-clue',id:'east'})).toBe(game)
    game=gameReducer(game,{type:'gallery-open'})
    expect(game.completedLevels).toEqual([1,2])
    expect(game.score).toBe(before+105)
    expect(gameReducer(game,{type:'gallery-open'})).toBe(game)
    expect(parseSave(JSON.stringify(game))).toEqual(game)
  })

  it('recognizes the closest station within reach', () => {
    expect(nearbyStation(0,5.8)).toBeNull()
    expect(nearbyStation(-11.8,-8.5)).toBe('west')
    expect(nearbyStation(-11.8,-6.58)).toBeNull()
    expect(nearbyStation(0,1.8)).toBe('chest')
  })
})
