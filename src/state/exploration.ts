export const movement = {forward:0,side:0}
// Camera radius included in obstacle bounds, so the player cannot enter plinths.
export function isWalkable(x:number,z:number) {
  if(x < -6.4 || x > 6.4 || z < -4.3 || z > 7.5)return false
  if(Math.abs(x)<1.45 && Math.abs(z)<1.35)return false
  if(Math.abs(Math.abs(x)-4)<1 && Math.abs(z+2)<1)return false
  return true
}
