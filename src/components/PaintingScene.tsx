import {Suspense,useEffect,useMemo,useRef} from 'react'
import {Canvas,useFrame,useThree} from '@react-three/fiber'
import {Group,PerspectiveCamera} from 'three'
import {artworkPositions,type PaintingProgress,type Pose} from '../state/paintings'
import ArtPortal,{ArtFrame} from './ArtPortal'
import PaintingWorld,{Model,WorldLight} from './PaintingWorld'
import PaintingWalk from './PaintingWalk'

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
export interface PaintingSceneProps {progress:PaintingProgress;active:boolean;raised:boolean;entering:boolean;opening:boolean;onPose:(pose:Pose)=>void;onTake:()=>void;onEnter:()=>void;onEntered:()=>void;onReady:()=>void;onOpen:()=>void;onFinish:()=>void}
function Content(p:PaintingSceneProps){
 const {camera,size}=useThree(),room=p.progress.room,n=room+1
 useEffect(()=>{if(camera instanceof PerspectiveCamera){camera.fov=Math.min(90,2*Math.atan(Math.tan(Math.PI/8)/Math.min(1,size.width/size.height))*180/Math.PI);camera.updateProjectionMatrix()}},[camera,size.width,size.height])
 const point=artworkPositions[room]
 return <>
 <WorldLight index={room}/><Suspense fallback={null}><PaintingWorld index={room} doorOpen={p.opening||p.progress.finished} onReady={p.onReady}/></Suspense>
 <PaintingWalk room={room} active={p.active&&!p.entering&&!p.opening} onPose={p.onPose}/>
 {room<4?<>
 {!p.progress.found.includes(n)&&<group position={[point[0],0,point[1]]} onClick={e=>{if(e.delta<6&&camera.position.distanceTo(e.point)<3){e.stopPropagation();p.onTake()}}} name="next-artwork"><Suspense fallback={null}><Model file="lectern"/><ArtFrame index={n} height={.68} position={[0,1.45,0]}/></Suspense><pointLight position={[0,1.5,.4]} intensity={3} color="#ffd182" distance={3}/></group>}
 <Suspense fallback={null}><ArtPortal key={room} index={n} empty placed={p.progress.placed.includes(n)} entering={p.entering} onEntered={p.onEntered} onClick={p.onEnter}/></Suspense>
 {p.raised&&!p.progress.placed.includes(n)&&<Suspense fallback={null}><HeldArt index={n}/></Suspense>}
 </>:<>
 {!p.progress.key&&<group position={[point[0],1.4,point[1]]} onClick={e=>{if(e.delta<6){e.stopPropagation();p.onTake()}}} name="final-key"><Suspense fallback={null}><Model file="key" scale={1.2}/></Suspense><pointLight color="#ffd16a" intensity={5} distance={3}/></group>}
 <mesh position={[0,1.8,-8.16]} onClick={e=>{if(e.delta<6){e.stopPropagation();p.onOpen()}}} name="final-door-touch"><planeGeometry args={[3,3.5]}/><meshBasicMaterial transparent opacity={0} depthWrite={false}/></mesh>
 {(p.opening||p.progress.finished)&&<DoorBloom onDone={p.onFinish}/>}
 </>}
 </>
}
export default function PaintingScene(p:PaintingSceneProps){
 const camera=useMemo(()=>({position:[0,1.65,8] as [number,number,number],fov:45,near:.08,far:70}),[])
 return <Canvas camera={camera} dpr={[1,1.4]} gl={{antialias:true,powerPreference:'high-performance'}}><Content {...p}/></Canvas>
}
