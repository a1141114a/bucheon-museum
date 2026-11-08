import {describe,it,expect} from 'vitest'
import {completionSources,fitCompletion} from '../src/components/completionFrame'

describe('animated completion card layout',()=>{
  it('keeps the full movie and safe content area inside all viewport sizes',()=>{
    for(const chapter of [1,2] as const)for(const [vw,vh] of [[320,568],[390,844],[844,390],[768,1024],[1024,768],[1280,900],[1920,1080]]){
      const frame=fitCompletion(chapter,vw,vh),source=completionSources[chapter]
      expect(frame.width).toBeLessThanOrEqual(vw-16)
      expect(frame.height).toBeLessThanOrEqual(vh-16)
      expect(frame.height+.001).toBeGreaterThanOrEqual(frame.width*source.height/source.width)
      expect(frame.width-frame.inset.left-frame.inset.right).toBeGreaterThan(100)
      expect(frame.height-frame.inset.top-frame.inset.bottom).toBeGreaterThan(80)
    }
  })
  it('extends only the quiet middle on a portrait phone',()=>{
    const frame=fitCompletion(2,390,844)
    expect(frame.extended).toBe(true)
    expect(frame.height).toBeGreaterThan(frame.width*672/1280)
    expect(fitCompletion(2,1280,900).extended).toBe(false)
  })
})
