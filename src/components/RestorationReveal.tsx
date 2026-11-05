import {useMemo,useRef} from 'react'
import {useFrame} from '@react-three/fiber'
import {useGLTF} from '@react-three/drei'
import {AdditiveBlending,DoubleSide,Group,InstancedMesh,Mesh,MeshBasicMaterial,Object3D,PointLight,ShaderMaterial} from 'three'
import {storageJarArtifact} from '../data/artifacts'
import {completionDurationMs} from '../state/restoration'

export const jarPosition = [.75,.91,0] as const
const mouthHeight = 1.60
const jarUrl = import.meta.env.BASE_URL+storageJarArtifact.model.url
useGLTF.preload(jarUrl)
const pulseStarts = [.24,.62,1,1.37,1.72]
const particleCount = 90
const vertexShader = `
  varying vec2 beamUv;
  void main() {
    beamUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`
const fragmentShader = `
  uniform float strength;
  varying vec2 beamUv;
  void main() {
    float ray = 0.48 + 0.52 * pow(0.5 + 0.5 * sin(beamUv.x * 125.66), 4.0);
    float fade = smoothstep(0.0, 0.22, beamUv.y) * (1.0 - smoothstep(0.66, 1.0, beamUv.y));
    gl_FragColor = vec4(1.0, 0.64 + 0.26 * beamUv.y, 0.24 + 0.45 * beamUv.y, strength * fade * ray);
  }
`

function LightBurst({start}:{start:number}){
  const particles=useRef<InstancedMesh>(null)
  const rays=useRef<Group>(null)
  const beam=useRef<ShaderMaterial>(null)
  const light=useRef<PointLight>(null)
  const pulseRings=useRef<(Mesh|null)[]>([])
  const ringMaterials=useRef<(MeshBasicMaterial|null)[]>([])
  const transform=useMemo(()=>new Object3D(),[])
  useFrame(()=>{
    const time=(performance.now()-start)/1000
    const fade=Math.max(0,Math.min(1,(2.58-time)/.48))
    let glow=0
    for(const [index,offset] of pulseStarts.entries()){
      const age=time-offset
      const pulse=age<0||age> .82?0:Math.sin(Math.PI*age/.82)**2
      glow+=pulse
      const ring=pulseRings.current[index]
      if(ring){
        ring.visible=pulse>0
        const surface=ringMaterials.current[index]
        if(surface)surface.opacity=pulse*.27*fade
        ring.scale.setScalar(.25+Math.max(0,age)*1.8)
        ring.position.y=mouthHeight+.05+Math.max(0,age)*.55
      }
    }
    if(beam.current)beam.current.uniforms.strength.value=Math.min(.68,glow*.39)*fade
    if(rays.current)rays.current.rotation.y=time*.58
    if(light.current)light.current.intensity=glow*15*fade
    if(!particles.current)return
    for(let i=0;i<particleCount;i++){
      const age=time-pulseStarts[i%pulseStarts.length]-(i%11)*.022
      const angle=i*2.39996
      const outward=.46+(i%7)*.12
      const size=age>0&&age<.78?(.009+(i%5)*.003)*Math.sin(Math.PI*age/.78)*fade:0
      transform.position.set(age*outward*Math.cos(angle),mouthHeight-.14+age*(1.25+(i%9)*.15)-.36*age*age,age*outward*Math.sin(angle))
      transform.scale.set(size,size*2.3,size)
      transform.rotation.set(0,angle,-.22)
      transform.updateMatrix()
      particles.current.setMatrixAt(i,transform.matrix)
    }
    particles.current.instanceMatrix.needsUpdate=true
  })
  return <group position={jarPosition}>
    <pointLight ref={light} color="#ffc46c" position={[0,mouthHeight-.1,0]} intensity={0} distance={4}/>
    <group ref={rays}>
      <mesh position={[0,mouthHeight+.47,0]}>
        <cylinderGeometry args={[.75,.07,1.25,42,1,true]}/>
        <shaderMaterial ref={beam} vertexShader={vertexShader} fragmentShader={fragmentShader} uniforms={{strength:{value:0}}}
          transparent blending={AdditiveBlending} side={DoubleSide} depthWrite={false}/>
      </mesh>
    </group>
    {pulseStarts.map((offset,index)=><mesh key={offset} ref={object=>{pulseRings.current[index]=object}} rotation={[-Math.PI/2,0,0]} visible={false}>
      <ringGeometry args={[.60,.625,64]}/>
      <meshBasicMaterial ref={surface=>{ringMaterials.current[index]=surface}} color="#ffcd77" transparent opacity={0} blending={AdditiveBlending} side={DoubleSide} depthWrite={false}/>
    </mesh>)}
    <instancedMesh ref={particles} args={[undefined,undefined,particleCount]} frustumCulled={false}>
      <octahedronGeometry args={[1]}/>
      <meshBasicMaterial color="#ffe4a6" toneMapped={false} blending={AdditiveBlending} transparent depthWrite={false}/>
    </instancedMesh>
  </group>
}

export function RestoredJar({start,revealing,onInspect}:{start:number|null;revealing:boolean;onInspect:()=>void}){
  const {scene}=useGLTF(jarUrl)
  const model=useMemo(()=>{
    const clone=scene.clone(true)
    clone.traverse(object=>{if(object instanceof Mesh){object.castShadow=true;object.receiveShadow=true}})
    return clone
  },[scene])
  const vessel=useRef<Group>(null)
  useFrame(()=>{
    if(!vessel.current||start===null)return
    const progress=Math.min(1,Math.max(0,(performance.now()-start-180)/(completionDurationMs-180)))
    vessel.current.visible=performance.now()-start>=180
    vessel.current.rotation.y=Math.PI*progress*progress*(3-2*progress)
  })
  return <>
    <group ref={vessel} position={jarPosition} visible={start===null||!revealing}
      onClick={event=>{if(!revealing&&event.delta<=5){event.stopPropagation();onInspect()}}}>
      <primitive object={model} scale={mouthHeight/.424}/>
    </group>
    {revealing&&start!==null&&<LightBurst start={start}/>}
  </>
}
