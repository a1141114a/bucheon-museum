import { Component, Suspense, useEffect, useMemo, useRef, type ReactNode } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import { Box3, CanvasTexture, InstancedMesh, MathUtils, Matrix4, Object3D, Quaternion, SRGBColorSpace, Vector3 } from 'three'
import { artifacts } from '../data/artifacts'
import { exhibitLabels } from '../data/exhibitLabels'
import type { Language } from '../types'
import { clueIds, displays, gallerySpawn, nearbyExhibit, nearbyStation, stations, type ClueId, type Station } from '../state/exploration'
import WalkControls from './WalkControls'
import GalleryArchitecture from './GalleryArchitecture'
import ArtPortal from './ArtPortal'

type Position = [number,number,number]

function Box({position,scale,color}:{position:Position;scale:Position;color:string}) {
  return <mesh position={position} scale={scale} castShadow receiveShadow><boxGeometry/><meshStandardMaterial color={color} roughness={.82}/></mesh>
}

function Glass({position,scale}:{position:Position;scale:Position}) {
  return <mesh position={position} scale={scale}><boxGeometry/>
    <meshStandardMaterial color="#b4d4c1" transparent opacity={.1} roughness={.24} depthWrite={false}/>
  </mesh>
}

function ExhibitModel({url,span,tilt=0}:{url:string;span:number;tilt?:number}) {
  const {scene}=useGLTF(import.meta.env.BASE_URL+url)
  const model=useMemo(()=>{
    const object=scene.clone(true)
    object.rotation.x+=tilt
    object.updateMatrixWorld(true)
    const bounds=new Box3().setFromObject(object)
    const size=bounds.getSize(new Vector3())
    const center=bounds.getCenter(new Vector3())
    const scale=Math.min(span/Math.max(size.x,.001),1.28/Math.max(size.y,.001),.96/Math.max(size.z,.001))
    return {object,scale,offset:[-center.x*scale,-bounds.min.y*scale,-center.z*scale] as Position}
  },[scene,span,tilt])
  return <group position={model.offset} scale={model.scale}><primitive object={model.object}/></group>
}

function ExhibitPlaque({name,language}:{name:string;language:Language}) {
  const texture=useMemo(()=>{
    const canvas=document.createElement('canvas')
    canvas.width=640
    canvas.height=144
    const context=canvas.getContext('2d')
    if (!context) return null
    const brass=context.createLinearGradient(0,0,640,144)
    brass.addColorStop(0,'#4f2f20')
    brass.addColorStop(.35,'#825327')
    brass.addColorStop(.58,'#9a6933')
    brass.addColorStop(1,'#533220')
    context.fillStyle=brass
    context.fillRect(0,0,640,144)
    const rim=[[27,8],[613,8],[632,27],[632,117],[613,136],[27,136],[8,117],[8,27]]
    context.strokeStyle='#efbc63'
    context.lineWidth=6
    context.beginPath()
    rim.forEach(([x,y],i)=>i===0?context.moveTo(x,y):context.lineTo(x,y))
    context.closePath()
    context.stroke()
    context.lineWidth=1.5
    context.strokeStyle='#e6a953'
    context.strokeRect(26,20,588,104)
    context.fillStyle='#efba6e'
    for (const [x,y] of [[27,22],[613,22],[27,122],[613,122]]) {
      context.beginPath()
      context.moveTo(x,y-7);context.lineTo(x+6,y);context.lineTo(x,y+7);context.lineTo(x-6,y)
      context.fill()
    }
    context.fillStyle='#fff0cc'
    context.textAlign='center'
    context.textBaseline='middle'
    const family=language==='ko'?'Malgun Gothic, sans-serif':language==='zh'?'Microsoft YaHei, sans-serif':'Arial, sans-serif'
    const words=language==='en'?name.split(/\s+/):Array.from(name)
    const separator=language==='en'?' ':''
    let lines:string[]=[]
    let fontSize=42
    while (fontSize>=23) {
      context.font=`700 ${fontSize}px ${family}`
      lines=[]
      let row=''
      for (const word of words) {
        const proposed=row?row+separator+word:word
        if (row && context.measureText(proposed).width>548) {lines.push(row);row=word}
        else row=proposed
      }
      if(row)lines.push(row)
      if(lines.length<=2 && lines.every(text=>context.measureText(text).width<=548)) break
      fontSize-=2
    }
    const lineHeight=Math.min(fontSize+8,108/Math.max(1,lines.length))
    lines.forEach((text,i)=>context.fillText(text,320,72+(i-(lines.length-1)/2)*lineHeight,548))
    const result=new CanvasTexture(canvas)
    result.colorSpace=SRGBColorSpace
    return result
  },[name,language])
  useEffect(()=>()=>texture?.dispose(),[texture])
  return <mesh position={[0,.76,.801]}>
    <planeGeometry args={[1.75,.394]}/>
    <meshBasicMaterial map={texture} color={texture?'#ffffff':'#ead4a7'} toneMapped={false}/>
  </mesh>
}

function DisplayCase({id,x,z,language,onExhibit}:{id:string;x:number;z:number;language:Language;onExhibit:(id:string)=>void}) {
  const artifact=artifacts.find(item=>item.id===id)
  const model=artifact?.model.url
  const small=id==='bcm-937'||id==='bcm-926'||id==='bcm-929'
  return <group position={[x,0,z]} onClick={event=>{event.stopPropagation();if(event.delta<=6)onExhibit(id)}}>
    <Box position={[0,.08,0]} scale={[2.4,.16,1.7]} color="#231b15"/>
    <Box position={[0,.59,0]} scale={[2.2,1.02,1.52]} color="#4c3828"/>
    <Box position={[0,1.11,0]} scale={[2.32,.12,1.62]} color="#a38657"/>
    <Box position={[0,1.18,0]} scale={[1.82,.06,1.28]} color="#413e36"/>
    <Box position={[0,.76,.781]} scale={[1.78,.42,.032]} color="#ad7940"/>
    {[-1,1].map(side=><group key={side}>
      <Box position={[side*.98,.57,.765]} scale={[.025,.77,.027]} color="#b18652"/>
      <Box position={[side*.88,.22,.768]} scale={[.21,.024,.027]} color="#b18652"/>
      <Box position={[side*.81,.27,.769]} scale={[.025,.10,.027]} color="#b18652"/>
      <mesh position={[side*.955,.76,.785]} rotation={[0,0,Math.PI/4]}>
        <boxGeometry args={[.072,.072,.024]}/><meshStandardMaterial color="#c19354" metalness={.42} roughness={.38}/>
      </mesh>
    </group>)}
    <Box position={[0,.17,.821]} scale={[2.16,.024,.02]} color="#a97f46"/>
    {artifact && <ExhibitPlaque name={exhibitLabels[id]?.[language]??artifact.name[language]} language={language}/>}
    <Box position={[0,2.65,0]} scale={[2.27,.09,1.59]} color="#76583a"/>
    {[-1,1].map(side=><group key={side}>
      <Glass position={[side*1.09,1.92,0]} scale={[.025,1.43,1.54]}/>
      <Box position={[side*1.09,1.92,-.76]} scale={[.065,1.47,.065]} color="#74593c"/>
      <Box position={[side*1.09,1.92,.76]} scale={[.065,1.47,.065]} color="#74593c"/>
    </group>)}
    <Glass position={[0,1.92,-.77]} scale={[2.17,1.43,.025]}/>
    <Glass position={[0,1.92,.77]} scale={[2.17,1.43,.025]}/>
    {Math.abs(x)<7 && <pointLight position={[0,2.44,.33]} color="#ffddb1" intensity={5} distance={4}/>}
    {model && <group position={[0,1.21,0]}><Suspense fallback={null}>
      <ExhibitModel url={model} span={small?1.04:1.64} tilt={id==='bcm-1252'?.52:0}/>
    </Suspense></group>}
  </group>
}

const treasureModel = (part: 'cabinet'|'chest'|'coin') =>
  import.meta.env.BASE_URL + `models/gallery-treasure-${part}.glb`

function TreasureCabinet({opened,onOpen}:{opened:boolean;onOpen:()=>void}) {
  const cabinet=useGLTF(treasureModel('cabinet'))
  const chest=useGLTF(treasureModel('chest'))
  const chestModel=useMemo(()=>chest.scene.clone(true),[chest.scene])
  const lid=useMemo(()=>chestModel.getObjectByName('ChestLid'),[chestModel])

  useFrame((_,delta)=>{
    if (lid) lid.rotation.x=MathUtils.damp(lid.rotation.x,opened?-1.32:0,5,delta)
  })

  return <group onClick={event=>{event.stopPropagation();if(event.delta<=6)onOpen()}}>
    <primitive object={cabinet.scene}/>
    <group position={[0,1.32,0]}><primitive object={chestModel}/></group>
    <pointLight position={[0,2.88,.38]} color="#ffd595" intensity={8} distance={5.2}/>
    {opened && <pointLight position={[0,1.67,.05]} color="#ffca6f" intensity={3} distance={2.8}/>}
  </group>
}

function HiddenCoin({id,onCollect}:{id:ClueId;onCollect:()=>void}) {
  const {scene}=useGLTF(treasureModel('coin'))
  const coin=useMemo(()=>scene.clone(true),[scene])
  const [x,z]=stations[id]
  const height={west:.26,east:.36,rear:.25}[id]
  const turn=Math.PI
  return <group name={`hidden-coin-${id}`} position={[x,height,z]} rotation={[-.1,turn,0]} onClick={event=>{event.stopPropagation();if(event.delta<=6)onCollect()}}>
    <primitive object={coin}/>
    <mesh name={`coin-touch-target-${id}`}><sphereGeometry args={[.18,12,8]}/><meshBasicMaterial transparent opacity={0} depthWrite={false}/></mesh>
  </group>
}

const burstCoins=36

function CoinFountain() {
  const mesh=useRef<InstancedMesh>(null)
  const start=useRef<number|null>(null)
  const dummy=useMemo(()=>new Object3D(),[])
  useFrame(({clock})=>{
    if(!mesh.current)return
    if(start.current===null)start.current=clock.elapsedTime
    const elapsed=clock.elapsedTime-start.current-.48
    for(let i=0;i<burstCoins;i++){
      const delay=i*.061
      const angle=i*2.399963
      const time=elapsed<delay?-1:(elapsed-delay)%2.24
      const radius=time*(.54+i%6*.13)
      const y=1.72+time*(3.25+i%5*.32)-1.78*time*time
      const scale=time<0||y<.16?0:Math.min(1,(time+.04)*14)
      dummy.position.set(Math.cos(angle)*radius,y,Math.sin(angle)*radius+.15)
      dummy.rotation.set(time*7+angle,time*5-angle,angle+time*3)
      dummy.scale.setScalar(scale)
      dummy.updateMatrix()
      mesh.current.setMatrixAt(i,dummy.matrix)
    }
    mesh.current.instanceMatrix.needsUpdate=true
  })
  return <instancedMesh ref={mesh} args={[undefined,undefined,burstCoins]} frustumCulled={false} name="CoinFountain">
    <cylinderGeometry args={[.095,.095,.029,14]}/>
    <meshStandardMaterial color="#f5b74d" emissive="#b66a1c" emissiveIntensity={.32} metalness={.48} roughness={.32}/>
  </instancedMesh>
}

function TreasureCamera() {
  const start=useRef<{at:number;position:Vector3;rotation:Quaternion}|null>(null)
  const destination=useMemo(()=>new Vector3(0,2.04,5.18),[])
  const rotation=useMemo(()=>new Quaternion().setFromRotationMatrix(new Matrix4().lookAt(destination,new Vector3(0,2.08,0),new Vector3(0,1,0))),[destination])
  useFrame(({camera,clock})=>{
    if(!start.current)start.current={at:clock.elapsedTime,position:camera.position.clone(),rotation:camera.quaternion.clone()}
    const linear=Math.min(1,(clock.elapsedTime-start.current.at)/.82)
    const amount=linear*linear*(3-2*linear)
    camera.position.lerpVectors(start.current.position,destination,amount)
    camera.quaternion.slerpQuaternions(start.current.rotation,rotation,amount)
  })
  return null
}

interface GalleryProps {
  active:boolean
  language:Language
  clues:ClueId[]
  opened:boolean
  celebrating:boolean
  onNear:(station:Station|null)=>void
  onInspect:(station:Station)=>void
  onNearExhibit:(id:string|null)=>void
  onExhibit:(id:string)=>void
  entering?:boolean
  onNearPainting?:(near:boolean)=>void
  onEnterPainting?:()=>void
  onEnteredPainting?:()=>void
}

function Hall({active,language,clues,opened,celebrating,onNear,onInspect,onNearExhibit,onExhibit,entering=false,onNearPainting,onEnterPainting,onEnteredPainting}:GalleryProps) {
  const {camera}=useThree()
  const collectCoin=(id:ClueId)=>{
    if(active&&!opened&&nearbyStation(camera.position.x,camera.position.z)===id)onInspect(id)
  }
  const previous=useRef<Station|null>(null)
  const previousExhibit=useRef<string|null>(null)
  const previousPainting=useRef(false)
  useFrame(({camera})=>{
    const {x,z}=camera.position
    const station=active?nearbyStation(x,z):null
    const exhibit=active?nearbyExhibit(x,z):null
    if (station!==previous.current) { previous.current=station; onNear(station) }
    if (exhibit!==previousExhibit.current) { previousExhibit.current=exhibit; onNearExhibit(exhibit) }
    const near=opened&&Math.hypot(x,z+12)<2.3
    if(near!==previousPainting.current){previousPainting.current=near;onNearPainting?.(near)}
  })
  return <>
    <color attach="background" args={['#352d24']}/><fog attach="fog" args={['#352d24',24,56]}/>
    <ambientLight intensity={.35}/><hemisphereLight args={['#ffefd9','#51483a',1.05]}/>
    <directionalLight position={[6,10,8]} intensity={1.2} color="#ffe8c6"/>
    <Suspense fallback={null}><GalleryArchitecture/></Suspense>
    {displays.map(display=><DisplayCase key={display.id} {...display} language={language} onExhibit={onExhibit}/>)}
    <Suspense fallback={null}>
      <TreasureCabinet opened={opened} onOpen={()=>onInspect('chest')}/>
    </Suspense>
    <Suspense fallback={null}>
      {clueIds.filter(id=>!clues.includes(id)).map(id=>
        <HiddenCoin key={id} id={id} onCollect={()=>collectCoin(id)}/>)}
    </Suspense>
    <WalkControls active={active}/>
    <Suspense fallback={null}><ArtPortal index={0} placed={opened} entering={entering} position={[0,2,-12.35]} height={3.8} onEntered={()=>onEnteredPainting?.()} onClick={()=>{if(opened&&Math.hypot(camera.position.x,camera.position.z+12)<2.3)onEnterPainting?.()}}/></Suspense>
    {celebrating&&!window.matchMedia('(prefers-reduced-motion: reduce)').matches&&<><TreasureCamera/><CoinFountain/></>}
  </>
}

class SceneBoundary extends Component<{children:ReactNode;message:string},{failed:boolean}> {
  state={failed:false}
  static getDerivedStateFromError(){return {failed:true}}
  render(){return this.state.failed?<div className="scene-error" role="alert">{this.props.message}</div>:this.props.children}
}
export default function GalleryScene({error,...props}:GalleryProps & {error:string}) {
  const camera=useMemo(()=>({position:[...gallerySpawn] as Position,fov:58,near:.08,far:64}),[])
  return <SceneBoundary message={error}><Canvas dpr={[1,1.35]} camera={camera} gl={{antialias:true,powerPreference:'high-performance'}} fallback={<div className="scene-error">{error}</div>}><Hall {...props}/></Canvas></SceneBoundary>
}



