import {describe,it,expect} from 'vitest'
import {joystickVector} from '../src/state/joystick'
describe('camera movement joystick',()=>{
  it('stops in the centre and rejects invalid geometry',()=>{
    expect(joystickVector(0,0,32)).toEqual({forward:0,side:0,x:0,y:0})
    expect(joystickVector(2,1,32).forward).toBe(0)
    expect(joystickVector(100,0,0)).toEqual({forward:0,side:0,x:0,y:0})
    expect(joystickVector(NaN,0,32).side).toBe(0)
  })
  it('maps screen directions into camera-relative movement',()=>{
    expect(joystickVector(0,-32,32).forward).toBe(1)
    expect(joystickVector(0,32,32).forward).toBe(-1)
    expect(joystickVector(32,0,32).side).toBe(1)
    expect(joystickVector(-32,0,32).side).toBe(-1)
  })
  it('clamps diagonal speed and knob travel without removing analogue control',()=>{
    const diagonal=joystickVector(100,100,32)
    expect(Math.hypot(diagonal.forward,diagonal.side)).toBeCloseTo(1)
    expect(Math.hypot(diagonal.x,diagonal.y)).toBeCloseTo(32)
    expect(joystickVector(0,-16,32).forward).toBeGreaterThan(0)
    expect(joystickVector(0,-16,32).forward).toBeLessThan(1)
  })
})
