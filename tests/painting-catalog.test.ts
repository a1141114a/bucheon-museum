import {describe,it,expect} from 'vitest'
import {paintingArtifacts,paintingArtifactIds} from '../src/data/paintingArtifacts'
import {artifacts,canPublishPhoto,canModelCollection} from '../src/data/artifacts'
import {initialState,parseSave,gameReducer,statusOf} from '../src/state/game'
import {fragmentIds} from '../src/state/restoration'
import {suppliedPaintingReference} from '../src/data/referenceImages'
const oldSave=()=>({...initialState,artifacts:{'bcm-1072':'unlocked'},restoration:{...initialState.restoration,started:true,placed:fragmentIds},gallery:{clues:['west','east','rear'],opened:true},photo:{schema:1,entered:true,room:2,found:[1,2,3],placed:[1,2],key:false,finished:false}})
describe('museum painting catalogue',()=>{
 it('matches all five supplied originals to distinct official records',()=>{
  expect(artifacts).toHaveLength(17);expect(new Set(artifacts.map(a=>a.id)).size).toBe(17)
  expect(paintingArtifacts.map(a=>a.id)).toEqual(['bcm-991','bcm-990','bcm-989','bcm-988','bcm-986'])
  for(const a of paintingArtifacts){expect(a.cardStyle).toBe('painting');expect(a.verification).toBe('verified');expect(a.sources[0].url).toBe(`https://www.bcmuseum.or.kr/ko/collection/${a.id.slice(4)}/view`);expect(canModelCollection(a)).toBe(true);expect(canPublishPhoto(a)).toBe(false);expect(suppliedPaintingReference(a)).toMatch(/paintings\/art-[1-5]\.jpg$/)}
 })
 it('retains official dates and does not invent individual artists or licenses',()=>{
  expect(paintingArtifacts.map(a=>a.period.en)).toEqual(['Germany, 20th century','Germany, 19th century','Germany, 19th century','Germany, 19th century','Germany, 20th century'])
  for(const a of paintingArtifacts){expect(a.creator?.en).toContain('not specified');expect(a.photo.rights).toBe('pending');expect(a.photo.licenseEvidence).toBeNull();expect(a.sources[0].accessedAt).toBe('2026-11-15')}
 })
 it('backfills only encountered originals for existing painting-world saves',()=>{
  const s=parseSave(JSON.stringify(oldSave()))
  for(const id of paintingArtifactIds.slice(0,4))expect(statusOf(s,id)).toBe('discovered')
  expect(statusOf(s,paintingArtifactIds[4])).toBe('locked');expect(statusOf(s,'bcm-1072')).toBe('unlocked')
  expect(parseSave(JSON.stringify(s))).toEqual(s)
 })
 it('preserves collection and score on painting-card unlock and chapter replay',()=>{
  let s=parseSave(JSON.stringify(oldSave()));const score=s.score
  s=gameReducer(s,{type:'unlock',id:'bcm-991'});expect(statusOf(s,'bcm-991')).toBe('unlocked');expect(s.score).toBe(score)
  s=gameReducer(s,{type:'photo-restart'});expect(statusOf(s,'bcm-991')).toBe('unlocked');expect(statusOf(s,'bcm-988')).toBe('discovered');expect(s.score).toBe(score)
  expect(gameReducer(s,{type:'unlock',id:'bcm-986'})).toBe(s)
 })
})

