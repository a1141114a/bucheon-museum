import {BufferGeometry,Vector3} from 'three'

/** Use only the outside clay surface and its open borders for the guide.
 * Interior walls, fracture caps and surface crease edges are not guide lines.
 */
export function buildGhostGeometry(source:BufferGeometry,center:Vector3){
  const positions=source.getAttribute('position'),index=source.getIndex()
  const outer:number[]=[]
  const a=new Vector3(),b=new Vector3(),c=new Vector3(),ab=new Vector3(),ac=new Vector3(),radial=new Vector3()
  const count=index?index.count:positions.count
  for(let i=0;i<count;i+=3){
    const ids=[0,1,2].map(j=>index?index.getX(i+j):i+j)
    a.fromBufferAttribute(positions,ids[0]);b.fromBufferAttribute(positions,ids[1]);c.fromBufferAttribute(positions,ids[2])
    radial.copy(a).add(b).add(c).multiplyScalar(1/3).add(center);radial.y=0
    if(ab.subVectors(b,a).cross(ac.subVectors(c,a)).dot(radial)>1e-10)outer.push(...ids)
  }
  const geometry=source.clone();geometry.setIndex(outer)
  const edges=new Map<string,{count:number;a:number;b:number}>()
  const key=(i:number)=>[positions.getX(i),positions.getY(i),positions.getZ(i)].map(v=>Math.round(v*1e5)).join(',')
  for(let i=0;i<outer.length;i+=3)for(let j=0;j<3;j++){
    const a=outer[i+j],b=outer[i+(j+1)%3],ka=key(a),kb=key(b)
    const edgeKey=ka<kb?`${ka}|${kb}`:`${kb}|${ka}`
    const existing=edges.get(edgeKey)
    if(existing)existing.count++;else edges.set(edgeKey,{count:1,a,b})
  }
  const outline:[number,number,number][]=[]
  for(const edge of edges.values())if(edge.count===1)for(const i of [edge.a,edge.b])outline.push([positions.getX(i),positions.getY(i),positions.getZ(i)])
  return {geometry,outline}
}
