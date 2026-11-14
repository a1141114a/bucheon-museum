export interface PaintingProgress { schema:1; entered:boolean; room:number; found:number[]; placed:number[]; key:boolean; finished:boolean }
export const freshPaintings=():PaintingProgress=>({schema:1,entered:false,room:0,found:[],placed:[],key:false,finished:false})
export function parsePaintings(value:unknown):PaintingProgress {
  if(!value||typeof value!=='object')return freshPaintings()
  const s=value as Partial<PaintingProgress>;if(s.schema!==1||s.entered!==true||!Array.isArray(s.found)||!Array.isArray(s.placed))return freshPaintings()
  const found:number[]=[],placed:number[]=[]
  for(let n=1;n<=4;n++){if(!s.found?.includes(n))break;found.push(n);if(!s.placed?.includes(n))break;placed.push(n)}
  const room=Number.isInteger(s.room)?Math.max(0,Math.min(placed.length,s.room!)):0
  return {schema:1,entered:true,room,found:found.filter(n=>n<=room+1),placed:placed.filter(n=>n<=room+1),key:room===4&&s.key===true,finished:room===4&&s.key===true&&s.finished===true}
}
export const artworkPositions=[[-4.5,-3.8],[4.5,-3.8],[-5.3,-3.8],[5.1,-4.8],[-5.8,-4.8]] as const
export interface Pose { x:number; z:number; yaw:number; pitch:number }
export function nearPoint(p:Pose,point:readonly number[],radius=2){return Number.isFinite(p.x)&&Number.isFinite(p.z)&&Math.hypot(p.x-point[0],p.z-point[1])<radius}
export function alignedPainting(p:Pose){return nearPoint(p,[0,-4.8],1.15)&&Number.isFinite(p.yaw)&&Number.isFinite(p.pitch)&&Math.cos(p.yaw)>.985&&Math.abs(p.pitch)<.18}
export function nearPortal(p:Pose){return nearPoint(p,[0,-8],1.6)&&Math.cos(p.yaw)>.5}
export function paintingWalkable(room:number,x:number,z:number){
  if(Math.abs(x)>8.3||z>9.2||z< -8.9)return false
  if(Math.abs(x)<1.3&&Math.abs(z-3.5)<.7)return false
  if([-7.3,7.3].some(cx=>[-7,-2,3,8].some(cz=>Math.hypot(x-cx,z-cz)<.55)))return false
  if(room===0&&x>2&&x<5.5&&Math.abs(z)<3.2&&Math.abs(x-3.7)>.8)return false
  if(room===1&&Math.abs(Math.abs(x)-3.8)<1.5&&[-3,0].some(v=>Math.abs(z-v)<.6))return false
  if(room===2&&Math.abs(Math.abs(x)-5.4)<1.3&&[0,5].some(v=>Math.abs(z-v)<.7))return false
  if(room===4&&Math.hypot(x,z+1.7)<2)return false
  if(room===4&&Math.abs(x)<1.7&&z< -7.95)return false
  return true
}

