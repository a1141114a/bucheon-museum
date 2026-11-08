import {describe,it,expect} from 'vitest'
import {timeExhibitPositions,timeExhibitRadius} from '../src/components/timeExhibitLayout'

describe('Chapter 3 front exhibit positions',()=>{
  it('puts every plinth in front with clear gaps from the altar and terrace steps',()=>{
    expect(timeExhibitPositions).toHaveLength(3)
    for(const [x,y,z] of timeExhibitPositions){
      expect(y).toBe(0)
      expect(z-timeExhibitRadius).toBeGreaterThan(.38+.3)
      expect(Math.hypot(x,z)-timeExhibitRadius).toBeGreaterThan(2.13+.3)
    }
  })
  it('keeps the three plinth footprints separate',()=>{
    timeExhibitPositions.forEach((a,i)=>timeExhibitPositions.slice(i+1).forEach(b=>{
      expect(Math.hypot(a[0]-b[0],a[2]-b[2])).toBeGreaterThan(timeExhibitRadius*2+.3)
    }))
  })
})
