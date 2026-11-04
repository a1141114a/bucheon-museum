import {Box3,Ray,Vector3} from 'three'

// Protect the pot, inspection position and both edges of the workbench.
const sightPoints=[
  [.75,1.7,0],[0,.95,-.8],[1.5,2.55,.8],[-1.05,2.15,.8],
  [-3,.85,-1.3],[-3,.85,1.3],[-.5,1.3,-1.3],[-.5,1.3,1.3],
].map(p=>new Vector3(...p as [number,number,number]))
const ray=new Ray(),hit=new Vector3(),direction=new Vector3()
export function sceneryBlocksView(camera:Vector3,bounds:Box3):boolean{
  if(bounds.containsPoint(camera))return true
  return sightPoints.some(target=>{
    direction.subVectors(target,camera)
    const distance=direction.length()
    ray.set(camera,direction.normalize())
    return ray.intersectBox(bounds,hit)!==null&&camera.distanceTo(hit)<distance-.05
  })
}
export function labelFacesCamera(camera:Vector3,center:Vector3):boolean{
  return (camera.x-.75)*center.x+camera.z*center.z>0
}
