import { describe, expect, it } from 'vitest'
import { gameReducer, initialState, isLevelUnlocked, parseSave, statusOf } from '../src/state/game'
import { artifacts, canModelCollection, canPublishPhoto } from '../src/data/artifacts'
import { copy, translate } from '../src/i18n'
import type { Artifact } from '../src/types'
describe('prototype progression',()=>{
  it('starts locked and discovers a known item',()=>{
    expect(statusOf(initialState,'test-vessel')).toBe('locked')
    const s=gameReducer(initialState,{type:'discover',id:'test-vessel'})
    expect(statusOf(s,'test-vessel')).toBe('discovered');expect(s.score).toBe(0)
  })
  it('requires discovery before journal unlock',()=>{
    expect(gameReducer(initialState,{type:'unlock',id:'test-vessel'})).toBe(initialState)
  })
  it('awards once and never regresses a record',()=>{
    let s=gameReducer(initialState,{type:'discover',id:'test-vessel'})
    s=gameReducer(s,{type:'unlock',id:'test-vessel'})
    s=gameReducer(s,{type:'unlock',id:'test-vessel'})
    s=gameReducer(s,{type:'discover',id:'test-vessel'})
    expect(s.score).toBe(10);expect(statusOf(s,'test-vessel')).toBe('unlocked')
  })
  it('ignores unknown artifacts',()=>{
    expect(gameReducer(initialState,{type:'discover',id:'fake'})).toBe(initialState)
  })
  it('does not unlock future chapters using test points',()=>{
    const s={...initialState,score:999};expect(isLevelUnlocked(s,1)).toBe(true)
    expect(isLevelUnlocked(s,2)).toBe(false);expect(isLevelUnlocked(s,3)).toBe(false)
  })
  it('defines prerequisite relationships for future production completion',()=>{
    expect(isLevelUnlocked({...initialState,completedLevels:[1]},2)).toBe(true)
    expect(isLevelUnlocked({...initialState,completedLevels:[1]},3)).toBe(false)
  })
  it('round trips language and discovery',()=>{
    const s=gameReducer({...initialState,language:'en'},{type:'discover',id:'test-vessel'})
    expect(parseSave(JSON.stringify(s))).toEqual(s)
  })
  it('recovers corrupt or incompatible saves',()=>{
    for(const value of ['{','null','[]','{"version":9}',null])expect(parseSave(value)).toEqual(initialState)
  })
  it('sanitizes score, identifiers, hints and completion on load',()=>{
    const s=parseSave(JSON.stringify({version:1,language:'bad',score:999,artifacts:{fake:'unlocked','test-vessel':'unlocked'},completedLevels:[1,2,3],hintsUsed:-4}))
    expect(s.score).toBe(10);expect(s.language).toBe('zh');expect(s.completedLevels).toEqual([])
    expect(s.artifacts).toEqual({'test-vessel':'unlocked'});expect(s.hintsUsed).toBe(0)
  })
  it('reset clears progress and preserves language',()=>{
    expect(gameReducer({...initialState,language:'ko',score:10,hintsUsed:2},{type:'reset'})).toEqual({...initialState,language:'ko'})
  })
})
describe('collection approval and rights',()=>{
  const approved:Artifact={...artifacts[0],kind:'collection',verification:'verified',review:{status:'approved',approvedAt:'2026-11-04',evidence:'test fixture only'},photo:{url:'/photo.jpg',sourceUrl:'https://example.org/record',rights:'authorized',credit:'fixture',licenseEvidence:'test fixture'}}
  it('never publishes the test shape as a real photo',()=>expect(canPublishPhoto(artifacts[0])).toBe(false))
  it('requires user approval before modeling real objects',()=>{
    expect(canModelCollection({...approved,review:{status:'pending',approvedAt:null,evidence:null}})).toBe(false)
    expect(canModelCollection(approved)).toBe(true)
  })
  it('requires both approval and image permission evidence',()=>{
    expect(canPublishPhoto(approved)).toBe(true)
    expect(canPublishPhoto({...approved,photo:{...approved.photo,rights:'pending'}})).toBe(false)
    expect(canPublishPhoto({...approved,photo:{...approved.photo,licenseEvidence:null}})).toBe(false)
    expect(canPublishPhoto({...approved,verification:'pending'})).toBe(false)
    expect(canPublishPhoto({...approved,review:{...approved.review,status:'pending'}})).toBe(false)
  })
  it('has three nonempty UI translations for every key',()=>{
    for(const key of Object.keys(copy) as (keyof typeof copy)[])for(const lang of ['zh','ko','en'] as const)expect(translate(lang,key).length).toBeGreaterThan(0)
  })
})
