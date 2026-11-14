import {lazy,Suspense,useCallback,useEffect,useRef,useState} from 'react'
import {Link} from 'react-router-dom'
import type {Artifact} from '../types'
import {useGame} from '../state/GameProvider'
import {isLevelUnlocked} from '../state/game'
import {alignedPainting,artworkPositions,nearPoint,nearPortal,type Pose} from '../state/paintings'
import {artPhoto,paintingCopy,worldName} from '../data/paintingWorlds'
import MovementJoystick,{useTouchControls} from './MovementJoystick'
import './photo-chamber.css'
const Scene=lazy(()=>import('./PaintingScene'))
export default function PhotoChamber({active}:{active:boolean;onArtifact:(a:Artifact)=>void}){
 const {state,dispatch}=useGame(),p=state.photo,lang=state.language,txt=(key:Parameters<typeof paintingCopy>[1])=>paintingCopy(lang,key)
 const touch=useTouchControls(),[guide,setGuide]=useState(false),[info,setInfo]=useState(false),[raised,setRaised]=useState(false),[entering,setEntering]=useState(false),[opening,setOpening]=useState(false),[readyRoom,setReadyRoom]=useState(-1),[finale,setFinale]=useState(p.finished)
 const [pose,setPose]=useState<Pose>({x:0,z:8,yaw:0,pitch:0}),livePose=useRef(pose),next=p.room+1,found=p.found.includes(next),placed=p.placed.includes(next)
 const updatePose=useCallback((value:Pose)=>{livePose.current=value;setPose(value)},[]),onReady=useCallback(()=>setReadyRoom(p.room),[p.room]),ready=readyRoom===p.room
 const enabled=active&&!info&&!guide&&!entering&&!opening&&!finale&&ready
 const nearby=nearPoint(pose,artworkPositions[p.room]),aligned=alignedPainting(pose),atPortal=nearPortal(pose)
 useEffect(()=>{setRaised(false);setEntering(false);setPose({x:0,z:8,yaw:0,pitch:0})},[p.room])
 useEffect(()=>{const close=(e:KeyboardEvent)=>{if(e.key==='Escape'){setInfo(false);setGuide(false)}};window.addEventListener('keydown',close);return()=>window.removeEventListener('keydown',close)},[])
 const take=()=>{if(enabled)dispatch({type:p.room===4?'photo-key':'photo-find',pose:livePose.current})}
 const enter=()=>{if(enabled&&placed&&atPortal)setEntering(true)}
 const open=()=>{if(enabled&&p.key&&atPortal)setOpening(true)}
 const place=()=>{if(enabled&&raised&&aligned) {dispatch({type:'photo-place',pose:livePose.current});setRaised(false)}}
 useEffect(()=>{
  const key=(e:KeyboardEvent)=>{if(e.code!=='KeyE'||e.repeat||!enabled)return;e.preventDefault();if(p.room===4){if(nearby&&!p.key)take();else open()}else if(nearby&&!found)take();else if(placed)enter();else if(raised&&aligned)place();else if(found)setRaised(v=>!v)}
  window.addEventListener('keydown',key);return()=>window.removeEventListener('keydown',key)
 })
 useEffect(()=>{if(enabled&&placed&&atPortal&&pose.z< -7.25)setEntering(true)},[enabled,placed,atPortal,pose.z])
 if(!isLevelUnlocked(state,3)||!p.entered)return <section className="photo-entry"><h1>{txt('title')}</h1><p>{txt(isLevelUnlocked(state,3)?'entryNote':'locked')}</p><Link className="stone-button" to="/levels/2">{txt('back')}</Link></section>
 const message=p.room===4?(p.key?'keyCarry':'keyFind'):placed?'walk':raised?'align':found?'carry':'find'
 return <section className="photo-root" aria-label={txt('title')} data-room={p.room}>
 <Suspense fallback={null}><Scene progress={p} active={enabled} raised={raised} entering={entering} opening={opening} onPose={updatePose} onTake={take} onEnter={enter} onEntered={()=>{dispatch({type:'photo-enter',pose:livePose.current});setEntering(false)}} onReady={onReady} onOpen={open} onFinish={()=>{dispatch({type:'photo-finish',pose:livePose.current});setOpening(false);setFinale(true)}}/></Suspense>
 {!entering&&!opening&&<div className="photo-hud" inert={!active||info||finale}>
 <div className="photo-top"><button className="stone-button" onClick={()=>setGuide(v=>!v)} aria-expanded={guide}>☷ {txt('guide')}</button><span className="photo-world-name">{p.room+1} / 5 · {worldName(lang,p.room)}</span><button className="stone-button" onClick={()=>setInfo(true)}>{txt('info')}</button></div>
 {guide&&<aside className="photo-guide"><h1>{txt('title')}</h1><p>{txt('intro')}</p><p>{txt('controls')}</p><p>{txt('free')}</p><button className="stone-button" onClick={()=>{if(window.confirm(txt('confirm'))){dispatch({type:'photo-restart'});setFinale(false);setOpening(false);setGuide(false)}}}>{txt('restart')}</button><button className="stone-button" onClick={()=>setGuide(false)}>{txt('close')}</button></aside>}
 <div className="photo-bottom"><p role="status">{txt(message)}</p><div className="photo-actions">
 {nearby&&(p.room<4?!found:!p.key)&&<button className="stone-button" onClick={take}>{txt(p.room===4?'keyTake':'take')}</button>}
 {p.room<4&&found&&!placed&&<><button className="stone-button" onClick={()=>setRaised(v=>!v)}>{txt(raised?'lower':'raise')}</button>{raised&&<button className="stone-button" disabled={!aligned} onClick={place}>{txt('place')}</button>}</>}
 {p.room<4&&placed&&atPortal&&<button className="stone-button" onClick={enter}>{txt('enter')}</button>}
 {p.room===4&&p.key&&atPortal&&!p.finished&&<button className="stone-button" onClick={open}>{txt('open')}</button>}
 </div></div>
 {touch&&<MovementJoystick active={enabled} label={lang==='zh'?'移动':lang==='ko'?'이동':'Move'} help={txt('controls')}/>}
 </div>}
 {!ready&&<div className="photo-loading" role="status">{txt('loading')}</div>}
 {(entering||opening)&&<div className="photo-crossing" aria-live="polite"><span>{txt('reveal')}</span></div>}
 {info&&<div className="photo-modal-backdrop" role="presentation"><section className="photo-info" role="dialog" aria-modal="true" aria-label={txt('info')}><button className="stone-button" onClick={()=>setInfo(false)}>{txt('close')}</button><h2>{worldName(lang,p.room)}</h2><img src={artPhoto(p.room)} alt={worldName(lang,p.room)}/><p>{txt('source')}</p></section></div>}
 {finale&&<div className="photo-modal-backdrop"><section className="photo-finale" role="dialog" aria-modal="true" aria-label={txt('finish')}><span aria-hidden="true">✧</span><h1>{txt('finish')}</h1><p>{txt('ending')}</p><Link className="stone-button" to="/">{txt('home')}</Link><button className="stone-button" onClick={()=>{dispatch({type:'photo-restart'});setFinale(false)}}>{txt('restart')}</button></section></div>}
 </section>
}
