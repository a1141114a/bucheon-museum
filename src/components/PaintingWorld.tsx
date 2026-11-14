import {useEffect,useMemo,useRef} from 'react'
import {useGLTF} from '@react-three/drei'
import {useFrame} from '@react-three/fiber'
import {Group,MathUtils,Mesh,DoubleSide,Texture,Material} from 'three'
import {worldAsset} from '../data/paintingWorlds'
const residentModels=new Map<string,{users:number;timer?:ReturnType<typeof setTimeout>}>()
function usePaintingModel(file:string){
 const url=worldAsset(file),gltf=useGLTF(url)
 useEffect(()=>{
  const record=residentModels.get(url)||{users:0};record.users++;if(record.timer)clearTimeout(record.timer);residentModels.set(url,record)
  return()=>{record.users--;record.timer=setTimeout(()=>{
   if(record.users)return
   const materials=new Set<Material>(),textures=new Set<Texture>()
   gltf.scene.traverse(o=>{if(o instanceof Mesh){o.geometry.dispose();for(const m of Array.isArray(o.material)?o.material:[o.material])materials.add(m)}})
   for(const m of materials){for(const value of Object.values(m))if(value instanceof Texture)textures.add(value);m.dispose()}
   for(const t of textures)t.dispose();useGLTF.clear(url);residentModels.delete(url)
  },5000)}
 },[gltf,url])
 return gltf
}
export function Model({file,...props}:{file:string;position?:[number,number,number];scale?:number|[number,number,number];rotation?:[number,number,number]}){
 const {scene}=usePaintingModel(file);const copy=useMemo(()=>scene.clone(true),[scene]);return <primitive object={copy} {...props}/>
}
const palettes=[['#b9d6e5','#d5e4f2'],['#24252e','#9daac3'],['#3d2020','#e9ba77'],['#d4c6a1','#fff3d3'],['#07172d','#a8c6ed']]
export function WorldLight({index}:{index:number}){return <>
 <color attach="background" args={[palettes[index][0]]}/><fog attach="fog" args={[palettes[index][0],25,65]}/>
 <ambientLight intensity={index===0?.85:.4}/><hemisphereLight args={[palettes[index][1],'#45392c',index===4?.85:1.25]}/>
 <directionalLight position={[-4,10,5]} color={palettes[index][1]} intensity={index===1?1.7:2.2}/>
 <pointLight position={[0,5,-3]} color={index===4?'#f5b85e':'#ffe1a0'} intensity={50} distance={18} decay={2}/>
 <pointLight position={[0,4,5]} color="#ffda9c" intensity={25} distance={15}/>
 </>}
function Water({index}:{index:number}){
 const ref=useRef<Mesh>(null)
 useFrame(({clock})=>{if(ref.current)ref.current.position.y=(index===0?.06:.52)+Math.sin(clock.elapsedTime*1.4)*.008})
 return <mesh ref={ref} position={index===0?[3.7,.06,0]:[0,.52,-1.7]} rotation={[-Math.PI/2,0,0]}>
 {index===0?<planeGeometry args={[3.1,6.2]}/>:<circleGeometry args={[1.65,48]}/>}
 <meshPhysicalMaterial color={index===0?'#377b9f':'#216c8c'} metalness={.24} roughness={.18} transparent opacity={.78} side={DoubleSide}/></mesh>
}
export default function PaintingWorld({index,doorOpen=false,onReady}:{index:number;doorOpen?:boolean;onReady?:()=>void}){
 const {scene}=usePaintingModel(`room-${index+1}`),hero=usePaintingModel(`sculpture-${index+1}`),group=useRef<Group>(null)
 const copy=useMemo(()=>scene.clone(true),[scene])
 useEffect(()=>{onReady?.()},[copy,onReady])
 useFrame((_,dt)=>{
  for(const [name,sign] of [['FinalDoorLeft',-1],['FinalDoorRight',1]] as const){const door=copy.getObjectByName(name);if(door)door.rotation.y=MathUtils.damp(door.rotation.y,doorOpen?sign*1.45:0,3,dt)}
  if(group.current)group.current.rotation.y+=dt*.025
 })
 return <><primitive object={copy}/><primitive object={useMemo(()=>hero.scene.clone(true),[hero.scene])}/>{(index===0||index===4)&&<Water index={index}/>}
 <group ref={group} position={[0,2,-1]}>{Array.from({length:24},(_,i)=><mesh key={i} position={[Math.sin(i*7)*6,Math.sin(i*2)*1.7,Math.cos(i*7)*7]}><sphereGeometry args={[.012,5,4]}/><meshBasicMaterial color={index===0?'#d9f3ff':'#ffc975'}/></mesh>)}</group>
 {index===4&&<><mesh position={[3,7.2,-9.1]}><sphereGeometry args={[.75,28,20]}/><meshBasicMaterial color="#f2ddb1"/></mesh>{[-5,0,5].map(x=><pointLight key={x} position={[x,2,-6]} intensity={8} color="#ffb849" distance={6}/>)}</>}
 </>
}
