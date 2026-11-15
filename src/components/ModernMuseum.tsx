import {Suspense,useCallback,useEffect,useMemo,useRef,useState} from 'react'
import {Link} from 'react-router-dom'
import {Canvas} from '@react-three/fiber'
import {Environment,Lightformer,useGLTF} from '@react-three/drei'
import {Mesh} from 'three'
import {useGame} from '../state/GameProvider'
import {paintingArtifacts} from '../data/paintingArtifacts'
import {modernMuseumModel,museumText,museumWalkable} from '../data/modernMuseum'
import type {Artifact} from '../types'
import PaintingWalk from './PaintingWalk'
import MovementJoystick,{useTouchControls} from './MovementJoystick'
import './modern-museum.css'
const url=import.meta.env.BASE_URL+modernMuseumModel
useGLTF.preload(url,import.meta.env.BASE_URL+'draco/')
const arrival={room:5,x:1.1,z:5.7,yaw:0,pitch:0}
const ignorePose=()=>{}
function MuseumRoom({onReady,inspect}:{onReady:()=>void;inspect:(a:Artifact)=>void}){
 const {scene}=useGLTF(url,import.meta.env.BASE_URL+'draco/')
 const model=useMemo(()=>{const o=scene.clone(true);o.traverse(n=>{if(n instanceof Mesh){const materials=Array.isArray(n.material)?n.material:[n.material];n.castShadow=!materials.some(m=>m.transparent);n.receiveShadow=true;for(const m of materials)if(m.transparent){m.depthWrite=false;n.renderOrder=2}}});return o},[scene])
 useEffect(()=>onReady(),[onReady])
 return <primitive object={model} onClick={(e:{delta:number;object:Mesh;stopPropagation:()=>void})=>{if(e.delta>6)return;let o:typeof e.object|null=e.object;while(o){const id=o.userData.artifactId,art=paintingArtifacts.find(a=>a.id===id);if(art){e.stopPropagation();inspect(art);return}o=o.parent as Mesh|null}}}/>
}
export default function ModernMuseum({active,onArtifact,onRestart}:{active:boolean;onArtifact:(a:Artifact)=>void;onRestart:()=>void}){
 const {state}=useGame(),txt=(key:Parameters<typeof museumText>[1])=>museumText(state.language,key),touch=useTouchControls()
 const [ready,setReady]=useState(false),[info,setInfo]=useState(false),[recap,setRecap]=useState(false),dialog=useRef<HTMLDialogElement>(null)
 const onReady=useCallback(()=>setReady(true),[]),enabled=active&&ready&&!info&&!recap
 useEffect(()=>{if(recap)dialog.current?.showModal();else dialog.current?.close()},[recap])
 return <section className="modern-museum-root" aria-label={txt('title')} data-ready={ready}>
 <Canvas shadows dpr={[1,1.5]} camera={{position:[1.1,1.65,5.7],fov:62,near:.06,far:40}}>
  <color attach="background" args={['#c8c5b9']}/><hemisphereLight args={['#fff9ed','#b2a286',1.45]}/>
  <directionalLight position={[0,4,5]} intensity={1.7} color="#fff3d9"/>
  {[-4,0,4].flatMap(z=>[-1,2].map(x=><pointLight key={x+':'+z} position={[x,2.96,z]} intensity={15} color="#fff5e6" distance={6.5}/>))}
  <Environment resolution={64} frames={1}><Lightformer position={[0,3,0]} rotation={[Math.PI/2,0,0]} scale={[7,10,1]} intensity={1.4}/></Environment>
  <Suspense fallback={null}><MuseumRoom onReady={onReady} inspect={a=>{if(enabled)onArtifact(a)}}/></Suspense>
  <PaintingWalk room={5} active={enabled} onPose={ignorePose} arrival={arrival} walkable={museumWalkable}/>
 </Canvas>
 {!ready&&<div className="modern-loading" role="status">{txt('loading')}</div>}
 <div className="modern-museum-hud">
  <div className="modern-heading"><div><span className="eyebrow">EPILOGUE · BUCHEON</span><h1>{txt('title')}</h1><p>{txt('place')}</p></div><div className="modern-tools"><button className="stone-button" aria-expanded={info} onClick={()=>setInfo(v=>!v)}>{txt('about')}</button><button className="stone-button" onClick={()=>setRecap(true)}>{txt('recap')}</button></div></div>
  {info&&<aside className="modern-info"><h2>{txt('about')}</h2><p>{txt('history')}</p><p>{txt('evidence')}</p><a href="https://www.bcmuseum.or.kr/ko/pages/exhi_permanent" target="_blank" rel="noreferrer">{txt('source')}</a><a href="https://www.bucheon.go.kr/site/homepage/menu/viewMenu?menuid=148006001004009" target="_blank" rel="noreferrer">{txt('city')}</a><button className="stone-button" onClick={()=>setInfo(false)}>{txt('close')}</button></aside>}
  {touch&&<MovementJoystick active={enabled} label={state.language==='zh'?'移动':state.language==='ko'?'이동':'Move'} help={txt('controls')}/>}
  <p className="modern-controls">{txt('controls')}</p>
 </div>
 <dialog ref={dialog} className="modern-ending" aria-label={txt('ending')} onCancel={()=>setRecap(false)}><h2>{txt('ending')}</h2><p>{txt('welcome')}</p><p>{txt('place')}</p><div><button className="stone-button" onClick={()=>setRecap(false)}>{txt('close')}</button><Link className="stone-button" to="/">{txt('home')}</Link><button className="stone-button" onClick={()=>{setRecap(false);onRestart()}}>{txt('restart')}</button></div></dialog>
 </section>
}


