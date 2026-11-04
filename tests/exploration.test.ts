import {expect,it} from 'vitest'
import {isWalkable} from '../src/state/exploration'
it('keeps camera inside the gallery and outside display furniture',()=>{
  expect(isWalkable(0,5.8)).toBe(true)
  expect(isWalkable(2,0)).toBe(true)
  for(const [x,z] of [[0,0],[1,1],[4,-2],[-4,-2],[-7,2],[7,2],[0,-5],[0,8]])expect(isWalkable(x,z)).toBe(false)
})
