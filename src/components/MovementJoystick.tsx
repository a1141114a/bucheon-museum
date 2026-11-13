import {useCallback,useEffect,useRef,useState,type PointerEvent} from 'react'
import {movement} from '../state/exploration'
import {joystickVector} from '../state/joystick'

export function useTouchControls(){
  const detect=()=>navigator.maxTouchPoints>0||window.matchMedia('(any-pointer: coarse)').matches
  const [touch,setTouch]=useState(detect)
  useEffect(()=>{
    const media=window.matchMedia('(any-pointer: coarse)')
    const update=()=>setTouch(detect())
    const pointer=(event:globalThis.PointerEvent)=>{if(event.pointerType==='touch')setTouch(true)}
    media.addEventListener('change',update);window.addEventListener('pointerdown',pointer)
    return ()=>{media.removeEventListener('change',update);window.removeEventListener('pointerdown',pointer)}
  },[])
  return touch
}

export default function MovementJoystick({active,label,help}:{active:boolean;label:string;help:string}){
  const base=useRef<HTMLDivElement>(null),pointer=useRef<number|null>(null)
  const [knob,setKnob]=useState({x:0,y:0})
  const stop=useCallback(()=>{
    const id=pointer.current;pointer.current=null
    movement.forward=0;movement.side=0;setKnob({x:0,y:0})
    if(id!==null&&base.current?.hasPointerCapture(id))base.current.releasePointerCapture(id)
  },[])
  useEffect(()=>{
    if(!active)stop()
  },[active,stop])
  useEffect(()=>{
    const hidden=()=>{if(document.visibilityState==='hidden')stop()}
    const release=(event:globalThis.PointerEvent)=>{if(pointer.current===event.pointerId)stop()}
    window.addEventListener('blur',stop);window.addEventListener('resize',stop)
    window.addEventListener('pointerup',release);window.addEventListener('pointercancel',release)
    document.addEventListener('visibilitychange',hidden)
    return ()=>{stop();window.removeEventListener('blur',stop);window.removeEventListener('resize',stop);window.removeEventListener('pointerup',release);window.removeEventListener('pointercancel',release);document.removeEventListener('visibilitychange',hidden)}
  },[stop])
  const update=(event:PointerEvent<HTMLDivElement>)=>{
    if(!active||pointer.current!==event.pointerId)return
    const rect=event.currentTarget.getBoundingClientRect()
    const vector=joystickVector(event.clientX-rect.left-rect.width/2,event.clientY-rect.top-rect.height/2,Math.max(1,(rect.width-48)/2-7))
    movement.forward=vector.forward;movement.side=vector.side;setKnob({x:vector.x,y:vector.y})
  }
  return <div className="hunt-joystick-wrap">
    <div className="hunt-joystick" ref={base} role="group" tabIndex={0} aria-label={label} aria-description={help} aria-disabled={!active}
      onPointerDown={event=>{if(!active||pointer.current!==null)return;event.preventDefault();pointer.current=event.pointerId;event.currentTarget.setPointerCapture(event.pointerId);update(event)}}
      onPointerMove={update}
      onPointerUp={event=>{if(pointer.current===event.pointerId)stop()}}
      onPointerCancel={event=>{if(pointer.current===event.pointerId)stop()}}
      onLostPointerCapture={event=>{if(pointer.current===event.pointerId)stop()}}>
      <span className="joystick-directions" aria-hidden="true"><i>▲</i><i>◀</i><i>▶</i><i>▼</i></span>
      <span className="joystick-knob" aria-hidden="true" style={{transform:`translate(${knob.x}px,${knob.y}px)`}}/>
    </div>
    <span className="joystick-label">{label}</span>
  </div>
}
