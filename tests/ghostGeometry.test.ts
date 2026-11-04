import {expect,it} from 'vitest'
import {BufferGeometry,Float32BufferAttribute,Vector3} from 'three'
import {buildGhostGeometry} from '../src/components/ghostGeometry'
it('omits interior surfaces and triangle diagonals from the ghost guide',()=>{
  const source=new BufferGeometry()
  source.setAttribute('position',new Float32BufferAttribute([
    1,-1,-1, 1,1,-1, 1,1,1, 1,-1,1,
    .9,-1,-1, .9,1,-1, .9,1,1, .9,-1,1,
  ],3))
  source.setIndex([0,1,2,0,2,3,4,6,5,4,7,6])
  const {geometry,outline}=buildGhostGeometry(source,new Vector3())
  expect(geometry.getIndex()?.count).toBe(6)
  expect(outline).toHaveLength(8)
  for(let i=0;i<outline.length;i+=2){
    expect(outline[i][0]).toBe(1)
    expect(new Vector3(...outline[i]).distanceTo(new Vector3(...outline[i+1]))).toBe(2)
  }
  expect(source.getIndex()?.count).toBe(12)
  geometry.dispose();source.dispose()
})
