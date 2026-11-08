import {useEffect,useMemo,useState} from 'react'
import {useFrame} from '@react-three/fiber'
import {useGLTF,useTexture} from '@react-three/drei'
import {CanvasTexture,Mesh,RepeatWrapping,SRGBColorSpace,VideoTexture} from 'three'

type Position=[number,number,number]

function Prop({part,position,name}:{part:'table'|'plinth'|'pillar';position:Position;name:string}){
  const {scene}=useGLTF(import.meta.env.BASE_URL+'models/restoration-'+part+'.glb')
  const model=useMemo(()=>{
    const copy=scene.clone(true)
    copy.traverse(object=>{if(object instanceof Mesh){object.castShadow=true;object.receiveShadow=true}})
    return copy
  },[scene])
  return <group name={name} position={position}><primitive object={model}/></group>
}

export function RestorationFurniture(){
  return <><Prop part="table" position={[-1.75,0,0]} name="RestorationReferenceTable"/>
    <Prop part="plinth" position={[.75,0,0]} name="RestorationReferencePlinth"/></>
}

export function RestorationColumn({x}:{x:number}){
  return <Prop part="pillar" position={[x,0,0]} name={'RestorationReferencePillar'+x}/>
}

export function RestorationFloor(){
  const source=useTexture(import.meta.env.BASE_URL+'textures/restoration/floor.webp')
  const texture=useMemo(()=>{const t=source.clone();t.colorSpace=SRGBColorSpace;t.wrapS=t.wrapT=RepeatWrapping;t.repeat.set(4,4);t.anisotropy=4;t.needsUpdate=true;return t},[source])
  useEffect(()=>()=>texture.dispose(),[texture])
  return <mesh name="RestorationLimestoneFloor" rotation={[-Math.PI/2,0,0]} receiveShadow>
    <planeGeometry args={[30,30]}/><meshStandardMaterial map={texture} color="#d0bea0" roughness={.78}/>
  </mesh>
}

export function AnimatedScreenWall({width,height}:{width:number;height:number}){
  const poster=useTexture(import.meta.env.BASE_URL+'ui/restoration-screen-poster.webp')
  const [playing,setPlaying]=useState(false)
  const media=useMemo(()=>{
    const video=document.createElement('video')
    video.muted=true;video.defaultMuted=true;video.loop=true;video.autoplay=true;video.playsInline=true;video.preload='auto'
    video.setAttribute('muted','');video.setAttribute('playsinline','');video.setAttribute('webkit-playsinline','')
    const videoTexture=new VideoTexture(video)
    const canvas=document.createElement('canvas');canvas.width=320;canvas.height=180
    const context=canvas.getContext('2d')!
    context.drawImage(poster.image,0,0,320,180)
    const fallback=new CanvasTexture(canvas)
    const atlas=new Image()
    // Preserve the video's 16:9 ratio, repeating only across the wide back wall.
    const repetitions=width/(height*16/9)
    for(const texture of [videoTexture,fallback]){
      texture.colorSpace=SRGBColorSpace;texture.wrapS=RepeatWrapping
      texture.repeat.set(repetitions,1);texture.offset.set((1-repetitions)/2,0)
      texture.anisotropy=4;texture.needsUpdate=true
    }
    return {video,videoTexture,canvas,context,fallback,atlas,lastFrame:-1,cleanupTimer:null as number|null}
  },[poster,width,height])
  useEffect(()=>{
    if(media.cleanupTimer!==null)window.clearTimeout(media.cleanupTimer)
    const {video,atlas}=media
    let alive=true
    const ready=()=>{if(alive)setPlaying(true)}
    const waiting=()=>{if(alive)setPlaying(false)}
    const resume=()=>{if(!document.hidden&&video.paused)void video.play().catch(waiting)}
    const visibility=()=>{if(document.hidden)video.pause();else resume()}
    const readyEvents=['loadedmetadata','loadeddata','canplay'] as const
    readyEvents.forEach(event=>video.addEventListener(event,resume))
    video.addEventListener('playing',ready);video.addEventListener('pause',waiting);video.addEventListener('waiting',waiting);video.addEventListener('error',waiting)
    document.addEventListener('visibilitychange',visibility)
    window.addEventListener('pageshow',resume);window.addEventListener('pointerdown',resume,{passive:true})
    atlas.src=import.meta.env.BASE_URL+'ui/restoration-screen-sprite.webp'
    video.src=import.meta.env.BASE_URL+'ui/restoration-screen-loop.mp4'
    const timers=[250,1000,2500].map(delay=>window.setTimeout(resume,delay))
    resume()
    return ()=>{
      alive=false;timers.forEach(window.clearTimeout)
      readyEvents.forEach(event=>video.removeEventListener(event,resume))
      video.removeEventListener('playing',ready);video.removeEventListener('pause',waiting);video.removeEventListener('waiting',waiting);video.removeEventListener('error',waiting)
      document.removeEventListener('visibilitychange',visibility)
      window.removeEventListener('pageshow',resume);window.removeEventListener('pointerdown',resume)
      media.cleanupTimer=window.setTimeout(()=>{
        video.pause();video.removeAttribute('src');video.load()
        media.videoTexture.dispose();media.fallback.dispose()
      },0)
    }
  },[media])
  useFrame(({clock})=>{
    if(playing||!media.atlas.complete||!media.atlas.naturalWidth)return
    const frame=Math.floor(clock.elapsedTime*12)%72
    if(frame===media.lastFrame)return
    media.lastFrame=frame
    media.context.drawImage(media.atlas,(frame%8)*320,Math.floor(frame/8)*180,320,180,0,0,320,180)
    media.fallback.needsUpdate=true
  })
  return <mesh name="RestorationAnimatedScreen" position={[0,2.02,-3.74]} receiveShadow>
    <planeGeometry args={[width,height]}/>
    <meshStandardMaterial map={playing?media.videoTexture:media.fallback} color="#cdb591" roughness={.96}/>
  </mesh>
}



