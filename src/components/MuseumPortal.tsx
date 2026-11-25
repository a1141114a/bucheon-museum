import {useEffect,useMemo,useRef,useState} from 'react'
import {useFrame,useThree} from '@react-three/fiber'
import {CanvasTexture,Group,Matrix4,PerspectiveCamera,Quaternion,ShaderMaterial,SRGBColorSpace,Vector3,VideoTexture} from 'three'
import {museumPortal,nearMuseumPortal,portalRevealSeconds,portalPullSeconds,portalVideoUrl,portalFrameHeight} from '../state/museumJourney'
import {portalAlphaMatte} from './portalMatte'
export type IntroPhase='waiting'|'reveal'|'pulling'|'complete'
const vertex=`varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`
// The source movie is unchanged; a connected-background matte removes its
// baked checkerboard while retaining the vortex's enclosed dark areas.
const fragment=`uniform sampler2D movie;uniform sampler2D matte;uniform float revealOpacity;varying vec2 vUv;void main(){vec4 c=texture2D(movie,vUv);float alpha=texture2D(matte,vUv).r*c.a*revealOpacity;if(alpha<.03)discard;gl_FragColor=vec4(c.rgb,alpha);}`
export default function MuseumPortal({active,onPhase}:{active:boolean;onPhase:(p:IntroPhase)=>void}){
 const {camera}=useThree(),group=useRef<Group>(null),phase=useRef<IntroPhase>('waiting'),time=useRef(0)
 const origin=useRef(new Vector3()),facing=useRef(new Quaternion()),revealFacing=useRef(new Quaternion()),destination=useRef(new Quaternion())
 const [media,setMedia]=useState<{video:HTMLVideoElement;texture:VideoTexture;mask:CanvasTexture}|null>(null),[ready,setReady]=useState(false),[failed,setFailed]=useState(false)
 const reduced=useMemo(()=>window.matchMedia('(prefers-reduced-motion: reduce)').matches,[]),originalFov=useRef(camera instanceof PerspectiveCamera?camera.fov:62)
 const material=useMemo(()=>media?new ShaderMaterial({uniforms:{movie:{value:media.texture},matte:{value:media.mask},revealOpacity:{value:0}},vertexShader:vertex,fragmentShader:fragment,transparent:true,depthWrite:false,toneMapped:false}):null,[media])
 useEffect(()=>()=>material?.dispose(),[material])
 useEffect(()=>{
  const video=document.createElement('video');video.defaultMuted=true;video.muted=true;video.loop=true;video.playsInline=true;video.preload='auto';video.crossOrigin='anonymous';video.setAttribute('muted','');video.setAttribute('playsinline','');video.setAttribute('webkit-playsinline','');video.dataset.museumPortal='true';video.src=import.meta.env.BASE_URL+portalVideoUrl
  const texture=new VideoTexture(video);texture.colorSpace=SRGBColorSpace;let mask:CanvasTexture|null=null
  const error=()=>{setFailed(true);setReady(true)}
  const loaded=()=>{if(mask)return;try{const canvas=document.createElement('canvas');canvas.width=video.videoWidth;canvas.height=video.videoHeight;const ctx=canvas.getContext('2d',{willReadFrequently:true});if(!ctx){error();return}ctx.drawImage(video,0,0);const image=ctx.getImageData(0,0,canvas.width,canvas.height);image.data.set(portalAlphaMatte(canvas.width,canvas.height,image.data));ctx.putImageData(image,0,0);mask=new CanvasTexture(canvas);setMedia({video,texture,mask});setReady(true)}catch{error()}}
  video.addEventListener('loadeddata',loaded);video.addEventListener('error',error);video.load()
  return()=>{video.pause();video.removeEventListener('loadeddata',loaded);video.removeEventListener('error',error);video.removeAttribute('src');video.load();texture.dispose();mask?.dispose()}
 },[])
 useEffect(()=>{
  if(!media)return;const {video}=media
  const resume=()=>{if(active&&phase.current!=='waiting'&&phase.current!=='complete'&&!document.hidden&&!reduced)void video.play().catch(()=>{})}
  const visibility=()=>{if(document.hidden)video.pause();else resume()}
  if(!active||phase.current==='complete')video.pause();else resume()
  document.addEventListener('visibilitychange',visibility);window.addEventListener('pointerdown',resume,{passive:true});window.addEventListener('pageshow',resume)
  return()=>{document.removeEventListener('visibilitychange',visibility);window.removeEventListener('pointerdown',resume);window.removeEventListener('pageshow',resume)}
 },[media,active,reduced])
 const start=(p:IntroPhase)=>{phase.current=p;time.current=0;onPhase(p)}
 useFrame((_,dt)=>{
  if(!active||document.hidden)return
  if(media&&media.video.readyState>=2)media.texture.needsUpdate=true
  if(phase.current==='waiting'){
   if(!ready||!nearMuseumPortal(camera.position))return
   origin.current.copy(camera.position);facing.current.copy(camera.quaternion);revealFacing.current.setFromRotationMatrix(new Matrix4().lookAt(origin.current,new Vector3(museumPortal.x,1.65,museumPortal.z),new Vector3(0,1,0)));destination.current.setFromRotationMatrix(new Matrix4().lookAt(new Vector3(museumPortal.x,1.65,-6.55),new Vector3(museumPortal.x,1.65,-7),new Vector3(0,1,0)))
   if(media){media.video.currentTime=0;if(!reduced)void media.video.play().catch(()=>{})}start('reveal')
  }
  time.current+=Math.min(dt,.05)
  if(group.current)group.current.visible=true
  if(material)material.uniforms.revealOpacity.value=phase.current==='reveal'?Math.min(1,time.current/.25):1
  if(phase.current==='reveal'){const t=Math.min(1,time.current/portalRevealSeconds);if(!reduced)camera.quaternion.slerpQuaternions(facing.current,revealFacing.current,t*t*(3-2*t));if(t===1){facing.current.copy(camera.quaternion);start('pulling')}}
  if(phase.current==='pulling'){
   const t=Math.min(1,time.current/portalPullSeconds),ease=t*t*(3-2*t)
   if(!reduced){camera.position.lerpVectors(origin.current,new Vector3(museumPortal.x,1.65,-6.55),ease);camera.quaternion.slerpQuaternions(facing.current,destination.current,ease);if(camera instanceof PerspectiveCamera){camera.fov=originalFov.current+ease*12;camera.updateProjectionMatrix()}}
   if(t===1){media?.video.pause();start('complete')}
  }
 })
 return <group ref={group} visible={false} position={[museumPortal.x,museumPortal.y,museumPortal.z+.09]} name="intro-museum-portal">
  {material&&!failed?<mesh material={material} name="intro-portal-video"><planeGeometry args={[portalFrameHeight*720/752,portalFrameHeight]}/></mesh>:<mesh><ringGeometry args={[.65,.71,64]}/><meshBasicMaterial color="#ffd29a"/></mesh>}
 </group>
}
