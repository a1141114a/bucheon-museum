import {Component,createRef,useMemo,useRef,useEffect,useState,Suspense,type ReactNode,type RefObject} from 'react'
import {Canvas,useFrame,useThree} from '@react-three/fiber'
import {OrbitControls,RoundedBox,useGLTF,useTexture,Html,Line} from '@react-three/drei'
import {Box3,BufferGeometry,Group,Mesh,RepeatWrapping,SRGBColorSpace,Vector3,type Material} from 'three'
import {fragmentIds,trayOrder,rotationOf,type RestorationState} from '../state/restoration'
import {buildGhostGeometry} from './ghostGeometry'
import {sceneryBlocksView,labelFacesCamera} from './sceneVisibility'
import {jarPosition,RestoredJar} from './RestorationReveal'

interface Part {geometry:BufferGeometry;material:Material|Material[]}
interface Fragment {id:string;center:Vector3;parts:Part[];guide:{geometry:BufferGeometry;outline:[number,number,number][]}[]}
function GhostOutline({points,highlighted}:{points:[number,number,number][];highlighted:boolean}){
  return <Line points={points} segments color={highlighted?'#e6a72d':'#654326'} lineWidth={highlighted?2.5:1.8} transparent opacity={1} depthTest depthWrite={false} renderOrder={10} raycast={()=>null}/>
}
function FragmentMesh({fragment,position,scale=1,rotation=0,ghost=false,selected=false,onClick,occluderRef}:{fragment:Fragment;position:Vector3;scale?:number;rotation?:number;ghost?:boolean;selected?:boolean;onClick:()=>void;occluderRef?:RefObject<Group|null>}){
  const ref=useRef<Group>(null)
  const initialPosition=useRef(position.clone())
  const initialScale=useRef(scale)
  const [hovered,setHovered]=useState(false)
  const highlighted=selected||hovered
  useFrame((_,dt)=>{if(ref.current){ref.current.position.lerp(position,1-Math.exp(-dt*10));ref.current.scale.lerp(new Vector3(scale,scale,scale),1-Math.exp(-dt*10));ref.current.rotation.y+=((rotation-ref.current.rotation.y))*Math.min(dt*10,1)}})
  return <group ref={node=>{ref.current=node;if(occluderRef)occluderRef.current=node}} position={initialPosition.current} scale={initialScale.current} onPointerOver={e=>{if(ghost){e.stopPropagation();setHovered(true)}}} onPointerOut={()=>setHovered(false)} onClick={e=>{if(e.delta>5)return;e.stopPropagation();onClick()}}>
    {ghost?fragment.guide.map((part,i)=><group key={i}><mesh geometry={part.geometry}>
      <meshBasicMaterial color={highlighted?'#f0cb79':'#e2d9c6'} transparent opacity={highlighted?.44:.31} depthWrite polygonOffset polygonOffsetFactor={1} polygonOffsetUnits={1}/>
    </mesh><GhostOutline points={part.outline} highlighted={highlighted}/></group>):fragment.parts.map((part,i)=><mesh key={i} geometry={part.geometry} material={part.material} castShadow receiveShadow/>)}
  </group>
}
function PendingSlotLabel({fragment,position,slot,lit,occluders}:{fragment:Fragment;position:Vector3;slot:number;lit:boolean;occluders:RefObject<Group|null>[]}){
  const label=useRef<HTMLSpanElement>(null)
  useFrame(({camera})=>{if(label.current)label.current.style.visibility=labelFacesCamera(camera.position,fragment.center)?'visible':'hidden'})
  // Drei's public type predates nullable React refs; all groups mount before frames.
  return <Html key={`${fragment.id}-pending-label`} position={position} center distanceFactor={6} zIndexRange={[2,0]} occlude={occluders as RefObject<Group>[]} style={{pointerEvents:'none'}}><span ref={label} data-slot-id={fragment.id} className={`slot-marker ${lit?'lit':''}`}>{slot}</span></Html>
}
function Model({restoration,selected,onSelect,onTarget,onInspect,hinted,completionStart,revealing}:SceneProps){
  const {scene}=useGLTF(import.meta.env.BASE_URL+'models/bcm-1072-restoration.glb')
  const shardGroup=useRef<Group>(null)
  const complete=restoration.placed.length===fragmentIds.length
  useFrame(()=>{
    if(shardGroup.current)shardGroup.current.visible=!complete||(revealing&&completionStart!==null&&performance.now()-completionStart<180)
  })
  const solidRefs=useMemo(()=>Object.fromEntries(fragmentIds.map(id=>[id,createRef<Group>()])),[])
  const occluders=restoration.placed.map(id=>solidRefs[id])
  const fragments=useMemo(()=>{
    scene.updateMatrixWorld(true)
    return fragmentIds.map(id=>{
      const node=scene.getObjectByName(id)
      if(!node)throw new Error(`Missing GLB fragment: ${id}`)
      const center=new Box3().setFromObject(node).getCenter(new Vector3())
      const parts:Part[]=[]
      node.traverse(o=>{if(o instanceof Mesh){const geometry=o.geometry.clone().applyMatrix4(o.matrixWorld);geometry.translate(-center.x,-center.y,-center.z);parts.push({geometry,material:o.material})}})
      const guide=parts.filter(part=>(Array.isArray(part.material)?part.material:[part.material]).some(m=>m.name==='Storage jar exterior')).map(part=>buildGhostGeometry(part.geometry,center))
      return {id,center,parts,guide}
    })
  },[scene])
  return <><group ref={shardGroup} visible={!complete||revealing}>{(!complete||revealing)&&fragments.map(fragment=>{
    const placed=restoration.placed.includes(fragment.id)
    const i=trayOrder.indexOf(fragment.id)
    const target=fragment.center.clone().add(new Vector3(...jarPosition))
    const tray=new Vector3(-2.5+(i%3)*.74,.99,-.8+Math.floor(i/3)*.8)
    const inspecting=selected===fragment.id&&!placed
    const inspectionPosition=new Vector3(-1.05,2.15,.8)
    const slot=fragmentIds.indexOf(fragment.id)+1
    return <group key={fragment.id}>
      <FragmentMesh fragment={fragment} position={placed?target:inspecting?inspectionPosition:tray} scale={placed||inspecting?1:.52} rotation={placed?0:rotationOf(restoration,fragment.id)*Math.PI/2} selected={inspecting} onClick={()=>placed?onInspect():onSelect(fragment.id)} occluderRef={solidRefs[fragment.id]}/>
      {!placed&&<><FragmentMesh fragment={fragment} position={target} ghost selected={hinted&&selected===fragment.id} onClick={()=>onTarget(fragment.id)}/><PendingSlotLabel fragment={fragment} position={target.clone().add(new Vector3(.04,0,.07))} slot={slot} lit={hinted&&selected===fragment.id} occluders={occluders}/></>}
      {!placed&&<Html position={inspecting?[-1.05,1.48,1.02]:[tray.x,.73,tray.z+.30]} center distanceFactor={6} zIndexRange={[2,0]} style={{pointerEvents:'none'}}><span className={`tray-marker ${inspecting?'lit':''}`}>{String.fromCharCode(65+i)}</span></Html>}
    </group>
  })}</group>{complete&&<Suspense fallback={null}><RestoredJar start={completionStart} revealing={revealing} onInspect={onInspect}/></Suspense>}</>
}
function Block({position,args,color,radius=.06}:{position:[number,number,number];args:[number,number,number];color:string;radius?:number}){
  return <RoundedBox position={position} args={args} radius={radius} smoothness={3} castShadow receiveShadow><meshStandardMaterial color={color} roughness={.83}/></RoundedBox>
}
function CutawayScenery({children,min,max}:{children:ReactNode;min:[number,number,number];max:[number,number,number]}){
  const ref=useRef<Group>(null)
  const bounds=useMemo(()=>new Box3(new Vector3(...min),new Vector3(...max)),[...min,...max])
  useFrame(({camera})=>{if(ref.current)ref.current.visible=!sceneryBlocksView(camera.position,bounds)})
  return <group ref={ref}>{children}</group>
}
const screenHeight=4
const screenRepeats=6
const wallWidth=screenHeight*2*screenRepeats
function ScreenWall(){
  const texture=useTexture(import.meta.env.BASE_URL+'ui/restoration-screen.png')
  texture.colorSpace=SRGBColorSpace
  texture.anisotropy=4
  if(texture.wrapS!==RepeatWrapping){
    texture.wrapS=RepeatWrapping
    texture.needsUpdate=true
  }
  texture.repeat.x=screenRepeats
  return <mesh position={[0,2.02,-3.74]} receiveShadow>
    <planeGeometry args={[wallWidth,screenHeight]}/>
    <meshStandardMaterial map={texture} color="#bea68c" roughness={.96}/>
  </mesh>
}
function Room(){
  return <>
    <color attach="background" args={['#38372b']}/><fog attach="fog" args={['#38372b',14,30]}/>
    <ambientLight intensity={.65}/><hemisphereLight args={['#fff3ce','#60503a',1.4]}/>
    <spotLight position={[0,7,3]} intensity={140} angle={.65} penumbra={.8} color="#ffdfaa" castShadow shadow-mapSize={[1024,1024]} shadow-bias={-.0005}/>
    <pointLight position={[-4,3,-2]} intensity={25} color="#efbe7d"/>
    <pointLight position={[2.8,2.8,3.1]} intensity={18} color="#fff1d8" distance={6}/>
    <mesh rotation={[-Math.PI/2,0,0]} receiveShadow><planeGeometry args={[30,30]}/><meshStandardMaterial color="#77694f" roughness={.9}/></mesh>
    <CutawayScenery min={[-wallWidth/2-.1,-.2,-4.35]} max={[wallWidth/2+.1,4.3,-3.45]}>
      <Block position={[0,2.02,-3.91]} args={[wallWidth+.04,screenHeight+.04,.32]} color="#3c2b21" radius={.035}/>
      <Suspense fallback={null}><ScreenWall/></Suspense>
    </CutawayScenery>
    {[-5,5].map(x=><CutawayScenery key={x} min={[x-.65,-.2,-.7]} max={[x+.65,4.5,.7]}><Block position={[x,2,0]} args={[.5,4.1,.65]} color="#9e8962"/><Block position={[x,4.1,0]} args={[.8,.2,.9]} color="#b8a27c"/></CutawayScenery>)}
    <Block position={[-1.75,.65,0]} args={[2.6,.18,2.8]} color="#6c492d" radius={.09}/>
    <Block position={[-1.75,.77,0]} args={[2.48,.07,2.65]} color="#a89770" radius={.04}/>
    {[-2.7,-.8].map(x=><Block key={x} position={[x,.31,0]} args={[.17,.6,2.25]} color="#473322"/>)}
    <mesh position={[.75,.43,0]} castShadow receiveShadow><cylinderGeometry args={[1.04,1.12,.86,96]}/><meshStandardMaterial color="#a99a7a" roughness={.7}/></mesh>
    <mesh position={[.75,.88,0]} receiveShadow><cylinderGeometry args={[1.08,1.08,.06,96]}/><meshStandardMaterial color="#d3c49b" roughness={.6}/></mesh>
    <mesh position={[.75,.92,0]} rotation={[-Math.PI/2,0,0]}><ringGeometry args={[.82,.84,96]}/><meshStandardMaterial color="#9c7742"/></mesh>
  </>
}
class Boundary extends Component<{children:ReactNode;error:string},{failed:boolean}>{state={failed:false};static getDerivedStateFromError(){return {failed:true}};render(){return this.state.failed?<div className="scene-error" role="alert">{this.props.error}</div>:this.props.children}}
function CameraFraming({viewKey,completionStart,revealing}:{viewKey:number;completionStart:number|null;revealing:boolean}){
  const {camera,size,controls}=useThree()
  const orbit=controls as {target:Vector3;update:()=>void}|null
  const shot=useRef<{key:number;position:Vector3;target:Vector3}|null>(null)
  const factor=Math.min(1.9,Math.max(1,.95/(size.width/size.height)))
  const destination=useMemo(()=>new Vector3(.75+2.65*factor,2+1.20*factor,4.2*factor),[factor])
  const focus=useMemo(()=>new Vector3(.75,2,0),[])
  useEffect(()=>{
    camera.position.set(-.5+4.3*factor,1.1+2.3*factor,6.5*factor)
    orbit?.target.set(-.5,1.1,0)
    orbit?.update()
  },[camera,orbit,factor,viewKey])
  useFrame(()=>{
    if(!revealing||completionStart===null||!orbit)return
    if(shot.current?.key!==completionStart)shot.current={key:completionStart,position:camera.position.clone(),target:orbit.target.clone()}
    const p=Math.min(1,(performance.now()-completionStart)/520)
    const ease=p*p*(3-2*p)
    camera.position.lerpVectors(shot.current.position,destination,ease)
    orbit.target.lerpVectors(shot.current.target,focus,ease)
    orbit.update()
  })
  return null
}
interface SceneProps {
  restoration:RestorationState
  selected:string
  onSelect:(id:string)=>void
  onTarget:(id:string)=>void
  onInspect:()=>void
  active:boolean
  hinted:boolean
  error:string
  viewKey:number
  completionStart:number|null
  revealing:boolean
}
export default function RestorationScene(props:SceneProps){
  return <Boundary error={props.error}><Canvas shadows dpr={[1,1.5]} camera={{position:[3.8,3.4,6.5],fov:44,near:.1,far:40}} gl={{antialias:true}} fallback={<div className="scene-error">{props.error}</div>}><Room/><Suspense fallback={null}><Model {...props}/></Suspense><CameraFraming {...props}/><OrbitControls enabled={props.active} makeDefault target={[-.5,1.1,0]} minDistance={3} maxDistance={18} minPolarAngle={.3} maxPolarAngle={Math.PI/2-.05} enablePan={false}/></Canvas></Boundary>
}
