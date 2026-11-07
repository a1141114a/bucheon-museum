import { useLayoutEffect, useMemo, useRef, useEffect } from 'react'
import { Environment, Lightformer, useGLTF, useTexture } from '@react-three/drei'
import { InstancedMesh, Object3D, RepeatWrapping, SRGBColorSpace } from 'three'
import { galleryBounds } from '../state/exploration'

type Position=[number,number,number]
type Block={position:Position;scale:Position}
const textureUrls=['wall','marble','ceiling','banner-red','banner-blue'].map(name=>import.meta.env.BASE_URL+'textures/gallery/'+name+'.webp')

function Blocks({name,items,color,metalness=.15,roughness=.5,emission=false}:{name:string;items:Block[];color:string;metalness?:number;roughness?:number;emission?:boolean}){
  const ref=useRef<InstancedMesh>(null)
  useLayoutEffect(()=>{
    if(!ref.current)return
    const dummy=new Object3D()
    items.forEach(({position,scale},i)=>{dummy.position.set(...position);dummy.scale.set(...scale);dummy.updateMatrix();ref.current!.setMatrixAt(i,dummy.matrix)})
    ref.current.instanceMatrix.needsUpdate=true
    ref.current.computeBoundingSphere()
  },[items])
  return <instancedMesh name={name} ref={ref} args={[undefined,undefined,items.length]}>
    <boxGeometry/>
    <meshStandardMaterial color={color} metalness={metalness} roughness={roughness} emissive={emission?color:'#000000'} emissiveIntensity={emission?.8:0}/>
  </instancedMesh>
}

function Lanterns(){
  const {scene}=useGLTF(import.meta.env.BASE_URL+'models/gallery-lantern.glb')
  const models=useMemo(()=>[scene.clone(true),scene.clone(true),scene.clone(true)],[scene])
  return <>{[-9,-2,5].map((z,i)=><group key={z} position={[0,5.88,z]} name={'GalleryLantern'+(i+1)}>
    <primitive object={models[i]}/>
    <pointLight position={[0,-1.43,0]} color="#ffdc9e" intensity={16} distance={12} decay={2}/>
  </group>)}</>
}

function TileSeams(){
  const positions=useMemo(()=>{
    const {width,depth}=galleryBounds,vertices:number[]=[]
    for(let x=-width/2;x<=width/2;x+=2)vertices.push(x,.006,-depth/2,x,.006,depth/2)
    for(let z=-depth/2;z<=depth/2;z+=2)vertices.push(-width/2,.006,z,width/2,.006,z)
    return new Float32Array(vertices)
  },[])
  return <lineSegments name="MarbleTileJoints"><bufferGeometry><bufferAttribute attach="attributes-position" args={[positions,3]}/></bufferGeometry><lineBasicMaterial color="#171512"/></lineSegments>
}

export default function GalleryArchitecture(){
  const [wallSource,marbleSource,ceilingSource,redSource,blueSource]=useTexture(textureUrls)
  const textures=useMemo(()=>{
    const wall=wallSource.clone(),floor=marbleSource.clone(),ceiling=ceilingSource.clone(),marble=marbleSource.clone(),red=redSource.clone(),blue=blueSource.clone()
    for(const texture of [wall,floor,ceiling,marble,red,blue]){texture.colorSpace=SRGBColorSpace;texture.anisotropy=4;texture.needsUpdate=true}
    for(const texture of [wall,floor,ceiling]){texture.wrapS=texture.wrapT=RepeatWrapping}
    wall.repeat.set(3,1);floor.repeat.set(14,13);ceiling.repeat.set(4,4)
    return {wall,floor,ceiling,marble,red,blue}
  },[wallSource,marbleSource,ceilingSource,redSource,blueSource])
  useEffect(()=>()=>Object.values(textures).forEach(texture=>texture.dispose()),[textures])
  const {width,depth}=galleryBounds
  const structure=useMemo(()=>{
    const gold:Block[]=[],dark:Block[]=[],lamps:Block[]=[]
    const add=(list:Block[],position:Position,scale:Position)=>list.push({position,scale})
    for(const side of [-1,1]){
      for(const y of [1.28,5.55,5.82]){
        add(gold,[side*(width/2-.08),y,0],[.09,.065,depth])
        add(gold,[0,y,side*(depth/2-.08)],[width,.065,.09])
      }
      add(dark,[side*(width/2-.10),.16,0],[.15,.24,depth])
      add(dark,[0,.16,side*(depth/2-.10)],[width,.24,.15])
      // Two warm tracks carry visible bulbs; they add no per-bulb light cost.
      add(dark,[side*8.3,5.65,0],[.12,.13,depth-1])
      for(const z of [-11,-7,-3,1,5,9])add(lamps,[side*8.3,5.56,z],[.13,.035,.20])
      // Floor inlays lead along the central display aisle.
      for(const x of [3.5,3.60])add(gold,[side*x,.014,0],[.025,.009,depth-1])
      for(const z of [12.4,12.5])add(gold,[0,.015,side*z],[width-1,.009,.025])
    }
    for(const x of [-14,-7,0,7,14])add(gold,[x,5.86,0],[.11,.12,depth])
    for(const z of [-13,-6.5,0,6.5,13])add(gold,[0,5.86,z],[width,.12,.11])
    return {gold,dark,lamps}
  },[width,depth])
  return <group name="GalleryArchitecture">
    <mesh name="GalleryMarbleFloor" rotation={[-Math.PI/2,0,0]} receiveShadow><planeGeometry args={[width,depth]}/>
      <meshStandardMaterial map={textures.floor} color="#b4a99b" roughness={.34} metalness={.12} envMapIntensity={.7}/>
    </mesh>
    <TileSeams/>
    {[-1,1].map(side=><group key={side}>
      <mesh position={[side*width/2,3,0]} rotation={[0,-side*Math.PI/2,0]}><planeGeometry args={[depth,6]}/><meshStandardMaterial map={textures.wall} color="#e3d9ca" roughness={.76}/></mesh>
      <mesh position={[0,3,side*depth/2]} rotation={[0,side>0?Math.PI:0,0]}><planeGeometry args={[width,6]}/><meshStandardMaterial map={textures.wall} color="#e3d9ca" roughness={.76}/></mesh>
      <mesh position={[side*3.25,3.05,-depth/2+.075]}><planeGeometry args={[.86,2.55]}/><meshStandardMaterial map={side<0?textures.red:textures.blue} roughness={.9}/></mesh>
    </group>)}
    <mesh name="GalleryCofferedCeiling" position={[0,5.98,0]} rotation={[Math.PI/2,0,0]}><planeGeometry args={[width,depth]}/><meshStandardMaterial map={textures.ceiling} color="#b2a28a" roughness={.85}/></mesh>
    <Blocks name="BrassCornicesAndInlays" items={structure.gold} color="#ad8043" metalness={.48} roughness={.48}/>
    <Blocks name="DarkPlinthsAndTracks" items={structure.dark} color="#24221e" metalness={.12}/>
    <Blocks name="WarmTrackDiffusers" items={structure.lamps} color="#ffe2ab" emission/>
    <Lanterns/>
    <Environment frames={1} resolution={128} environmentIntensity={.55}>
      <Lightformer form="rect" position={[0,8,0]} rotation={[Math.PI/2,0,0]} scale={[6,22,1]} color="#ffe5be" intensity={1.0}/>
      <Lightformer form="rect" position={[-10,4,0]} rotation={[0,Math.PI/2,0]} scale={[20,3,1]} color="#dccab0" intensity={.65}/>
      <Lightformer form="rect" position={[10,4,0]} rotation={[0,-Math.PI/2,0]} scale={[20,3,1]} color="#dccab0" intensity={.65}/>
    </Environment>
  </group>
}



