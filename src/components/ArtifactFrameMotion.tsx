import { useEffect, useRef } from 'react'

const media=import.meta.env.BASE_URL+'ui/artifact-ledger/'

/** Full original 960x720 movie over a wider static plate, never cropped or masked. */
export default function ArtifactFrameMotion() {
  const video=useRef<HTMLVideoElement>(null)
  useEffect(()=>{
    const element=video.current
    if(!element)return
    element.muted=true
    element.defaultMuted=true
    element.playsInline=true
    let disposed=false
    const play=()=>{if(!disposed&&document.visibilityState==='visible')void element.play().catch(()=>{})}
    const visibility=()=>{if(document.visibilityState==='hidden')element.pause();else play()}
    play()
    document.addEventListener('visibilitychange',visibility)
    window.addEventListener('pointerdown',play,{once:true})
    return ()=>{disposed=true;element.pause();document.removeEventListener('visibilitychange',visibility);window.removeEventListener('pointerdown',play)}
  },[])
  return <div className="ledger-artwork" aria-hidden="true" inert>
    <img className="ledger-frame-complete" src={media+'frame-complete.webp'} alt="" width={1112} height={720}/>
    <video ref={video} className="ledger-frame-video" width={960} height={720}
      src={media+'frame-motion.mp4'} poster={media+'video-poster.webp'}
      autoPlay loop muted playsInline preload="auto" disablePictureInPicture tabIndex={-1}/>
  </div>
}
