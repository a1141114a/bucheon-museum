import {Camera,PerspectiveCamera,Plane,Vector3,Vector4} from 'three'
import {portalPlane,type PortalDirection} from '../state/paintings'
export const portalProjectionScratch=()=>({plane:new Plane(),clip:new Vector4(),q:new Vector4(),normal:new Vector3()})
/** Translate the viewer through parallel frames, then clip everything on the
 * near side of the destination opening (including the room's outer wall). */
export function configurePortalCamera(source:Camera,target:PerspectiveCamera,direction:PortalDirection,s=portalProjectionScratch()){
 const forward=direction==='forward'
 target.position.copy(source.position);target.position.z+=forward?portalPlane*2:-portalPlane*2
 target.quaternion.copy(source.quaternion);target.updateMatrixWorld()
 target.projectionMatrix.copy(source.projectionMatrix)
 s.plane.set(s.normal.set(0,0,forward?-1:1),portalPlane-.012).applyMatrix4(target.matrixWorldInverse)
 s.clip.set(s.plane.normal.x,s.plane.normal.y,s.plane.normal.z,s.plane.constant)
 const e=target.projectionMatrix.elements
 s.q.set((Math.sign(s.clip.x)+e[8])/e[0],(Math.sign(s.clip.y)+e[9])/e[5],-1,(1+e[10])/e[14])
 const divisor=s.clip.dot(s.q)
 if(Math.abs(divisor)>1e-8){s.clip.multiplyScalar(2/divisor);e[2]=s.clip.x;e[6]=s.clip.y;e[10]=s.clip.z+1;e[14]=s.clip.w}
 target.projectionMatrixInverse.copy(target.projectionMatrix).invert()
}

