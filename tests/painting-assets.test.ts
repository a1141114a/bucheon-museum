import {describe,it,expect} from 'vitest'
import {readFileSync,existsSync} from 'node:fs'
import {paintingCrops,worldAsset} from '../src/data/paintingWorlds'
function glb(file:string){
 const bytes=readFileSync(new URL(`../public/models/painting-worlds-v2/${file}.glb`,import.meta.url))
 expect(bytes.subarray(0,4).toString()).toBe('glTF');expect(bytes.readUInt32LE(4)).toBe(2);expect(bytes.readUInt32LE(8)).toBe(bytes.length)
 const size=bytes.readUInt32LE(12);return JSON.parse(bytes.subarray(20,20+size).toString()) as {extensionsUsed?:string[];nodes:{name?:string}[];meshes:{primitives:{attributes:Record<string,number>}[]}[];accessors:{count:number}[]}
}
describe('refined scene delivery',()=>{
 it('retains the complete rectangular frames rather than portrait silhouettes',()=>{
  for(let i=0;i<5;i++){
   const [x,y,w,h]=paintingCrops[i];expect(x).toBeGreaterThanOrEqual(0);expect(y).toBeGreaterThanOrEqual(0);expect(x+w).toBeLessThanOrEqual(1);expect(y+h).toBeLessThanOrEqual(1)
   expect(h).toBeGreaterThan(.80);expect(w).toBeGreaterThan(i===1?.43:.78)
   const art=glb(`artwork-${i+1}`);expect(art.nodes.some(n=>n.name?.includes('Intact framed original front'))).toBe(true)
   expect(art.nodes.some(n=>n.name?.includes('Artwork walnut backing'))).toBe(true)
   expect(art.nodes.some(n=>n.name?.includes('ArtworkSculpture'))).toBe(false)
  }
 })
 it('ships substantial real geometry with a local Draco decoder',()=>{
  for(let i=1;i<=5;i++){
   const room=glb(`room-${i}`);expect(room.extensionsUsed).toContain('KHR_draco_mesh_compression')
   const vertices=room.meshes.flatMap(m=>m.primitives).reduce((n,p)=>n+room.accessors[p.attributes.POSITION].count,0)
   expect(vertices).toBeGreaterThan(40000);expect(room.meshes.length).toBeGreaterThan(6)
   expect(existsSync(new URL(`../blender/blend/painting-worlds-v2/world-${i}.blend`,import.meta.url))).toBe(true)
  }
  for(const file of ['draco_decoder.wasm','draco_wasm_wrapper.js','LICENSE.txt'])expect(existsSync(new URL(`../public/draco/${file}`,import.meta.url))).toBe(true)
 })
 it('uses a new asset path so cached coarse models cannot replace the refined pack',()=>{
  expect(worldAsset('room-1')).toContain('/painting-worlds-v2/room-1.glb');glb('portal-frame');glb('lectern');glb('key')
 })
})

