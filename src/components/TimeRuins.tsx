import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Environment, Lightformer, useGLTF, useTexture } from '@react-three/drei'
import { Box3, BufferAttribute, BufferGeometry, CatmullRomCurve3, DoubleSide, Group, Mesh, Points, RepeatWrapping, SRGBColorSpace, TubeGeometry, Vector3 } from 'three'
import { sceneryBlocksView } from './sceneVisibility'
import TimeAtmosphere from './TimeAtmosphere'

const base=import.meta.env.BASE_URL
const northBounds=new Box3(new Vector3(-8,0,-8),new Vector3(8,7,-3.15))
const reducedMotion=()=>window.matchMedia('(prefers-reduced-motion: reduce)').matches

function Prop({name,...props}:{name:string;position?:[number,number,number];scale?:number;rotation?:[number,number,number]}) {
  const {scene}=useGLTF(base+'models/time-ruins-'+name+'.glb')
  const object=useMemo(()=>{
    const clone=scene.clone(true)
    clone.traverse(node=>{if(node instanceof Mesh){node.castShadow=true;node.receiveShadow=true}})
    return clone
  },[scene])
  return <group {...props}><primitive object={object}/></group>
}

function Wheel({position,scale=1,speed=.03}:{position:[number,number,number];scale?:number;speed?:number}) {
  const pivot=useRef<Group>(null)
  useFrame((_,delta)=>{if(pivot.current&&!reducedMotion())pivot.current.rotation.z+=Math.min(delta,.05)*speed})
  return <group position={position} scale={scale}><group ref={pivot}><Prop name="gear"/></group></group>
}

function AncientBackdrop() {
  const group=useRef<Group>(null)
  useFrame(({camera})=>{if(group.current)group.current.visible=!sceneryBlocksView(camera.position,northBounds)})
  return <group ref={group}>
    <Prop name="architecture"/>
    <Wheel position={[0,4.25,-6.05]} scale={1.71} speed={.04}/>
    <Wheel position={[-2.65,2.30,-5.55]} scale={1.46} speed={-.056}/>
    <Wheel position={[2.65,2.30,-5.55]} scale={1.46} speed={.056}/>
    <Prop name="elephant" position={[-3.18,0,-4.85]} scale={1.2}/>
    <Prop name="elephant" position={[3.18,0,-4.85]} scale={1.2}/>
    {[-1,1].map(side=><group key={side}>
      <Wheel position={[side*5.65,3.12,-3.4]} scale={.67} speed={side*.04}/>
      <Wheel position={[side*5.0,4.30,-3.65]} scale={.34} speed={-side*.06}/>
      <Prop name="chain" position={[side*5.65-.27,3.73,-3.39]}/>
      <Prop name="chain" position={[side*5.65+.27,3.73,-3.39]}/>
      <Prop name="chain" position={[side*5,4.65,-3.65]}/>
    </group>)}
  </group>
}

function WallWing({side}:{side:'left'|'right'}){
  const {scene}=useGLTF(base+'models/time-ruins-wall-'+side+'.glb')
  const group=useRef<Group>(null)
  const {object,bounds}=useMemo(()=>{
    const object=scene.clone(true)
    object.traverse(node=>{if(node instanceof Mesh){node.castShadow=true;node.receiveShadow=true}})
    return {object,bounds:new Box3().setFromObject(object)}
  },[scene])
  useFrame(({camera})=>{if(group.current)group.current.visible=!sceneryBlocksView(camera.position,bounds)})
  return <group ref={group}><primitive object={object}/></group>
}

function Paving() {
  const maps=useTexture([base+'textures/time-ruins/floor.jpg',base+'textures/time-ruins/floor-height.jpg'])
  const textures=useMemo(()=>maps.map((map,i)=>{
    const clone=map.clone();clone.wrapS=clone.wrapT=RepeatWrapping;clone.repeat.set(13,13)
    if(i===0)clone.colorSpace=SRGBColorSpace
    clone.anisotropy=4;return clone
  }),[maps])
  useEffect(()=>()=>textures.forEach(t=>t.dispose()),[textures])
  return <>
    <mesh rotation={[-Math.PI/2,0,0]} position={[0,-.025,0]} receiveShadow>
      <circleGeometry args={[26,128]}/><meshStandardMaterial map={textures[0]} bumpMap={textures[1]} bumpScale={.055} color="#a49a7d" roughness={.92}/>
    </mesh>
    {[2.52,4.64].map(radius=><mesh key={radius} rotation={[-Math.PI/2,0,0]} position={[0,-.014,0]}>
      <ringGeometry args={[radius,radius+.055,128]}/><meshStandardMaterial color="#685239" metalness={.35} roughness={.65}/>
    </mesh>)}
  </>
}

function Energy({solved}:{solved:boolean}) {
  const swirl=useRef<Group>(null)
  const particles=useRef<Points>(null)
  const geometry=useMemo(()=>{
    const array=new Float32Array(90*3)
    for(let i=0;i<90;i++){
      const a=i*2.39996,r=.5+((i*37)%83)/83*5.8
      array.set([Math.sin(a)*r,.45+((i*23)%71)/71*5,Math.cos(a)*r],i*3)
    }
    const g=new BufferGeometry();g.setAttribute('position',new BufferAttribute(array,3));return g
  },[])
  useEffect(()=>()=>geometry.dispose(),[geometry])
  const spiral=useMemo(()=>{
    const vertices=[]
    for(let i=0;i<=110;i++){
      const t=i/110,a=t*Math.PI*4,r=.08+Math.sin(t*Math.PI)*.32
      vertices.push(new Vector3(Math.sin(a)*r,1.42+t*2.75,Math.cos(a)*r))
    }
    return vertices
  },[])
  const ribbon=useMemo(()=>new TubeGeometry(new CatmullRomCurve3(spiral),110,.014,5,false),[spiral])
  useEffect(()=>()=>ribbon.dispose(),[ribbon])
  useFrame(({clock},delta)=>{
    if(reducedMotion())return
    if(swirl.current)swirl.current.rotation.y+=Math.min(delta,.05)*(solved?1.5:.42)
    if(particles.current)particles.current.position.y=Math.sin(clock.elapsedTime*.24)*.12
  })
  return <>
    <mesh position={[0,4.3,-.4]} rotation={[.10,0,0]}>
      <coneGeometry args={[1.38,6.2,48,1,true]}/>
      <meshBasicMaterial color="#ffc36b" transparent opacity={.055} depthWrite={false} side={DoubleSide}/>
    </mesh>
    <group ref={swirl}>
      <mesh geometry={ribbon}><meshBasicMaterial color="#ffe6b4" transparent opacity={solved?1:.85} depthWrite={false} toneMapped={false}/></mesh>
      <mesh geometry={ribbon} rotation={[0,Math.PI,0]} scale={[1.25,1,1.25]}><meshBasicMaterial color="#ffc454" transparent opacity={solved?.85:.45} depthWrite={false} toneMapped={false}/></mesh>
    </group>
    <points geometry={geometry} ref={particles}>
      <pointsMaterial color="#ffd28a" size={.026} transparent opacity={.67} depthWrite={false} sizeAttenuation/>
    </points>
    {solved&&<mesh position={[0,1.43,0]}><sphereGeometry args={[.22,24,16]}/><meshBasicMaterial color="#ffe4a7" toneMapped={false}/></mesh>}
    <pointLight position={[0,2.3,.3]} color="#ffbd57" intensity={solved?22:7} distance={8} decay={2}/>
  </>
}

export default function TimeRuins({solved}:{solved:boolean}) {
  return <>
    <color attach="background" args={['#435347']}/><fog attach="fog" args={['#555441',19,43]}/>
    <TimeAtmosphere/>
    <hemisphereLight args={['#d4c5a8','#263b38',.72]}/><ambientLight intensity={.18}/>
    <directionalLight position={[-2,8,3]} color="#ffe0a7" intensity={2.7} castShadow shadow-mapSize={[1024,1024]}
      shadow-camera-left={-9} shadow-camera-right={9} shadow-camera-top={9} shadow-camera-bottom={-9} shadow-bias={-.0004} shadow-normalBias={.035}/>
    <pointLight position={[0,5.4,-4]} color="#ffb84d" intensity={45} distance={12}/>
    <pointLight position={[-5,3,-1]} color="#76afac" intensity={9} distance={10}/>
    <pointLight position={[5,3,-1]} color="#76afac" intensity={9} distance={10}/>
    <Environment resolution={64} frames={1}>
      <Lightformer position={[0,7,2]} rotation={[Math.PI/2,0,0]} scale={[8,8,1]} intensity={2.2} color="#ffe4b5"/>
      <Lightformer position={[0,3,-7]} scale={[7,4,1]} intensity={1.2} color="#d6923a"/>
    </Environment>
    <Paving/><AncientBackdrop/><WallWing side="left"/><WallWing side="right"/><Prop name="altar"/>
    <Energy solved={solved}/>
  </>
}
