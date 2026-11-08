import { Component, Suspense, useEffect, useMemo, type ReactNode } from 'react'
import { Canvas, useFrame, useThree, type ThreeEvent } from '@react-three/fiber'
import { OrbitControls, useGLTF } from '@react-three/drei'
import { Box3, CanvasTexture, MathUtils, Mesh, MeshStandardMaterial, Object3D, SRGBColorSpace, Vector3 } from 'three'
import { artifacts } from '../data/artifacts'
import { timeArtifactIds } from '../state/time'
import type { Artifact } from '../types'
import TimeRuins from './TimeRuins'
import {timeExhibitPositions,timeExhibitSupportHeight} from './timeExhibitLayout'

const turn=Math.PI*2/3
const radii=[1.47,1.09,.71]

function ExhibitPedestal(){
  const {scene}=useGLTF(import.meta.env.BASE_URL+'models/time-exhibit-pedestal.glb')
  const object=useMemo(()=>{
    const copy=scene.clone(true)
    copy.traverse(node=>{if(node instanceof Mesh){node.castShadow=true;node.receiveShadow=true}})
    return copy
  },[scene])
  return <primitive object={object}/>
}

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
  const object=useMemo(()=>{
    const clone=scene.clone(true)
    clone.traverse(node=>{
      if(!(node instanceof Mesh))return
      node.castShadow=true;node.receiveShadow=true
      const recolor=(original:MeshStandardMaterial)=>{
        const material=original.clone()
        if(material.name==='Teal enamel')material.color.set('#805322')
        if(material.name==='Dark basalt')material.color.set('#3b3c32')
        material.roughness=Math.max(material.roughness,.43)
        return material
      }
      node.material=Array.isArray(node.material)?node.material.map(recolor):recolor(node.material)
    })
    return clone
  },[scene])
  useEffect(()=>()=>object.traverse(node=>{
    if(node instanceof Mesh)(Array.isArray(node.material)?node.material:[node.material]).forEach(m=>m.dispose())
  }),[object])
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
    <Suspense fallback={null}><TimeRuins solved={solved}/></Suspense>
    {timeArtifactIds.map((id,index)=>{
      const artifact=artifacts.find(item=>item.id===id)!
      return <group key={id} name={'TimeExhibit-'+id} position={timeExhibitPositions[index]} onClick={event=>{event.stopPropagation();onArtifact(artifact)}}>
        <Suspense fallback={null}><ExhibitPedestal/>
          <group position={[0,timeExhibitSupportHeight,0]}><Model url={artifact.model.url!}/></group>
        </Suspense>
      </group>
    })}
  </>
}

function Framing({viewKey}:{viewKey:number}) {
  const {camera,size,controls}=useThree()
  const orbit=controls as {target:Vector3;update:()=>void}|null
  useEffect(()=>{
    const compact=size.width>size.height&&size.height<820
    const factor=Math.max(1,Math.min(1.65,1/(size.width/size.height)))*(compact?1.04:1)
    camera.position.set(.2*factor,8.5*factor,16*factor)
    orbit?.target.set(0,compact?1.1:1.5,.2)
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
    <Canvas shadows dpr={[1,1.4]} camera={{position:[.2,8.5,16],fov:46,near:.1,far:90}} gl={{antialias:true}}>
      <Chamber onArtifact={props.onArtifact} solved={props.solved}/>
      <Suspense fallback={null}><Mechanism {...props}/></Suspense>
      <Framing viewKey={props.viewKey}/>
      <OrbitControls makeDefault enabled={props.active} target={[0,1.5,.2]} enablePan={false} enableDamping={false}
        minDistance={5.5} maxDistance={24} minPolarAngle={.22} maxPolarAngle={Math.PI/2-.12}/>
    </Canvas>
  </Boundary>
}
