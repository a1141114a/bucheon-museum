import { Component, Suspense, useMemo, useRef, type ReactNode } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import { Box3, Vector3 } from 'three'
import { artifacts } from '../data/artifacts'
import { clueCover, clueIds, displays, galleryBounds, gallerySpawn, nearbyExhibit, nearbyStation, stations, type ClueId, type Station } from '../state/exploration'
import WalkControls from './WalkControls'

type Position = [number,number,number]

function Box({position,scale,color}:{position:Position;scale:Position;color:string}) {
  return <mesh position={position} scale={scale} castShadow receiveShadow><boxGeometry/><meshStandardMaterial color={color} roughness={.82}/></mesh>
}

function Glass({position,scale}:{position:Position;scale:Position}) {
  return <mesh position={position} scale={scale}><boxGeometry/>
    <meshStandardMaterial color="#b4d4c1" transparent opacity={.1} roughness={.24} depthWrite={false}/>
  </mesh>
}

function ExhibitModel({url,span}:{url:string;span:number}) {
  const {scene}=useGLTF(import.meta.env.BASE_URL+url)
  const model=useMemo(()=>{
    const object=scene.clone(true)
    const bounds=new Box3().setFromObject(object)
    const size=bounds.getSize(new Vector3())
    const center=bounds.getCenter(new Vector3())
    const scale=Math.min(span/Math.max(size.x,.001),1.28/Math.max(size.y,.001),.96/Math.max(size.z,.001))
    return {object,scale,offset:[-center.x*scale,-bounds.min.y*scale,-center.z*scale] as Position}
  },[scene,span])
  return <group position={model.offset} scale={model.scale}><primitive object={model.object}/></group>
}

function DisplayCase({id,x,z,onExhibit}:{id:string;x:number;z:number;onExhibit:(id:string)=>void}) {
  const model=artifacts.find(artifact=>artifact.id===id)?.model.url
  return <group position={[x,0,z]} onClick={event=>{event.stopPropagation();onExhibit(id)}}>
    <Box position={[0,.08,0]} scale={[2.4,.16,1.7]} color="#231b15"/>
    <Box position={[0,.59,0]} scale={[2.2,1.02,1.52]} color="#4c3828"/>
    <Box position={[0,1.11,0]} scale={[2.32,.12,1.62]} color="#a38657"/>
    <Box position={[0,1.18,0]} scale={[1.82,.06,1.28]} color="#413e36"/>
    <Box position={[0,.94,.775]} scale={[.72,.24,.035]} color="#cdb27a"/>
    <Box position={[0,2.65,0]} scale={[2.27,.09,1.59]} color="#76583a"/>
    {[-1,1].map(side=><group key={side}>
      <Glass position={[side*1.09,1.92,0]} scale={[.025,1.43,1.54]}/>
      <Box position={[side*1.09,1.92,-.76]} scale={[.065,1.47,.065]} color="#74593c"/>
      <Box position={[side*1.09,1.92,.76]} scale={[.065,1.47,.065]} color="#74593c"/>
    </group>)}
    <Glass position={[0,1.92,-.77]} scale={[2.17,1.43,.025]}/>
    <Glass position={[0,1.92,.77]} scale={[2.17,1.43,.025]}/>
    <pointLight position={[0,2.44,.33]} color="#ffddb1" intensity={11} distance={4}/>
    {model && <group position={[0,1.21,0]}><Suspense fallback={null}>
      <ExhibitModel url={model} span={id==='bcm-937'?.68:1.64}/>
    </Suspense></group>}
  </group>
}

function Architecture() {
  const {width,depth}=galleryBounds
  return <>
    <mesh rotation={[-Math.PI/2,0,0]} receiveShadow><planeGeometry args={[width,depth]}/>
      <meshStandardMaterial color="#423d32" roughness={.8}/>
    </mesh>
    <gridHelper args={[28,28,'#66574b','#52483d']} position={[0,.003,0]}/>
    <Box position={[0,3,-depth/2]} scale={[width,6,.25]} color="#3b3027"/>
    <Box position={[0,3,depth/2]} scale={[width,6,.25]} color="#3b3027"/>
    {[-1,1].map(side=><group key={side}>
      <Box position={[side*width/2,3,0]} scale={[.25,6,depth]} color="#40362c"/>
      <Box position={[side*(width/2-.14),1.08,0]} scale={[.08,.14,depth]} color="#86694a"/>
      <Box position={[side*(width/2-.14),4.62,0]} scale={[.08,.13,depth]} color="#9f7a4b"/>
      {[-9,-4,1,6,11].map(z=><group key={z}>
        <Box position={[side*(width/2-.18),2.8,z]} scale={[.13,5.6,.19]} color="#96734b"/>
        <Box position={[side*(width/2-.25),3.98,z]} scale={[.23,.43,1.6]} color="#6b5138"/>
      </group>)}
    </group>)}
    {[-9,-3,3,9].map(x=><group key={x}>
      <Box position={[x,2.86,-depth/2+.22]} scale={[.16,5.65,.18]} color="#9a7951"/>
      <Box position={[x,4.34,-depth/2+.27]} scale={[3.9,.16,.12]} color="#7c6448"/>
    </group>)}
    {[-6,0,6].map(z=><group key={z}>
      <Box position={[0,5.68,z]} scale={[width,.18,.26]} color="#59432f"/>
      <Box position={[0,5.46,z]} scale={[2.2,.14,.53]} color="#edcd91"/>
    </group>)}
    <Box position={[0,5.96,0]} scale={[width,.12,depth]} color="#322a22"/>
    {clueCover.map(({x,z,width,depth,height},index)=><group key={index} position={[x,0,z]}>
      <Box position={[0,height/2,0]} scale={[width,height,depth]} color={index===1?'#5a4a39':'#634f3a'}/>
      <Box position={[0,height+.025,0]} scale={[width+.12,.05,depth+.08]} color="#97774e"/>
      {[-1,1].map(side=><Box key={side} position={[side*(width/2-.14),height/2,depth/2+.015]} scale={[.09,height,.045]} color="#ab8556"/>)}
    </group>)}
  </>
}

interface GalleryProps {
  active:boolean
  clues:ClueId[]
  opened:boolean
  onNear:(station:Station|null)=>void
  onInspect:(station:Station)=>void
  onNearExhibit:(id:string|null)=>void
  onExhibit:(id:string)=>void
}

function Hall({active,clues,opened,onNear,onInspect,onNearExhibit,onExhibit}:GalleryProps) {
  const previous=useRef<Station|null>(null)
  const previousExhibit=useRef<string|null>(null)
  useFrame(({camera})=>{
    const {x,z}=camera.position
    const station=active?nearbyStation(x,z):null
    const exhibit=active?nearbyExhibit(x,z):null
    if (station!==previous.current) { previous.current=station; onNear(station) }
    if (exhibit!==previousExhibit.current) { previousExhibit.current=exhibit; onNearExhibit(exhibit) }
  })
  return <>
    <color attach="background" args={['#352d24']}/><fog attach="fog" args={['#352d24',24,56]}/>
    <ambientLight intensity={.5}/><hemisphereLight args={['#ffe8c6','#59493d',1.7]}/>
    <directionalLight position={[6,10,8]} intensity={2.2} color="#ffe3b1"/>
    <Architecture/>
    {displays.map(display=><DisplayCase key={display.id} {...display} onExhibit={onExhibit}/>)}
    <Box position={[0,.12,0]} scale={[3.4,.24,3]} color="#33291e"/>
    <Box position={[0,.61,0]} scale={[1.7,.99,1.5]} color="#8a704d"/>
    <Box position={[0,1.12,0]} scale={[1.84,.11,1.65]} color="#bd9e68"/>
    <group position={[0,1.18,0]} onClick={event=>{event.stopPropagation();onInspect('chest')}}>
      <Box position={[0,.23,0]} scale={[.9,.45,.64]} color="#704125"/>
      <group position={[0,.45,-.28]} rotation={[opened?-1.05:0,0,0]}>
        <Box position={[0,.08,.28]} scale={[.94,.16,.65]} color="#9b5e32"/>
      </group>
      <Box position={[0,.35,.33]} scale={[.17,.18,.035]} color="#eac071"/>
      {opened&&<pointLight position={[0,.65,0]} color="#ffcd78" intensity={9}/>}
    </group>
    {clueIds.filter(id=>!clues.includes(id)).map((id)=>{
      const [x,z]=stations[id]
      const y={west:.25,east:.36,rear:.23}[id]
      return <group key={id} position={[x,y,z]} rotation={[0,id==='west'?Math.PI:0,0]}
        onClick={event=>{event.stopPropagation();onInspect(id)}}>
        <mesh rotation={[Math.PI/2,0,0]}>
          <cylinderGeometry args={[.094,.094,.035,8]}/>
          <meshStandardMaterial color="#bf9858" metalness={.45} roughness={.52} emissive="#55381a" emissiveIntensity={.28}/>
        </mesh>
        <mesh position={[0,0,.024]}><ringGeometry args={[.054,.063,8]}/><meshBasicMaterial color="#e2bf7e"/></mesh>
      </group>
    })}
    <WalkControls active={active}/>
  </>
}

class SceneBoundary extends Component<{children:ReactNode;message:string},{failed:boolean}> {
  state={failed:false}
  static getDerivedStateFromError(){return {failed:true}}
  render(){return this.state.failed?<div className="scene-error" role="alert">{this.props.message}</div>:this.props.children}
}
export default function GalleryScene({error,...props}:GalleryProps & {error:string}) {
  return <SceneBoundary message={error}><Canvas dpr={[1,1.35]} camera={{position:[...gallerySpawn],fov:58,near:.08,far:64}} gl={{antialias:true,powerPreference:'high-performance'}} fallback={<div className="scene-error">{error}</div>}><Hall {...props}/></Canvas></SceneBoundary>
}
