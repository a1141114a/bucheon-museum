import {useEffect,useMemo,useRef} from 'react'
import {useFrame,useThree} from '@react-three/fiber'
import {BackSide,BufferAttribute,BufferGeometry,CanvasTexture,Color,Points,ShaderMaterial} from 'three'

const vertex=`varying vec3 direction; void main(){ direction=normalize(position); gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }`
const fragment=`
uniform float time;
uniform vec3 deepColor;
uniform vec3 earthColor;
uniform vec3 glowColor;
varying vec3 direction;
void main(){
  vec3 d=normalize(direction);
  float a=atan(d.z,d.x);
  float horizon=exp(-abs(d.y+0.08)*3.4);
  float mist=0.5+0.25*sin(a*3.0+d.y*7.0+time*0.10)+0.25*cos(a*5.0-d.y*5.0-time*0.07);
  float veil=pow(0.5+0.5*sin(a*4.0+d.y*6.0+time*0.065),7.0)*horizon;
  vec3 color=mix(deepColor,earthColor,horizon*(0.30+mist*0.48));
  color+=glowColor*veil*0.085;
  gl_FragColor=vec4(color,1.0);
  #include <colorspace_fragment>
}`

/** An actual surrounding 3D sky volume, not an image substituted for the room. */
export default function TimeAtmosphere(){
  const {scene}=useThree()
  const sphere=useRef<ShaderMaterial>(null),motes=useRef<Points>(null)
  const reduced=useMemo(()=>window.matchMedia('(prefers-reduced-motion: reduce)'),[])
  const uniforms=useMemo(()=>({time:{value:0},deepColor:{value:new Color('#334e46')},earthColor:{value:new Color('#795b36')},glowColor:{value:new Color('#dba65b')}}),[])
  const fogColors=useMemo(()=>[new Color('#4f5946'),new Color('#62533b')],[])
  const moteSprite=useMemo(()=>{
    const image=document.createElement('canvas');image.width=image.height=32
    const context=image.getContext('2d')!,glow=context.createRadialGradient(16,16,0,16,16,16)
    glow.addColorStop(0,'#fff');glow.addColorStop(.22,'#ffffffdd');glow.addColorStop(1,'#ffffff00')
    context.fillStyle=glow;context.fillRect(0,0,32,32)
    return new CanvasTexture(image)
  },[])
  useEffect(()=>()=>moteSprite.dispose(),[moteSprite])
  const geometry=useMemo(()=>{
    const array=new Float32Array(160*3)
    for(let i=0;i<160;i++){
      const a=i*2.39996,r=9+(i*37%101)/101*10
      array.set([Math.sin(a)*r,.5+(i*29%97)/97*9,Math.cos(a)*r],i*3)
    }
    const g=new BufferGeometry();g.setAttribute('position',new BufferAttribute(array,3));return g
  },[])
  useEffect(()=>()=>geometry.dispose(),[geometry])
  useFrame((_,delta)=>{
    if(reduced.matches)return
    const dt=Math.min(delta,.05)
    if(sphere.current)sphere.current.uniforms.time.value+=dt
    if(motes.current)motes.current.rotation.y-=dt*.009
    if(scene.fog)scene.fog.color.copy(fogColors[0]).lerp(fogColors[1],.5+.5*Math.sin(uniforms.time.value*.12))
  })
  return <>
    <mesh renderOrder={20} raycast={()=>null}>
      <sphereGeometry args={[40,48,24]}/>
      <shaderMaterial ref={sphere} vertexShader={vertex} fragmentShader={fragment} uniforms={uniforms} side={BackSide} depthWrite={false} toneMapped={false}/>
    </mesh>
    <points ref={motes} geometry={geometry} raycast={()=>null}>
      <pointsMaterial map={moteSprite} color="#e5bd76" size={.065} transparent opacity={.52} depthWrite={false} sizeAttenuation/>
    </points>
  </>
}
