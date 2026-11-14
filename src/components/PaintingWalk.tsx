import {useEffect,useRef} from 'react'
import {useFrame,useThree} from '@react-three/fiber'
import {Euler} from 'three'
import {movement} from '../state/exploration'
import {paintingWalkable,type Pose} from '../state/paintings'
export default function PaintingWalk({active,room,onPose}:{active:boolean;room:number;onPose:(p:Pose)=>void}){
 const {camera,gl}=useThree(),keys=useRef(new Set<string>()),angle=useRef({yaw:0,pitch:0}),tick=useRef(0)
 useEffect(()=>{camera.position.set(0,1.65,8);camera.rotation.set(0,0,0);angle.current={yaw:0,pitch:0};onPose({x:0,z:8,yaw:0,pitch:0})},[room,camera])
 useEffect(()=>{
  const euler=new Euler().setFromQuaternion(camera.quaternion,'YXZ');angle.current={yaw:euler.y,pitch:euler.x}
  const canvas=gl.domElement;let pointer:number|null=null,x=0,y=0
  const clear=()=>{keys.current.clear();movement.forward=0;movement.side=0;pointer=null}
  const down=(e:KeyboardEvent)=>{if(!active||document.querySelector('dialog[open]'))return;if(['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code)){e.preventDefault();keys.current.add(e.code)}}
  const up=(e:KeyboardEvent)=>keys.current.delete(e.code)
  const start=(e:PointerEvent)=>{if(!active||pointer!==null)return;pointer=e.pointerId;x=e.clientX;y=e.clientY;canvas.setPointerCapture(pointer)}
  const move=(e:PointerEvent)=>{if(e.pointerId!==pointer)return;angle.current.yaw-=(e.clientX-x)*.004;angle.current.pitch=Math.max(-1.05,Math.min(1.05,angle.current.pitch-(e.clientY-y)*.004));x=e.clientX;y=e.clientY}
  const end=(e:PointerEvent)=>{if(pointer===e.pointerId)pointer=null}
  const hidden=()=>{if(document.hidden)clear()}
  window.addEventListener('keydown',down);window.addEventListener('keyup',up);window.addEventListener('blur',clear);document.addEventListener('visibilitychange',hidden)
  canvas.addEventListener('pointerdown',start);canvas.addEventListener('pointermove',move);window.addEventListener('pointerup',end);window.addEventListener('pointercancel',end)
  return()=>{clear();window.removeEventListener('keydown',down);window.removeEventListener('keyup',up);window.removeEventListener('blur',clear);document.removeEventListener('visibilitychange',hidden);canvas.removeEventListener('pointerdown',start);canvas.removeEventListener('pointermove',move);window.removeEventListener('pointerup',end);window.removeEventListener('pointercancel',end)}
 },[active,gl,camera])
 useFrame((_,dt)=>{
  if(!active||document.querySelector('dialog[open]'))return
  const k=keys.current;let f=movement.forward+Number(k.has('KeyW')||k.has('ArrowUp'))-Number(k.has('KeyS')||k.has('ArrowDown')),s=movement.side+Number(k.has('KeyD')||k.has('ArrowRight'))-Number(k.has('KeyA')||k.has('ArrowLeft'))
  const mag=Math.hypot(f,s);if(mag>1){f/=mag;s/=mag}
  const {yaw,pitch}=angle.current,speed=Math.min(dt,.05)*2.65,dx=(s*Math.cos(yaw)-f*Math.sin(yaw))*speed,dz=(-s*Math.sin(yaw)-f*Math.cos(yaw))*speed
  if(paintingWalkable(room,camera.position.x+dx,camera.position.z))camera.position.x+=dx
  if(paintingWalkable(room,camera.position.x,camera.position.z+dz))camera.position.z+=dz
  let height=1.65
  if(room===0&&Math.abs(camera.position.x-3.7)<.9&&Math.abs(camera.position.z)<3.2)height+=.57*Math.sin(Math.PI*(camera.position.z+3.2)/6.4)
  camera.position.y=height;camera.rotation.set(pitch,yaw,0,'YXZ')
  tick.current+=dt;if(tick.current>.08){tick.current=0;onPose({x:camera.position.x,z:camera.position.z,yaw,pitch})}
 })
 return null
}
