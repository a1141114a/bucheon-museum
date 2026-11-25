import {describe,it,expect} from 'vitest'
import {coinGlowStrength,isWalkable} from '../src/state/exploration'
import {museumGuideBearing,museumGuideTarget} from '../src/state/museumJourney'
import {museumWalkable} from '../src/data/modernMuseum'
import {portalAlphaMatte} from '../src/components/portalMatte'
describe('player guidance',()=>{
 it('routes along the clear aisle before directing the player toward the left end wall',()=>{
  const p={x:1.1,z:5.7,yaw:0,pitch:0},first=museumGuideTarget(p);expect(first.x).toBe(1.1);expect(first.z).toBeLessThan(-4);expect(museumGuideBearing(p)).toBeCloseTo(0)
  for(let z=5.7;z>=first.z;z-=.1)expect(museumWalkable(5,1.1,z)).toBe(true)
  const next=museumGuideTarget({...p,z:-4.4});expect(next.x).toBeLessThan(0);expect(museumWalkable(5,next.x,next.z)).toBe(true);expect(museumGuideBearing({...p,z:-4.4})).toBeGreaterThan(0)
 })
 it('increases all coin hint strengths smoothly with proximity and clamps invalid distances',()=>{
  const distances=[30,9,7,5,3,1,0],levels=distances.map(coinGlowStrength);expect(levels[0]).toBe(0);expect(levels.at(-1)).toBe(1)
  for(let i=1;i<levels.length;i++)expect(levels[i]).toBeGreaterThanOrEqual(levels[i-1]);expect(coinGlowStrength(3)).toBeGreaterThan(coinGlowStrength(5));expect(coinGlowStrength(NaN)).toBe(0);expect(coinGlowStrength(-1)).toBe(1);expect(isWalkable(0,10)).toBe(true)
 })
 it('removes connected dark checkerboard but preserves enclosed dark vortex details',()=>{
  const n=11,pixels=new Uint8ClampedArray(n*n*4);for(let y=2;y<=8;y++)for(let x=2;x<=8;x++)if(x===2||x===8||y===2||y===8){const i=(y*n+x)*4;pixels.set([185,135,65,255],i)}
  const mask=portalAlphaMatte(n,n,pixels);expect(mask[0]).toBe(0);expect(mask[(5*n+5)*4]).toBe(255)
  pixels.set([0,0,0,255],(2*n+5)*4);expect(portalAlphaMatte(n,n,pixels)[(5*n+5)*4]).toBe(0)
 })
})
