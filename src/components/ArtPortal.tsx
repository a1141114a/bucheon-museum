import {Suspense,useEffect,useMemo,useRef,useState} from 'react'
import {useFrame,useThree,type ThreeEvent} from '@react-three/fiber'
import {PerspectiveCamera,RenderTexture,useTexture} from '@react-three/drei'
import {DoubleSide,Mesh,MeshBasicMaterial,OrthographicCamera,PlaneGeometry,Scene,ShaderMaterial,Texture,Vector3,Vector4,type PerspectiveCamera as Camera} from 'three'
import {artPhoto,paintingCrops} from '../data/paintingWorlds'
import PaintingWorld,{Model,WorldLight} from './PaintingWorld'

export function OriginalSurface({index,opacity=1}:{index:number;opacity?:number}){
 const src=useTexture(artPhoto(index));const texture=useMemo(()=>{const t=src.clone();const [x,y,w,h]=paintingCrops[index];t.offset.set(x,1-y-h);t.repeat.set(w,h);t.needsUpdate=true;return t},[src,index])
 useEffect(()=>()=>texture.dispose(),[texture])
 return <meshBasicMaterial map={texture} transparent opacity={opacity} side={DoubleSide} toneMapped={false}/>
}
export function ArtFrame({index,position=[0,1.8,-8.4],height=3.4,onClick,opacity=1}:{index:number;position?:[number,number,number];height?:number;onClick?:(e:ThreeEvent<MouseEvent>)=>void;opacity?:number}){
 const crop=paintingCrops[index],w=height*crop[2]/crop[3]
 return <group position={position} onClick={onClick}><Model file="portal-frame" scale={[w, height, .95]}/><mesh position={[0,0,-.03]}><planeGeometry args={[w,height]}/><OriginalSurface index={index} opacity={opacity}/></mesh></group>
}

// Render a genuine next-room scene into the window. The same projection fills the
// viewport during crossing; no prerecorded scene or flat background is substituted.
export default function ArtPortal({index,placed,entering,onEntered,onReady,position=[0,1.8,-8.4],height=3.4,onClick,empty=false}:{index:number;placed:boolean;entering:boolean;onEntered:()=>void;onReady?:()=>void;position?:[number,number,number];height?:number;onClick?:()=>void;empty?:boolean}){
 const {camera,gl,size}=useThree(),target=useRef<Texture>(null),view=useRef<Camera>(null),photo=useRef<MeshBasicMaterial>(null),start=useRef<number|null>(null),reveal=useRef(0),finished=useRef(false)
 const [ready,setReady]=useState(false),crop=paintingCrops[index],width=height*crop[2]/crop[3]
 const onLoaded=useMemo(()=>()=>setReady(true),[])
 useEffect(()=>{if(ready)onReady?.()},[ready,onReady])
 const overlay=useMemo(()=>{
  const scene=new Scene(),cam=new OrthographicCamera(-1,1,1,-1,0,2),material=new ShaderMaterial({depthTest:false,depthWrite:false,transparent:true,uniforms:{picture:{value:null},rect:{value:new Vector4(0,0,1,1)}},vertexShader:'varying vec2 v;void main(){v=uv;gl_Position=vec4(position.xy,0.,1.);}',fragmentShader:'uniform sampler2D picture;uniform vec4 rect;varying vec2 v;void main(){vec2 p=(v-rect.xy)/rect.zw;if(p.x<0.||p.x>1.||p.y<0.||p.y>1.)discard;gl_FragColor=texture2D(picture,p);#include <tonemapping_fragment>\n#include <colorspace_fragment>\n}' .replace(';#include',';\n#include')})
  const mesh=new Mesh(new PlaneGeometry(2,2),material);scene.add(mesh);return {scene,cam,material,mesh}
 },[])
 useEffect(()=>()=>{overlay.mesh.geometry.dispose();overlay.material.dispose()},[overlay])
 const rectangle=useRef(new Vector4()),initialRect=useRef<Vector4|null>(null)
 useEffect(()=>{if(!entering){start.current=null;initialRect.current=null;finished.current=false}},[entering])
 useFrame((state,dt)=>{
  if(placed&&ready)reveal.current=Math.min(1,reveal.current+dt/1.5)
  if(photo.current)photo.current.opacity=empty&&!placed?0:1-reveal.current
  if(view.current){view.current.aspect=width/height;view.current.fov=45;view.current.updateProjectionMatrix()}
  if(entering&&ready&&target.current){
   if(start.current===null){start.current=state.clock.elapsedTime
    const a=new Vector3(position[0]-width/2,position[1]-height/2,position[2]).project(camera),b=new Vector3(position[0]+width/2,position[1]+height/2,position[2]).project(camera)
    initialRect.current=new Vector4((a.x+1)/2,(a.y+1)/2,Math.abs(b.x-a.x)/2,Math.abs(b.y-a.y)/2)
   }
   const t=Math.min(1,(state.clock.elapsedTime-start.current)/2.25),ease=t*t*(3-2*t),r=rectangle.current.copy(initialRect.current!).lerp(new Vector4(0,0,1,1),ease)
   if(view.current){view.current.aspect=r.z*size.width/(r.w*size.height);view.current.fov=45+(Math.min(90,2*Math.atan(Math.tan(Math.PI/8)/Math.min(1,size.width/size.height))*180/Math.PI)-45)*ease;view.current.updateProjectionMatrix()}
   overlay.material.uniforms.picture.value=target.current;overlay.material.uniforms.rect.value=r
   gl.autoClear=true;gl.render(state.scene,camera);gl.autoClear=false;gl.clearDepth();gl.render(overlay.scene,overlay.cam);gl.autoClear=true
   if(t===1&&!finished.current){finished.current=true;onEntered()}
  }else gl.render(state.scene,camera)
 },1)
 return <group position={position} onClick={e=>{if(e.delta<6){e.stopPropagation();onClick?.()}}} name={`art-portal-${index}`}>
 <Model file="portal-frame" scale={[width,height,.95]}/>
 <mesh position={[0,0,-.04]}><planeGeometry args={[width,height]}/><meshBasicMaterial color="#302014"/></mesh>
 {placed&&<Suspense fallback={null}><mesh><planeGeometry args={[width,height]}/><meshBasicMaterial toneMapped={false}>
  <RenderTexture attach="map" ref={target} samples={2} width={Math.min(1440,size.width)} height={Math.min(1100,size.height)} renderPriority={0}>
   <PerspectiveCamera ref={view} makeDefault manual fov={45} aspect={width/height} position={[0,1.65,8]} near={.08} far={70}/>
   <WorldLight index={index}/><Suspense fallback={null}><PaintingWorld index={index} onReady={onLoaded}/></Suspense>
  </RenderTexture>
 </meshBasicMaterial></mesh></Suspense>}
 <mesh position={[0,0,.015]}><planeGeometry args={[width,height]}/><PhotoFade index={index} materialRef={photo}/></mesh>
 {placed&&<pointLight position={[0,0,1]} color="#ffd77d" intensity={8} distance={4}/>}
 </group>
}
function PhotoFade({index,materialRef}:{index:number;materialRef:React.RefObject<MeshBasicMaterial|null>}){
 const src=useTexture(artPhoto(index)),texture=useMemo(()=>{const t=src.clone(),[x,y,w,h]=paintingCrops[index];t.offset.set(x,1-y-h);t.repeat.set(w,h);t.needsUpdate=true;return t},[src,index])
 useEffect(()=>()=>texture.dispose(),[texture]);return <meshBasicMaterial ref={materialRef} map={texture} transparent side={DoubleSide} toneMapped={false}/>
}
