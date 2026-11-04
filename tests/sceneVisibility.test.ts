import {expect,it} from 'vitest'
import {Box3,Vector3} from 'three'
import {sceneryBlocksView,labelFacesCamera} from '../src/components/sceneVisibility'
const wall=new Box3(new Vector3(-6.9,-.2,-4.35),new Vector3(6.9,4.3,-3.45))
it('keeps the backdrop when it is behind the workspace',()=>{
  expect(sceneryBlocksView(new Vector3(3.8,3.4,6.5),wall)).toBe(false)
})
it('cuts away the wall when orbiting behind it or entering it',()=>{
  expect(sceneryBlocksView(new Vector3(0,2,-8),wall)).toBe(true)
  expect(sceneryBlocksView(new Vector3(0,2,-4),wall)).toBe(true)
})
it('cuts away only the pillar between the camera and the workspace',()=>{
  const pillar=new Box3(new Vector3(4.35,-.2,-.7),new Vector3(5.65,4.5,.7))
  expect(sceneryBlocksView(new Vector3(9,2,0),pillar)).toBe(true)
  expect(sceneryBlocksView(new Vector3(-9,2,0),pillar)).toBe(false)
})
it('does not show rear-facing slot labels through the pot',()=>{
  const center=new Vector3(0,.4,.5)
  expect(labelFacesCamera(new Vector3(.75,3,6),center)).toBe(true)
  expect(labelFacesCamera(new Vector3(.75,3,-6),center)).toBe(false)
})
