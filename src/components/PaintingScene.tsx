import {Suspense,useEffect,useMemo,useRef} from 'react'
import {Canvas,useFrame,useThree} from '@react-three/fiber'
import {Group,PerspectiveCamera} from 'three'
import {insidePortal,type PaintingProgress,type Pose,type PortalDirection} from '../state/paintings'
import {ArtFrame} from './ArtPortal'
import WalkThroughPortal from './WalkThroughPortal'
import PaintingWorld,{WorldLight} from './PaintingWorld'
import PaintingWalk from './PaintingWalk'
import PaintingRoomItems from './PaintingRoomItems'

function HeldArt({index}:{index:number}){
 const group=useRef<Group>(null)
 useFrame(({camera})=>{if(group.current){group.current.position.copy(camera.position);group.current.quaternion.copy(camera.quaternion)}})
 return <group ref={group}><ArtFrame index={index} opacity={.65} height={.94} position={[0,.04,-1]}/></group>
}
function DoorBloom({onDone}:{onDone:()=>void}){
 const start=useRef<number|null>(null),called=useRef(false)
 useFrame(({clock})=>{if(start.current===null)start.current=clock.elapsedTime;if(clock.elapsedTime-start.current>2.7&&!called.current){called.current=true;onDone()}})
 return <><pointLight position={[0,2,-7.8]} color="#fff4cc" intensity={120} distance={12}/><mesh position={[0,1.9,-8.55]}><planeGeometry args={[2.9,3.8]}/><meshBasicMaterial color="#fff0bd"/></mesh></>
}
export interface PaintingSceneProps {progress:PaintingProgress;active:boolean;raised:boolean;opening:boolean;arrival?:Pose&{room:number};onPose:(pose:Pose)=>void;onTake:()=>void;onCross:(direction:PortalDirection,pose:Pose)=>void;onReady:()=>void;onOpen:()=>void;onFinish:()=>void;onInspectArtwork?:()=>void}
function Content(p:PaintingSceneProps){
 const {camera,size}=useThree(),room=p.progress.room,n=room+1
 const ready=useRef({room,forward:false,back:false}),crossed=useRef(false)
 if(ready.current.room!==room){ready.current={room,forward:false,back:false};crossed.current=false}
 useFrame(()=>{
  if(!p.active||crossed.current)return
  const pose={x:camera.position.x,z:camera.position.z,yaw:camera.rotation.y,pitch:camera.rotation.x}
  for(const direction of ['forward','back'] as const){
   const forward=direction==='forward',allowed=forward?room<4&&p.progress.placed.includes(n):room>0&&p.progress.placed.includes(room)
   if(allowed&&ready.current[direction]&&insidePortal(pose,direction,forward?n:room)&&(forward?pose.z<=-8.34:pose.z>=8.34)){
    crossed.current=true;p.onCross(direction,pose);break
   }
  }
 },-.25)
 useEffect(()=>{if(camera instanceof PerspectiveCamera){camera.fov=Math.min(92,2*Math.atan(Math.tan(55*Math.PI/360)/Math.min(1,size.width/size.height))*180/Math.PI);camera.updateProjectionMatrix()}},[camera,size.width,size.height])
 return <>
 <WorldLight index={room}/><Suspense fallback={null}><PaintingWorld key={room} index={room} doorOpen={p.opening||p.progress.finished} onReady={p.onReady} onArtwork={p.active?p.onInspectArtwork:undefined}/></Suspense>
 <PaintingWalk room={room} active={p.active&&!p.opening} onPose={p.onPose} arrival={p.arrival} canPass={direction=>ready.current[direction]&&(direction==='forward'?p.progress.placed.includes(n):p.progress.placed.includes(room))}/>
 <Suspense fallback={null}><PaintingRoomItems room={room} progress={p.progress} onTake={p.onTake}/></Suspense>
 {room>0&&<Suspense fallback={null}><WalkThroughPortal key={`back-${room}`} room={room} progress={p.progress} direction="back" placed onReady={()=>{ready.current.back=true}}/></Suspense>}
 {room<4?<>
 <Suspense fallback={null}><WalkThroughPortal key={`forward-${room}`} room={room} progress={p.progress} direction="forward" placed={p.progress.placed.includes(n)} onReady={()=>{ready.current.forward=true}}/></Suspense>
 {p.raised&&!p.progress.placed.includes(n)&&<Suspense fallback={null}><HeldArt index={n}/></Suspense>}
 </>:<>
 <mesh position={[0,1.8,-8.16]} onClick={e=>{if(e.delta<6){e.stopPropagation();p.onOpen()}}} name="final-door-touch"><planeGeometry args={[3,3.5]}/><meshBasicMaterial transparent opacity={0} depthWrite={false}/></mesh>
 {(p.opening||p.progress.finished)&&<DoorBloom onDone={p.onFinish}/>}
 </>}
 </>
}
export default function PaintingScene(p:PaintingSceneProps){
 const camera=useMemo(()=>({position:[0,1.65,8] as [number,number,number],fov:55,near:.08,far:70}),[])
 return <Canvas shadows camera={camera} dpr={[1,1.5]} gl={{antialias:true,powerPreference:'high-performance'}}><Content {...p}/></Canvas>
}

