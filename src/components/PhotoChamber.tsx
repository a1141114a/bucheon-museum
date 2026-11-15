import {lazy,Suspense,useCallback,useEffect,useRef,useState} from 'react'
import {Link} from 'react-router-dom'
import type {Artifact} from '../types'
import {useGame} from '../state/GameProvider'
import {isLevelUnlocked} from '../state/game'
import {alignedPainting,artworkPositions,nearPoint,nearPortal,throughPortal,type Pose,type PortalDirection} from '../state/paintings'
import {paintingCopy,worldName} from '../data/paintingWorlds'
import {paintingArtifacts} from '../data/paintingArtifacts'
import {museumText} from '../data/modernMuseum'
import MovementJoystick,{useTouchControls} from './MovementJoystick'
import './photo-chamber.css'
const Scene=lazy(()=>import('./PaintingScene'))
const ModernMuseum=lazy(()=>import('./ModernMuseum'))
export default function PhotoChamber({active,onArtifact}:{active:boolean;onArtifact:(a:Artifact)=>void}){
 const {state,dispatch}=useGame(),p=state.photo,lang=state.language,txt=(key:Parameters<typeof paintingCopy>[1])=>paintingCopy(lang,key)
 const touch=useTouchControls(),[guide,setGuide]=useState(false),[raised,setRaised]=useState(false),[opening,setOpening]=useState(false),[readyRoom,setReadyRoom]=useState(-1),[finale,setFinale]=useState(p.finished)
 const [arrival,setArrival]=useState<(Pose&{room:number})|undefined>(),initialReady=useRef(false)
 const [pose,setPose]=useState<Pose>({x:0,z:8,yaw:0,pitch:0}),livePose=useRef(pose),next=p.room+1,found=p.found.includes(next),placed=p.placed.includes(next)
 const updatePose=useCallback((value:Pose)=>{livePose.current=value;setPose(value)},[]),onReady=useCallback(()=>{initialReady.current=true;setReadyRoom(p.room)},[p.room]),ready=readyRoom===p.room
 const inspectArtwork=useCallback(()=>onArtifact(paintingArtifacts[p.room]),[onArtifact,p.room])
 const enabled=active&&!guide&&!opening&&!finale&&ready
 const nearby=nearPoint(pose,artworkPositions[p.room]),aligned=alignedPainting(pose),atPortal=nearPortal(pose)
 useEffect(()=>{setRaised(false)},[p.room])
 useEffect(()=>{if(p.room===4)void import('./ModernMuseum')},[p.room])
 useEffect(()=>{const close=(e:KeyboardEvent)=>{if(e.key==='Escape')setGuide(false)};window.addEventListener('keydown',close);return()=>window.removeEventListener('keydown',close)},[])
 const take=()=>{if(enabled)dispatch({type:p.room===4?'photo-key':'photo-find',pose:livePose.current})}
 const cross=useCallback((direction:PortalDirection,from:Pose)=>{
  const room=p.room+(direction==='forward'?1:-1),to=throughPortal(from,direction)
  setArrival({...to,room});livePose.current=to;setPose(to);setReadyRoom(room)
  dispatch({type:direction==='forward'?'photo-enter':'photo-back',pose:from})
 },[p.room,dispatch])
 const open=()=>{if(enabled&&p.key&&atPortal)setOpening(true)}
 const place=()=>{if(enabled&&raised&&aligned) {dispatch({type:'photo-place',pose:livePose.current});setRaised(false)}}
 useEffect(()=>{
  const key=(e:KeyboardEvent)=>{if(e.code!=='KeyE'||e.repeat||!enabled)return;e.preventDefault();if(p.room===4){if(nearby&&!p.key)take();else open()}else if(nearby&&!found)take();else if(!placed&&raised&&aligned)place();else if(found&&!placed)setRaised(v=>!v)}
  window.addEventListener('keydown',key);return()=>window.removeEventListener('keydown',key)
 })
 if(!isLevelUnlocked(state,3)||!p.entered)return <section className="photo-entry"><h1>{txt('title')}</h1><p>{txt(isLevelUnlocked(state,3)?'entryNote':'locked')}</p><Link className="stone-button" to="/levels/2">{txt('back')}</Link></section>
 if(p.finished)return <Suspense fallback={<section className="photo-loading" role="status">{txt('loading')}</section>}><ModernMuseum active={active} onArtifact={onArtifact} onRestart={()=>{dispatch({type:'photo-restart'});setArrival({room:0,x:0,z:8,yaw:0,pitch:0});setReadyRoom(0);setFinale(false);setOpening(false)}}/></Suspense>
 const message=p.room===4?(p.key?'keyCarry':'keyFind'):placed?'walk':raised?'align':found?'carry':'find'
 return <section className="photo-root" aria-label={txt('title')} data-room={p.room}>
 <Suspense fallback={null}><Scene progress={p} active={enabled} raised={raised} arrival={arrival} opening={opening} onPose={updatePose} onTake={take} onCross={cross} onInspectArtwork={inspectArtwork} onReady={onReady} onOpen={open} onFinish={()=>{dispatch({type:'photo-finish',pose:livePose.current});setOpening(false);setFinale(true)}}/></Suspense>
 {!opening&&<div className="photo-hud" inert={!active||finale}>
 <div className="photo-top"><button className="stone-button" onClick={()=>setGuide(v=>!v)} aria-expanded={guide}>☷ {txt('guide')}</button><span className="photo-world-name">{p.room+1} / 5 · {worldName(lang,p.room)}</span><button className="stone-button" onClick={inspectArtwork}>{txt('info')}</button></div>
 {guide&&<aside className="photo-guide"><h1>{txt('title')}</h1><p>{txt('intro')}</p><p>{txt('controls')}</p><p>{txt('free')}</p><button className="stone-button" onClick={()=>{if(window.confirm(txt('confirm'))){dispatch({type:'photo-restart'});setArrival({room:0,x:0,z:8,yaw:0,pitch:0});setReadyRoom(0);setFinale(false);setOpening(false);setGuide(false)}}}>{txt('restart')}</button><button className="stone-button" onClick={()=>setGuide(false)}>{txt('close')}</button></aside>}
 <div className="photo-bottom"><p role="status">{txt(message)}</p><div className="photo-actions">
 {nearby&&(p.room<4?!found:!p.key)&&<button className="stone-button" onClick={take}>{txt(p.room===4?'keyTake':'take')}</button>}
 {p.room<4&&found&&!placed&&<><button className="stone-button" onClick={()=>setRaised(v=>!v)}>{txt(raised?'lower':'raise')}</button>{raised&&<button className="stone-button" disabled={!aligned} onClick={place}>{txt('place')}</button>}</>}
 {p.room===4&&p.key&&atPortal&&!p.finished&&<button className="stone-button" onClick={open}>{txt('open')}</button>}
 </div></div>
 {touch&&<MovementJoystick active={enabled} label={lang==='zh'?'移动':lang==='ko'?'이동':'Move'} help={txt('controls')}/>}
 </div>}
 {!ready&&!initialReady.current&&<div className="photo-loading" role="status">{txt('loading')}</div>}
 {opening&&<div className="photo-crossing" aria-live="polite"><span>{museumText(lang,'transition')}</span></div>}
 {finale&&<div className="photo-modal-backdrop"><section className="photo-finale" role="dialog" aria-modal="true" aria-label={txt('finish')}><span aria-hidden="true">✧</span><h1>{txt('finish')}</h1><p>{txt('ending')}</p><Link className="stone-button" to="/">{txt('home')}</Link><button className="stone-button" onClick={()=>{dispatch({type:'photo-restart'});setArrival({room:0,x:0,z:8,yaw:0,pitch:0});setReadyRoom(0);setFinale(false)}}>{txt('restart')}</button></section></div>}
 </section>
}

