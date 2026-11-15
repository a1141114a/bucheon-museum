import {Suspense,useEffect,useMemo,useRef,useState} from 'react'
import {createPortal,useFrame,useThree} from '@react-three/fiber'
import {useFBO} from '@react-three/drei'
import {Frustum,Matrix4,MeshBasicMaterial,PerspectiveCamera,Scene,ShaderMaterial,Sphere,Vector3} from 'three'
import {paintingCrops} from '../data/paintingWorlds'
import {portalPlane,type PortalDirection,type PaintingProgress} from '../state/paintings'
import {OriginalSurface} from './ArtPortal'
import PaintingWorld,{Model,WorldLight} from './PaintingWorld'
import {configurePortalCamera,portalProjectionScratch} from './portalProjection'
import PaintingRoomItems from './PaintingRoomItems'

/** One real offscreen room, warmed before placement. Projection is through the
 * aperture from the player's translated eye, not a fixed scene preview. */
export default function WalkThroughPortal({room,direction,placed,onReady,progress}:{room:number;direction:PortalDirection;placed:boolean;onReady:()=>void;progress:PaintingProgress}){
 const {gl,camera,size,viewport}=useThree(),forward=direction==='forward',index=forward?room+1:room-1,frameIndex=forward?room+1:room
 const crop=paintingCrops[frameIndex],height=3.4,width=height*crop[2]/crop[3],z=forward?-portalPlane:portalPlane
 const fbo=useFBO(Math.min(1200,size.width*viewport.dpr),Math.min(1000,size.height*viewport.dpr),{samples:0,depthBuffer:true})
 const [loaded,setLoaded]=useState(false),[shown,setShown]=useState(false),frames=useRef(0),reported=useRef(false),fade=useRef(placed?1:0),photo=useRef<MeshBasicMaterial>(null)
 const scene=useMemo(()=>new Scene(),[]),view=useMemo(()=>new PerspectiveCamera(),[]),warmEye=useMemo(()=>new PerspectiveCamera(),[])
 const maths=useMemo(()=>({matrix:new Matrix4(),frustum:new Frustum(),sphere:new Sphere(new Vector3(0,1.8,z),Math.hypot(width,height)/2)}),[z,width])
 const projection=useMemo(portalProjectionScratch,[])
 const windowMaterial=useMemo(()=>new ShaderMaterial({uniforms:{picture:{value:fbo.texture}},vertexShader:'varying vec4 clipPosition;void main(){gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);clipPosition=gl_Position;}',fragmentShader:'uniform sampler2D picture;varying vec4 clipPosition;void main(){vec2 uv=clipPosition.xy/clipPosition.w*.5+.5;gl_FragColor=texture2D(picture,uv);\n#include <tonemapping_fragment>\n#include <colorspace_fragment>\n}'}),[fbo.texture])
 const loadedCallback=useMemo(()=>()=>setLoaded(true),[])
 useEffect(()=>()=>windowMaterial.dispose(),[windowMaterial])
 useFrame((_,dt)=>{
  const distance=forward?camera.position.z-z:z-camera.position.z
  maths.matrix.multiplyMatrices(camera.projectionMatrix,camera.matrixWorldInverse);maths.frustum.setFromProjectionMatrix(maths.matrix)
  const visible=distance>0&&maths.frustum.intersectsSphere(maths.sphere)
  if(frames.current<3&&!visible){warmEye.position.copy(camera.position);warmEye.rotation.set(0,forward?0:Math.PI,0);warmEye.projectionMatrix.copy(camera.projectionMatrix);warmEye.updateMatrixWorld();configurePortalCamera(warmEye,view,direction,projection)}
  else configurePortalCamera(camera,view,direction,projection)
  if(loaded&&(frames.current<3||(placed&&visible))){
   const target=gl.getRenderTarget(),auto=gl.autoClear,xr=gl.xr.enabled
   gl.xr.enabled=false;gl.autoClear=true;gl.setRenderTarget(fbo);gl.render(scene,view);gl.setRenderTarget(target);gl.autoClear=auto;gl.xr.enabled=xr
   frames.current++
   if(frames.current>=3&&!reported.current){reported.current=true;setShown(true);onReady()}
  }
  if(placed&&shown)fade.current=Math.min(1,fade.current+dt/1.1)
  if(photo.current)photo.current.opacity=placed?1-fade.current:0
 },-.5)
 return <>
 {createPortal(<><WorldLight index={index}/><Suspense fallback={null}><PaintingWorld index={index} onReady={loadedCallback}/><PaintingRoomItems room={index} progress={progress}/></Suspense></>,scene,{camera:view,events:{enabled:false}})}
 <group position={[0,1.8,z]} rotation={[0,forward?0:Math.PI,0]} name={`walk-portal-${direction}-${room}`} userData={{ready:shown,destination:index}}>
  <Model file="portal-frame" scale={[width,height,.95]}/>
  <mesh position={[0,0,-.035]}><planeGeometry args={[width,height]}/><meshBasicMaterial color="#251b13"/></mesh>
  <mesh visible={placed&&shown}><planeGeometry args={[width,height]}/><primitive object={windowMaterial} attach="material"/></mesh>
  {placed&&<mesh position={[0,0,.015]}><planeGeometry args={[width,height]}/><OriginalSurface index={frameIndex} materialRef={photo}/></mesh>}
  {placed&&<pointLight position={[0,0,.8]} color="#ffd77d" intensity={5} distance={3}/>}
 </group>
 </>
}

