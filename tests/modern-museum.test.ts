import {describe,it,expect} from 'vitest'
import {readFileSync,existsSync} from 'node:fs'
import {independentCollection} from '../src/data/independentCollection'
import {artifacts,canModelCollection,canPublishPhoto} from '../src/data/artifacts'
import {museumWalkable,museumText} from '../src/data/modernMuseum'
describe('researched museum epilogue and independent collection',()=>{
 it('keeps 30 approved assets separate from scored gameplay progress',()=>{
  expect(independentCollection).toHaveLength(30);expect(new Set(independentCollection.map(a=>a.id)).size).toBe(30);expect(artifacts).toHaveLength(17)
  for(const a of independentCollection){expect(artifacts.some(b=>b.id===a.id)).toBe(false);expect(canModelCollection(a)).toBe(true);expect(canPublishPhoto(a)).toBe(false);expect(a.model.accuracy).toBe('approximate');expect(a.sources[0].url).toContain('/collection/'+a.id.slice(4)+'/view');for(const lang of ['zh','ko','en'] as const){expect(a.name[lang]).toBeTruthy();expect(a.history[lang].length).toBeGreaterThan(40)}}
 })
 it('ships all 30 actual GLBs, editable sources, generation entries and renders',()=>{
  for(const a of independentCollection){const id=a.id;const bytes=readFileSync(new URL('../public/'+a.model.url,import.meta.url));expect(bytes.subarray(0,4).toString()).toBe('glTF');expect(bytes.readUInt32LE(8)).toBe(bytes.length);const json=JSON.parse(bytes.subarray(20,20+bytes.readUInt32LE(12)).toString());expect(json.extensionsUsed).toContain('KHR_draco_mesh_compression');expect(json.meshes.length).toBeGreaterThan(0);for(const file of [`../blender/blend/collection-batch-20261115/${id}.blend`,`../blender/scripts/collection-batch-20261115/${id}.py`,`../public/models/${id}-preview.png`])expect(existsSync(new URL(file,import.meta.url))).toBe(true)}
 })
 it('retains evidence and marks unmeasured museum geometry as estimated',()=>{
  const manifest=JSON.parse(readFileSync(new URL('../public/models/modern-museum/manifest.json',import.meta.url),'utf8'));expect(manifest.surveyed).toBe(false);expect(manifest.newIndependentBatchPlaced).toBe(true);expect(manifest.photoReferences).toHaveLength(3);expect(manifest.visibleVerifiedWorks).toContain('bcm-991');expect(existsSync(new URL('../blender/blend/modern-museum/european-porcelain-passage.blend',import.meta.url))).toBe(true)
  for(const lang of ['zh','ko','en']as const){expect(museumText(lang,'place')).not.toMatch(/局部复原|부분 재현|partial reconstruction/);expect(museumText(lang,'source')).toBeTruthy();expect(museumText(lang,'city')).toBeTruthy()}
 })
 it('keeps camera paths outside glass cabinets and within the real-scene fragment',()=>{
  expect(museumWalkable(5,1.1,5.7)).toBe(true);expect(museumWalkable(5,1,-5)).toBe(true);expect(museumWalkable(5,-.3,2.2)).toBe(false);expect(museumWalkable(5,-.45,-3.25)).toBe(false);expect(museumWalkable(5,-2,0)).toBe(false);expect(museumWalkable(5,3,0)).toBe(false);expect(museumWalkable(5,0,7)).toBe(false);expect(museumWalkable(5,NaN,0)).toBe(false)
 })
})

