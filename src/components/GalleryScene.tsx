import { Component, useMemo, useState, type ReactNode } from 'react'
import { Canvas } from '@react-three/fiber'
import { useCursor, useGLTF } from '@react-three/drei'
import { Mesh } from 'three'
import WalkControls from './WalkControls'
function Vessel({onInspect}:{onInspect:()=>void}) {
  const [hover,setHover]=useState(false); useCursor(hover)
  const {scene}=useGLTF(import.meta.env.BASE_URL+'models/test_vessel.glb')
  const model=useMemo(()=>{
    const clone=scene.clone(true)
    clone.traverse(object=>{if(object instanceof Mesh){object.castShadow=true;object.receiveShadow=true}})
    return clone
  },[scene])
  return <group position={[0,1.12,0]} scale={hover?1.025:1} onClick={e=>{e.stopPropagation();onInspect()}} onPointerOver={()=>setHover(true)} onPointerOut={()=>setHover(false)}><primitive object={model}/></group>
}
function Box({position,scale,color}:{position:[number,number,number];scale:[number,number,number];color:string}) {
  return <mesh position={position} scale={scale} castShadow receiveShadow><boxGeometry/><meshStandardMaterial color={color} roughness={.82}/></mesh>
}
function Hall({onInspect,active}:{onInspect:()=>void;active:boolean}) {
  return <>
    <color attach="background" args={['#172321']}/><fog attach="fog" args={['#172321',13,30]}/>
    <ambientLight intensity={.7}/><hemisphereLight args={['#d8e3d7','#3a2b20',1.5]}/>
    <spotLight position={[1,7,3]} angle={.48} penumbra={.7} intensity={110} color="#ffe2ad" castShadow shadow-mapSize={[1024,1024]}/>
    <pointLight position={[-4,3,-3]} intensity={20} color="#84bdb1"/>
    <mesh rotation={[-Math.PI/2,0,0]} receiveShadow><planeGeometry args={[20,20]}/><meshStandardMaterial color="#3b4540" roughness={.65}/></mesh>
    <gridHelper args={[20,20,'#647065','#48524b']} position={[0,.003,0]}/>
    <Box position={[0,3,-5]} scale={[16,6,.3]} color="#24342f"/>
    <Box position={[-7,3,0]} scale={[.3,6,10]} color="#283a33"/>
    <Box position={[7,3,0]} scale={[.3,6,16]} color="#283a33"/>
    <Box position={[0,3,8]} scale={[14,6,.3]} color="#24342f"/>
    <Box position={[0,6,1.5]} scale={[14,.2,13]} color="#172822"/>
    {[-6,-3,0,3,6].map(x=><group key={x}><Box position={[x,3,-4.8]} scale={[.12,5.8,.1]} color="#9c8961"/><Box position={[x,4.6,-4.7]} scale={[1.9,.025,.1]} color="#c0ac7c"/></group>)}
    <Box position={[0,.12,0]} scale={[3.4,.24,3]} color="#202e2a"/>
    <Box position={[0,.65,0]} scale={[1.7,1.06,1.5]} color="#c4c0ac"/>
    <Box position={[0,1.09,0]} scale={[1.85,.08,1.65]} color="#c1aa79"/>
    <Vessel onInspect={onInspect}/>
    {/* Thin glass panels form a real 3D display case; front left open for picking. */}
    {[-1,1].map(x=><mesh key={x} position={[x*.94,2,0]}><boxGeometry args={[.025,1.8,1.75]}/><meshPhysicalMaterial color="#a4c9bc" transparent opacity={.10} roughness={.1} depthWrite={false}/></mesh>)}
    <mesh position={[0,2,-.88]}><boxGeometry args={[1.9,1.8,.025]}/><meshPhysicalMaterial transparent opacity={.1} color="#a4c9bc" depthWrite={false}/></mesh>
    <Box position={[0,2.92,0]} scale={[1.94,.035,1.8]} color="#7c826f"/>
    {[-4,4].map(x=><group key={x}><Box position={[x,.6,-2]} scale={[1.3,1.2,1.3]} color="#56635a"/><mesh position={[x,1.55,-2]}><boxGeometry args={[1.2,.7,1.2]}/><meshPhysicalMaterial color="#94ad9b" transparent opacity={.13} depthWrite={false}/></mesh></group>)}
    <WalkControls active={active}/>
  </>
}
class SceneBoundary extends Component<{children:ReactNode;message:string},{failed:boolean}> {
  state={failed:false}
  static getDerivedStateFromError(){return {failed:true}}
  render(){return this.state.failed?<div className="scene-error" role="alert">{this.props.message}</div>:this.props.children}
}
export default function GalleryScene({onInspect,error,active}:{onInspect:()=>void;error:string;active:boolean}) {
  return <SceneBoundary message={error}><Canvas shadows dpr={[1,1.5]} camera={{position:[0,1.75,5.8],fov:55,near:.1,far:50}} gl={{antialias:true,powerPreference:'high-performance'}} fallback={<div className="scene-error">{error}</div>}><Hall onInspect={onInspect} active={active}/></Canvas></SceneBoundary>
}
