import { describe, expect, it } from 'vitest'
import { coinPuzzleNeighbors, coinPuzzleSolved, createCoinPuzzle, moveCoinTile, solvedCoinPuzzle } from '../src/state/coinPuzzle'

describe('coin slide puzzle',()=>{
  it('keeps moves within the blank tile row or column',()=>{
    expect(coinPuzzleNeighbors(2)).toEqual([5,1])
    expect(moveCoinTile(solvedCoinPuzzle,5)).toEqual([1,2,3,4,5,0,7,8,6])
    expect(moveCoinTile(solvedCoinPuzzle,0)).toBeNull()
  })

  it('generates a reachable board and accepts the solved image',()=>{
    const board=createCoinPuzzle(()=>.41)
    expect(coinPuzzleSolved(board)).toBe(false)
    expect([...board].sort()).toEqual([0,1,2,3,4,5,6,7,8])
    const tiles=board.filter(x=>x!==0)
    const inversions=tiles.reduce((sum,tile,i)=>sum+tiles.slice(i+1).filter(later=>later<tile).length,0)
    expect(inversions%2).toBe(0)
    expect(coinPuzzleSolved(solvedCoinPuzzle)).toBe(true)
  })
})
