import {expect,it} from 'vitest'
import {galleryBounds,gallerySpawn,isWalkable,clueIds,nearbyStation,nearbyExhibit,displays} from '../src/state/exploration'

it('keeps the camera inside the larger hall and out of case bases',()=>{
  expect(galleryBounds.width*galleryBounds.depth).toBe(14*13*4)
  expect(isWalkable(gallerySpawn[0],gallerySpawn[2])).toBe(true)
  expect(isWalkable(0,0)).toBe(false)
  expect(isWalkable(-14,0)).toBe(false)
  expect(isWalkable(0,-13)).toBe(false)
  expect(displays).toHaveLength(12)
  for(const display of displays) {
    expect(isWalkable(display.x,display.z)).toBe(false)
    expect(nearbyExhibit(display.x,display.z+2)).toBe(display.id)
  }
})

it('allows the player to reach each hidden seal and return to the chest',()=>{
  const visited=new Set<string>()
  const queue:Array<[number,number]>=[[0,11]]
  const reached=new Set<string>()
  for(let i=0;i<queue.length;i++){
    const [x,z]=queue[i]
    const key=x+','+z
    if(visited.has(key)||!isWalkable(x,z))continue
    visited.add(key)
    const found=nearbyStation(x,z)
    if(found)reached.add(found)
    queue.push([x+.5,z],[x-.5,z],[x,z+.5],[x,z-.5])
  }
  expect([...reached].sort()).toEqual([...clueIds,'chest'].sort())
})
