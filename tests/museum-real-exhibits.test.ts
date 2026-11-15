import {describe,it,expect} from 'vitest'
import {readFileSync,existsSync} from 'node:fs'
import {museumExhibits,museumBatchIds} from '../src/data/museumExhibits'
import {modernMuseumModel} from '../src/data/modernMuseum'
import {canModelCollection,canPublishPhoto} from '../src/data/artifacts'
function glb(path:string){const b=readFileSync(new URL('../public/'+path,import.meta.url));expect(b.subarray(0,4).toString()).toBe('glTF');expect(b.readUInt32LE(8)).toBe(b.length);return JSON.parse(b.subarray(20,20+b.readUInt32LE(12)).toString())}
describe('identified modern museum exhibits',()=>{
 it('contains exactly the 16 approved collection identities, with sources and available models',()=>{
  expect(museumExhibits).toHaveLength(16);expect(new Set(museumExhibits.map(a=>a.id)).size).toBe(16);expect(museumBatchIds).toHaveLength(8)
  for(const a of museumExhibits){expect(canModelCollection(a)).toBe(true);expect(a.sources[0].url).toContain('/collection/');expect(existsSync(new URL('../public/'+a.model.url,import.meta.url))).toBe(true)}
 })
 it('exports each clickable collection identity and removes illustrative props',()=>{
  const doc=glb(modernMuseumModel),ids=new Set(doc.nodes.map((n:any)=>n.extras?.artifactId).filter(Boolean));expect([...ids].sort()).toEqual(museumExhibits.map(a=>a.id).sort());expect(doc.nodes.filter((n:any)=>/^(Context|Applied loop handle|Sideboard fruit bowl|Dining candlestick)/.test(n.name))).toHaveLength(0)
  const m=JSON.parse(readFileSync(new URL('../public/models/modern-museum/manifest.json',import.meta.url),'utf8'));expect(m.placements).toHaveLength(12);expect(m.removedContextObjects).toBeGreaterThan(100)
 })
 it('retains actual new editable sources and unlicensed-photo status',()=>{
  for(const id of ['951','941','978']){const a=museumExhibits.find(a=>a.id==='bcm-'+id)!;expect(canPublishPhoto(a)).toBe(false);expect(glb(a.model.url!).meshes.length).toBeGreaterThan(0);expect(existsSync(new URL(`../blender/blend/museum-real-exhibits/bcm-${id}.blend`,import.meta.url))).toBe(true)}
 })
})
