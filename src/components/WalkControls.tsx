import { useEffect, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Euler } from 'three'
import { movement, isWalkable } from '../state/exploration'
export default function WalkControls({active}:{active:boolean}) {
  const {camera,gl}=useThree()
  const keys=useRef(new Set<string>());const angle=useRef({yaw:0,pitch:0})
  useEffect(()=>{
    if(active) {
      const rotation=new Euler().setFromQuaternion(camera.quaternion,'YXZ')
      angle.current={yaw:rotation.y,pitch:rotation.x}
    }
    const canvas=gl.domElement;let pointer:number|null=null;let lastX=0;let lastY=0
    const down=(e:KeyboardEvent)=>{if(!active||document.querySelector('dialog[open]')||e.target instanceof HTMLInputElement)return; if(['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code)){e.preventDefault();keys.current.add(e.code)}}
    const up=(e:KeyboardEvent)=>keys.current.delete(e.code)
    const clear=()=>{keys.current.clear();movement.forward=0;movement.side=0;pointer=null}
    const start=(e:PointerEvent)=>{if(!active)return;pointer=e.pointerId;lastX=e.clientX;lastY=e.clientY;canvas.setPointerCapture(e.pointerId)}
    const move=(e:PointerEvent)=>{if(pointer!==e.pointerId)return;if(e.pointerType==='mouse'&&e.buttons!==1){pointer=null;return}angle.current.yaw-=(e.clientX-lastX)*.004;angle.current.pitch=Math.max(-.85,Math.min(.85,angle.current.pitch-(e.clientY-lastY)*.004));lastX=e.clientX;lastY=e.clientY}
    const end=(e:PointerEvent)=>{if(pointer===e.pointerId)pointer=null}
    const visibility=()=>{if(document.visibilityState==='hidden')clear()}
    window.addEventListener('keydown',down);window.addEventListener('keyup',up);window.addEventListener('blur',clear);document.addEventListener('visibilitychange',visibility);window.addEventListener('pointerup',end);window.addEventListener('pointercancel',end)
    canvas.addEventListener('pointerdown',start);canvas.addEventListener('pointermove',move);canvas.addEventListener('pointerup',end);canvas.addEventListener('pointercancel',end)
    return()=>{clear();window.removeEventListener('keydown',down);window.removeEventListener('keyup',up);window.removeEventListener('blur',clear);document.removeEventListener('visibilitychange',visibility);window.removeEventListener('pointerup',end);window.removeEventListener('pointercancel',end);canvas.removeEventListener('pointerdown',start);canvas.removeEventListener('pointermove',move);canvas.removeEventListener('pointerup',end);canvas.removeEventListener('pointercancel',end)}
  },[gl,active,camera])
  useFrame((_,delta)=>{
    if(!active||document.querySelector('dialog[open]')){keys.current.clear();return}
    const k=keys.current
    let forward=movement.forward+Number(k.has('KeyW')||k.has('ArrowUp'))-Number(k.has('KeyS')||k.has('ArrowDown'))
    let side=movement.side+Number(k.has('KeyD')||k.has('ArrowRight'))-Number(k.has('KeyA')||k.has('ArrowLeft'))
    const magnitude=Math.hypot(forward,side);if(magnitude>1){forward/=magnitude;side/=magnitude}
    const {yaw,pitch}=angle.current;const speed=Math.min(delta,.05)*2.4
    const dx=(side*Math.cos(yaw)-forward*Math.sin(yaw))*speed
    const dz=(-side*Math.sin(yaw)-forward*Math.cos(yaw))*speed
    if(isWalkable(camera.position.x+dx,camera.position.z))camera.position.x+=dx
    if(isWalkable(camera.position.x,camera.position.z+dz))camera.position.z+=dz
    camera.rotation.set(pitch,yaw,0,'YXZ')
  })
  return null
}

