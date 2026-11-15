import {Suspense,useCallback,useEffect,useMemo,useRef,useState} from 'react'
import {Link} from 'react-router-dom'
import {Canvas,useFrame,useThree} from '@react-three/fiber'
import {Environment,Lightformer,useGLTF} from '@react-three/drei'
import {Mesh,Object3D,Texture} from 'three'
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
function TrackLight({from,to,power,shadow=false}:{from:[number,number,number];to:[number,number,number];power:number;shadow?:boolean}){
 const target=useMemo(()=>{const o=new Object3D();o.position.set(...to);return o},[to[0],to[1],to[2]])
 return <><primitive object={target}/><spotLight position={from} target={target} color="#fff0d6" intensity={power} angle={.72} penumbra={.72} distance={9} decay={2} castShadow={shadow} shadow-mapSize={[1024,1024]} shadow-camera-near={.08} shadow-camera-far={9} shadow-normalBias={.025} shadow-bias={-.0005}/></>
}
function StaticGalleryShadows({ready}:{ready:boolean}){
 const {gl}=useThree(),frames=useRef(0)
 useEffect(()=>{gl.shadowMap.autoUpdate=true;gl.shadowMap.needsUpdate=true;frames.current=0;return()=>{gl.shadowMap.autoUpdate=true}},[gl,ready])
 useFrame(()=>{if(ready&&++frames.current>5)gl.shadowMap.autoUpdate=false})
 return null
}
function MuseumRoom({onReady,inspect}:{onReady:()=>void;inspect:(a:Artifact)=>void}){
 const {scene}=useGLTF(url,import.meta.env.BASE_URL+'draco/')
 const model=useMemo(()=>{const o=scene.clone(true);o.traverse(n=>{if(n instanceof Mesh){const materials=Array.isArray(n.material)?n.material:[n.material];n.castShadow=!materials.some(m=>m.transparent||/oak|plank joints/i.test(m.name));n.receiveShadow=true;for(const m of materials){for(const value of Object.values(m))if(value instanceof Texture)value.anisotropy=8;if(m.transparent){m.depthWrite=false;n.renderOrder=2}}}});return o},[scene])
 useEffect(()=>onReady(),[onReady])
 return <primitive object={model} onClick={(e:{delta:number;object:Mesh;stopPropagation:()=>void})=>{if(e.delta>6)return;let o:typeof e.object|null=e.object;while(o){const id=o.userData.artifactId,art=paintingArtifacts.find(a=>a.id===id);if(art){e.stopPropagation();inspect(art);return}o=o.parent as Mesh|null}}}/>
}
export default function ModernMuseum({active,onArtifact,onRestart}:{active:boolean;onArtifact:(a:Artifact)=>void;onRestart:()=>void}){
 const {state}=useGame(),txt=(key:Parameters<typeof museumText>[1])=>museumText(state.language,key),touch=useTouchControls()
 const [ready,setReady]=useState(false),[recap,setRecap]=useState(false),dialog=useRef<HTMLDialogElement>(null)
 const onReady=useCallback(()=>setReady(true),[]),enabled=active&&ready&&!recap
 useEffect(()=>{if(recap)dialog.current?.showModal();else dialog.current?.close()},[recap])
 return <section className="modern-museum-root" aria-label={txt('title')} data-ready={ready}>
 <Canvas shadows dpr={[1,1.5]} camera={{position:[1.1,1.65,5.7],fov:62,near:.06,far:40}}>
  <color attach="background" args={['#bdb9af']}/><hemisphereLight args={['#fff7e8','#9e8c70',1.10]}/>
  <TrackLight from={[-1.5,3.03,2.5]} to={[-.3,1.6,2.2]} power={42} shadow/>
  <TrackLight from={[-1.5,3.03,4]} to={[-.3,1.75,2.2]} power={28}/>
  <TrackLight from={[-1.5,3.03,-3.5]} to={[-.45,1.7,-3.25]} power={38} shadow/>
  <TrackLight from={[-1.5,3.03,1]} to={[-3.05,.9,.7]} power={36} shadow/>
  <TrackLight from={[2.5,3.03,4]} to={[3.99,2.02,3.55]} power={22}/>
  <TrackLight from={[2.5,3.03,2.5]} to={[3.99,2.02,1.92]} power={22}/>
  <TrackLight from={[-1.5,3.03,-5]} to={[.15,2.06,-6.2]} power={24}/>
  <Environment resolution={64} frames={1}><Lightformer position={[0,3,0]} rotation={[Math.PI/2,0,0]} scale={[2.5,10,1]} intensity={.7}/><Lightformer position={[3,2,0]} rotation={[0,-Math.PI/2,0]} scale={[1.2,8,1]} intensity={.35}/></Environment>
  <StaticGalleryShadows ready={ready}/>
  <Suspense fallback={null}><MuseumRoom onReady={onReady} inspect={a=>{if(enabled)onArtifact(a)}}/></Suspense>
  <PaintingWalk room={5} active={enabled} onPose={ignorePose} arrival={arrival} walkable={museumWalkable}/>
 </Canvas>
 {!ready&&<div className="modern-loading" role="status">{txt('loading')}</div>}
 <div className="modern-museum-hud">
  <div className="modern-heading"><div><span className="eyebrow">EPILOGUE · BUCHEON</span><h1>{txt('title')}</h1><p>{txt('place')}</p></div><div className="modern-tools"><button className="stone-button" onClick={()=>setRecap(true)}>{txt('recap')}</button><nav className="modern-source-links"><a href="https://www.bcmuseum.or.kr/ko/pages/exhi_permanent" target="_blank" rel="noreferrer">{txt('source')}</a><a href="https://www.bucheon.go.kr/site/homepage/menu/viewMenu?menuid=148006001004009" target="_blank" rel="noreferrer">{txt('city')}</a></nav></div></div>
  {touch&&<MovementJoystick active={enabled} label={state.language==='zh'?'移动':state.language==='ko'?'이동':'Move'} help={txt('controls')}/>}
  <p className="modern-controls">{txt('controls')}</p>
 </div>
 <dialog ref={dialog} className="modern-ending" aria-label={txt('ending')} onCancel={()=>setRecap(false)}><h2>{txt('ending')}</h2><p>{txt('welcome')}</p><p>{txt('place')}</p><div><button className="stone-button" onClick={()=>setRecap(false)}>{txt('close')}</button><Link className="stone-button" to="/">{txt('home')}</Link><button className="stone-button" onClick={()=>{setRecap(false);onRestart()}}>{txt('restart')}</button></div></dialog>
 </section>
}




