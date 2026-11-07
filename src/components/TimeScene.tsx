import { Component, Suspense, useEffect, useMemo, useRef, type ReactNode } from 'react'
import { Canvas, useFrame, useThree, type ThreeEvent } from '@react-three/fiber'
import { OrbitControls, useGLTF } from '@react-three/drei'
import { Box3, CanvasTexture, MathUtils, Object3D, SRGBColorSpace, Vector3 } from 'three'
import { artifacts } from '../data/artifacts'
import { timeArtifactIds } from '../state/time'
import type { Artifact } from '../types'

const turn=Math.PI*2/3
const radii=[1.47,1.09,.71]
const positions:[number,number,number][]=[[-3.55,.64,-.35],[0,.64,-3.7],[3.55,.64,-.35]]

function Model({url}:{url:string}) {
  const {scene}=useGLTF(import.meta.env.BASE_URL+url)
  const model=useMemo(()=>{
    const clone=scene.clone(true)
    const size=new Box3().setFromObject(clone)
    const center=size.getCenter(new Vector3())
    const dimensions=size.getSize(new Vector3())
    const scale=Math.min(.98/Math.max(dimensions.x,.001),1.24/Math.max(dimensions.y,.001),.85/Math.max(dimensions.z,.001))
    return {clone,scale,offset:[-center.x*scale,-size.min.y*scale,-center.z*scale] as [number,number,number]}
  },[scene])
  return <group position={model.offset} scale={model.scale}><primitive object={model.clone}/></group>
}

function Symbol({letter,ring,index}:{letter:string;ring:number;index:number}) {
  const texture=useMemo(()=>{
    const canvas=document.createElement('canvas')
    canvas.width=128;canvas.height=128
    const context=canvas.getContext('2d')!
    context.fillStyle='#35271b';context.beginPath();context.arc(64,64,59,0,Math.PI*2);context.fill()
    context.strokeStyle='#e4bc72';context.lineWidth=6;context.stroke()
    context.font='700 78px Georgia';context.textAlign='center';context.textBaseline='middle'
    context.fillStyle='#ffdf9a';context.fillText(letter,64,68)
    const map=new CanvasTexture(canvas);map.colorSpace=SRGBColorSpace
    return map
  },[letter])
  useEffect(()=>()=>texture.dispose(),[texture])
  const angle=index*turn
  return <mesh position={[Math.sin(angle)*radii[ring],.134,-Math.cos(angle)*radii[ring]]} rotation={[-Math.PI/2,0,0]}>
    <planeGeometry args={[.205,.205]}/><meshBasicMaterial map={texture} transparent toneMapped={false}/>
  </mesh>
}

interface SceneProps {
  rings:readonly number[]
  selected:number
  active:boolean
  solved:boolean
  celebrating:boolean
  viewKey:number
  onSelect:(index:number)=>void
  onArtifact:(artifact:Artifact)=>void
  error:string
}

function Mechanism({rings,selected,active,solved,onSelect}:SceneProps) {
  const {scene}=useGLTF(import.meta.env.BASE_URL+'models/time-mechanism.glb')
  const object=useMemo(()=>scene.clone(true),[scene])
  const nodes=useMemo(()=>radii.map((_,i)=>object.getObjectByName('TimeRing'+i)),[object])
  useFrame((_,delta)=>{
    nodes.forEach((node,i)=>{
      if(!node)return
      const target=rings[i]*turn
      const shortest=node.rotation.y+MathUtils.euclideanModulo(target-node.rotation.y+Math.PI,Math.PI*2)-Math.PI
      node.rotation.y=MathUtils.damp(node.rotation.y,shortest,9,delta)
    })
  })
  return <>
    <primitive object={object} onClick={(event:ThreeEvent<MouseEvent>)=>{
      if(!active||solved)return
      event.stopPropagation()
      let node:Object3D|null=event.object
      while(node){
        const match=/^TimeRing([0-2])$/.exec(node.name)
        if(match){onSelect(Number(match[1]));return}
        node=node.parent
      }
    }}/>
    {radii.map((radius,i)=><group key={i} position={[0,[1.15,1.17,1.19][i],0]} rotation={[0,rings[i]*turn,0]}
      onClick={event=>{if(active&&!solved){event.stopPropagation();onSelect(i)}}}>
      {['A','B','C'].map((letter,index)=><Symbol key={letter} letter={letter} ring={i} index={index}/>)}
      {selected===i&&!solved&&<mesh rotation={[-Math.PI/2,0,0]} position={[0,.025,0]}>
        <ringGeometry args={[radius-.125,radius+.125,96]}/><meshBasicMaterial color="#ffcb71" transparent opacity={.20} depthWrite={false}/>
      </mesh>}
    </group>)}
  </>
}

function Chamber({onArtifact,solved}:Pick<SceneProps,'onArtifact'|'solved'>) {
  return <>
    <color attach="background" args={['#1f2824']}/><fog attach="fog" args={['#1f2824',14,31]}/>
    <hemisphereLight args={['#ffe8c8','#263d36',2]}/><ambientLight intensity={.55}/>
    <directionalLight position={[3,8,5]} intensity={2.5} color="#ffe0a3"/>
    <pointLight position={[0,3,-3.5]} color={solved?'#b2f1df':'#5ba394'} intensity={solved?18:7} distance={13}/>
    <mesh rotation={[-Math.PI/2,0,0]}><planeGeometry args={[22,22]}/><meshStandardMaterial color="#414037" roughness={.72}/></mesh>
    <gridHelper args={[22,11,'#796849','#504b3f']} position={[0,.003,0]}/>
    <mesh position={[0,3.2,-6]}><boxGeometry args={[18,6.4,.25]}/><meshStandardMaterial color="#293c34"/></mesh>
    {[-1,1].map(side=><group key={side}>
      <mesh position={[side*7,3.1,0]}><boxGeometry args={[.25,6.2,12]}/><meshStandardMaterial color="#293c34"/></mesh>
      {[-4,0,4].map(z=><mesh key={z} position={[side*6.75,2.7,z]}><cylinderGeometry args={[.18,.23,5.4,8]}/><meshStandardMaterial color="#5f5038" metalness={.3}/></mesh>)}
    </group>)}
    <group position={[0,2.5,-5.78]}>
      {[1.5,1.73,1.98].map(radius=><mesh key={radius}><torusGeometry args={[radius,.034,8,96]}/><meshStandardMaterial color="#b68a49" metalness={.52} roughness={.4}/></mesh>)}
      {[0,1,2,3,4,5].map(i=><mesh key={i} position={[Math.sin(i*Math.PI/3)*2.18,Math.cos(i*Math.PI/3)*2.18,0]} rotation={[0,0,-i*Math.PI/3]}>
        <boxGeometry args={[.075,.25,.055]}/><meshStandardMaterial color="#c29d60" metalness={.45}/>
      </mesh>)}
    </group>
    {timeArtifactIds.map((id,index)=>{
      const artifact=artifacts.find(item=>item.id===id)!
      return <group key={id} position={positions[index]} onClick={event=>{event.stopPropagation();onArtifact(artifact)}}>
        <mesh position={[0,-.32,0]}><cylinderGeometry args={[.67,.73,.64,8]}/><meshStandardMaterial color="#544731" roughness={.5}/></mesh>
        <mesh position={[0,.025,0]}><cylinderGeometry args={[.70,.70,.07,64]}/><meshStandardMaterial color="#a08048" metalness={.35}/></mesh>
        <group position={[0,.065,0]}><Suspense fallback={null}><Model url={artifact.model.url!}/></Suspense></group>
      </group>
    })}
    {solved&&<>
      <mesh position={[0,3.15,0]}><cylinderGeometry args={[.08,.24,3.4,32,1,true]}/><meshBasicMaterial color="#97f6da" transparent opacity={.18} depthWrite={false}/></mesh>
      <mesh position={[0,1.42,0]}><sphereGeometry args={[.21,20,12]}/><meshBasicMaterial color="#c0ffe5"/></mesh>
    </>}
  </>
}

function Framing({viewKey}:{viewKey:number}) {
  const {camera,size,controls}=useThree()
  const orbit=controls as {target:Vector3;update:()=>void}|null
  useEffect(()=>{
    const factor=Math.max(1,Math.min(1.65,1/(size.width/size.height)))
    camera.position.set(3.65*factor,6.55*factor,7.5*factor)
    orbit?.target.set(0,.95,-.2)
    orbit?.update()
  },[camera,orbit,size.width,size.height,viewKey])
  return null
}

class Boundary extends Component<{children:ReactNode;error:string},{failed:boolean}> {
  state={failed:false}
  static getDerivedStateFromError(){return{failed:true}}
  render(){return this.state.failed?<div className="scene-error" role="alert">{this.props.error}</div>:this.props.children}
}

export default function TimeScene(props:SceneProps) {
  return <Boundary error={props.error}>
    <Canvas dpr={[1,1.4]} camera={{position:[3.65,6.55,7.5],fov:43,near:.1,far:45}} gl={{antialias:true}}>
      <Chamber onArtifact={props.onArtifact} solved={props.solved}/>
      <Suspense fallback={null}><Mechanism {...props}/></Suspense>
      <Framing viewKey={props.viewKey}/>
      <OrbitControls makeDefault enabled={props.active} target={[0,.95,-.2]} enablePan={false}
        minDistance={4.9} maxDistance={17} minPolarAngle={.22} maxPolarAngle={Math.PI/2-.12}/>
    </Canvas>
  </Boundary>
}
