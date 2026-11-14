import {memo,useEffect,useMemo,useRef} from 'react'
import {useGLTF,Environment,Lightformer,Sky,Stars,ContactShadows} from '@react-three/drei'
import {useFrame} from '@react-three/fiber'
import {Group,MathUtils,Mesh,DoubleSide,Texture,Material,Vector3,Quaternion,AdditiveBlending,SRGBColorSpace} from 'three'
import {worldAsset} from '../data/paintingWorlds'
useGLTF.setDecoderPath(`${import.meta.env.BASE_URL}draco/`)
const residentModels=new Map<string,{users:number;timer?:ReturnType<typeof setTimeout>}>()
function usePaintingModel(file:string){
 const url=worldAsset(file),gltf=useGLTF(url,`${import.meta.env.BASE_URL}draco/`)
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
const palettes=[['#b9d6e5','#e5f2ff'],['#39352e','#c1c7d3'],['#40241f','#ffe8c9'],['#ada18c','#fff4d7'],['#061326','#8ba8df']]
export function WorldLight({index}:{index:number}){return <>
 <color attach="background" args={[palettes[index][0]]}/><fog attach="fog" args={[palettes[index][0],25,65]}/>
 <ambientLight intensity={index===0?.22:.13}/><hemisphereLight args={[palettes[index][1],'#423329',index===0?.95:index===4?.33:.53]}/>
 <directionalLight castShadow position={[-6,12,6]} color={palettes[index][1]} intensity={index===0?2.6:index===4?.8:index===3?2.7:1.7} shadow-mapSize={[1536,1536]} shadow-camera-left={-12} shadow-camera-right={12} shadow-camera-top={13} shadow-camera-bottom={-11} shadow-camera-far={35} shadow-normalBias={.035} shadow-bias={-.0002}/>
 <pointLight position={[0,5,-3]} color={index===4?'#ffb851':'#ffe1a0'} intensity={index===4?65:45} distance={18} decay={2}/>
 <pointLight position={[0,4,5]} color="#ffda9c" intensity={index===0?12:35} distance={16}/>
 {index!==0&&<spotLight castShadow position={[0,6.7,4]} intensity={index===4?90:110} color="#ffdca0" angle={1.08} penumbra={.8} distance={22} shadow-mapSize={[1024,1024]} shadow-normalBias={.025} shadow-bias={-.00015}/>}
 <Environment resolution={64} frames={1}>
  <Lightformer intensity={index===4?.7:2} color={palettes[index][1]} position={[0,6,1]} rotation={[Math.PI/2,0,0]} scale={[9,8,1]}/>
  <Lightformer intensity={index===4?2:1.5} color="#ffd79c" position={[-5,3,0]} rotation={[0,Math.PI/2,0]} scale={[3,4,1]}/>
  <Lightformer intensity={1.3} color="#d5e6ff" position={[6,4,-4]} rotation={[0,-Math.PI/2,0]} scale={[4,5,1]}/>
 </Environment>
 {index===0&&<Sky distance={1000} sunPosition={[-6,12,6]} turbidity={2} rayleigh={1.6}/>}
 {index===4&&<Stars radius={45} depth={12} count={1200} factor={1.7} saturation={.1} fade speed={.2}/>}
 </>}
function Water({index}:{index:number}){
 const ref=useRef<Mesh>(null)
 useFrame(({clock})=>{if(ref.current){ref.current.position.y=(index===0?.06:.52)+Math.sin(clock.elapsedTime*1.4)*.008
  if(index===0){const p=ref.current.geometry.getAttribute('position');for(let i=0;i<p.count;i++)p.setZ(i,.012*Math.sin(p.getX(i)*5+clock.elapsedTime*1.7)+.006*Math.cos(p.getY(i)*4-clock.elapsedTime));p.needsUpdate=true;ref.current.geometry.computeVertexNormals()}
 }})
 return <mesh ref={ref} position={index===0?[3.7,.06,0]:[0,.52,-1.7]} rotation={[-Math.PI/2,0,0]}>
 {index===0?<planeGeometry args={[3.1,6.2,32,48]}/>:<circleGeometry args={[1.65,64]}/>}
 <meshPhysicalMaterial color={index===0?'#437f9a':'#1d647e'} metalness={.36} roughness={.13} clearcoat={1} envMapIntensity={1.3} transparent opacity={.85} side={DoubleSide}/></mesh>
}
export default memo(function PaintingWorld({index,doorOpen=false,onReady}:{index:number;doorOpen?:boolean;onReady?:()=>void}){
 const {scene}=usePaintingModel(`room-${index+1}`),hero=usePaintingModel(`artwork-${index+1}`),group=useRef<Group>(null)
 const copy=useMemo(()=>{const c=scene.clone(true);c.traverse(o=>{if(o instanceof Mesh){o.castShadow=true;o.receiveShadow=true;for(const m of Array.isArray(o.material)?o.material:[o.material])for(const value of Object.values(m))if(value instanceof Texture){value.anisotropy=8;if(value.name.includes('original'))value.colorSpace=SRGBColorSpace}}});return c},[scene])
 const artwork=useMemo(()=>{const c=hero.scene.clone(true);c.traverse(o=>{if(o instanceof Mesh){o.castShadow=true;o.receiveShadow=true}});return c},[hero.scene])
 useEffect(()=>{onReady?.()},[copy,onReady])
 useFrame((_,dt)=>{
  for(const [name,sign] of [['FinalDoorLeft',-1],['FinalDoorRight',1]] as const){const door=copy.getObjectByName(name);if(door)door.rotation.y=MathUtils.damp(door.rotation.y,doorOpen?sign*1.45:0,3,dt)}
  if(group.current)group.current.rotation.y+=dt*.025
 })
 return <><primitive object={copy}/><primitive object={artwork}/>{(index===0||index===4)&&<Water index={index}/>}
 <ContactShadows key={index} position={[0,.012,0]} scale={23} opacity={.48} far={5} blur={2.2} resolution={512} frames={1} color="#31241c"/>
 <group ref={group} position={[0,2,-1]}>{Array.from({length:24},(_,i)=><mesh key={i} position={[Math.sin(i*7)*6,Math.sin(i*2)*1.7,Math.cos(i*7)*7]}><sphereGeometry args={[.012,5,4]}/><meshBasicMaterial color={index===0?'#d9f3ff':'#ffc975'}/></mesh>)}</group>
 <SceneryEffects index={index}/>
 {index===4&&<><mesh position={[3,8.7,-14]}><sphereGeometry args={[.60,40,28]}/><meshStandardMaterial color="#efe5cc" emissive="#a4977b" emissiveIntensity={.2} roughness={1}/></mesh>{[-5,0,5].map(x=><pointLight key={x} position={[x,2,-6]} intensity={18} color="#ffb849" distance={7}/>)}</>}
 </>
})

function SceneryEffects({index}:{index:number}){
 const phase=useRef<Group>(null)
 useFrame(({clock})=>{if(phase.current)phase.current.position.y=Math.sin(clock.elapsedTime*.7)*.018})
 const shaft=useMemo(()=>new Quaternion().setFromUnitVectors(new Vector3(0,1,0),new Vector3(-.45,.85,-.15).normalize()),[])
 return <group ref={phase}>
 {(index===1||index===3)&&[-5.1,4.9].map((x,i)=><group key={x}>
  <mesh position={[x*.4,3.6,-3+i*4]} quaternion={shaft}><cylinderGeometry args={[.12,1.25,7.8,24,1,true]}/><meshBasicMaterial color={index===3?'#ffe4a0':'#e8ddbd'} transparent opacity={.035} depthWrite={false} side={DoubleSide} blending={AdditiveBlending}/></mesh>
  {['#ce5b55','#5c82c1','#e8b44d','#71a38e'].map((color,k)=><mesh key={k} rotation={[-Math.PI/2,0,-.3]} position={[x+(k-1.5)*.42,.012,-1+i*5]}><planeGeometry args={[.35,1.2]}/><meshBasicMaterial color={color} transparent opacity={.16} depthWrite={false} blending={AdditiveBlending}/></mesh>)}
 </group>)}
 {index===4&&Array.from({length:12},(_,i)=>{const a=i*Math.PI/6;return <group key={i}>
  <mesh position={[Math.cos(a)*.90,.88,-1.7+Math.sin(a)*.90]} rotation={[0,-a, .27]}><cylinderGeometry args={[.013,.025,.7,6]}/><meshPhysicalMaterial color="#9fcfe1" transparent opacity={.5} roughness={.15}/></mesh>
  <mesh position={[Math.cos(a)*.55,1.72,-1.7+Math.sin(a)*.55]}><cylinderGeometry args={[.012,.019,.55,6]}/><meshBasicMaterial color="#9fcfe1" transparent opacity={.35}/></mesh>
 </group>})}
 {index===4&&<mesh position={[0,2.95,-1.7]}><cylinderGeometry args={[.018,.03,.78,8]}/><meshPhysicalMaterial color="#b6e2ee" transparent opacity={.65} roughness={.09}/></mesh>}
 </group>
}

