import {useLayoutEffect,useRef} from 'react'
import {completionSources} from './completionFrame'

export default function CompletionMotion({chapter,width,height}:{chapter:1|2;width:number;height:number}){
  const video=useRef<HTMLVideoElement>(null),canvas=useRef<HTMLCanvasElement>(null)
  const media=import.meta.env.BASE_URL+`ui/completion/${chapter}/`
  useLayoutEffect(()=>{
    const movie=video.current,surface=canvas.current
    if(!movie||!surface)return
    const source=completionSources[chapter],context=surface.getContext('2d',{alpha:false})
    const dpr=Math.min(window.devicePixelRatio||1,1.5),scale=width/source.width
    const extra=Math.max(0,height-source.height*scale),top=source.split*scale
    surface.width=Math.round(width*dpr);surface.height=Math.round(height*dpr)
    surface.style.visibility='hidden';context?.setTransform(dpr,0,0,dpr,0,0)
    const poster=new Image(),extension=new Image(),decoded=document.createElement('canvas')
    decoded.width=source.width;decoded.height=source.height
    const decoder=decoded.getContext('2d',{alpha:false})
    let stopped=false,request=0,lastTime=-1,lastPaint=0
    const bands=(image:CanvasImageSource)=>{
      context?.drawImage(image,0,0,source.width,source.split,0,0,width,top)
      context?.drawImage(image,0,source.split,source.width,source.height-source.split,0,top+extra,width,(source.height-source.split)*scale)
    }
    const draw=()=>{
      if(!context||!poster.naturalWidth||!extension.naturalWidth)return
      context.fillStyle='#e8c584';context.fillRect(0,0,width,height)
      bands(poster)
      if(extra>0)context.drawImage(extension,0,top,width,extra)
      if(movie.readyState>=2&&decoder){try{
        // Safari can ignore source cropping on hardware-decoded video. Copy the
        // complete frame first, then crop the ordinary canvas into intact bands.
        decoder.drawImage(movie,0,0,source.width,source.height);bands(decoded)
      }catch{/* Poster remains during decoder transitions. */}}
      surface.style.visibility='visible'
    }
    poster.onload=extension.onload=draw
    poster.src=media+'poster.webp';extension.src=media+'extension.webp'
    movie.muted=true;movie.defaultMuted=true;movie.playsInline=true
    const play=()=>{if(!stopped&&document.visibilityState==='visible')void movie.play().catch(()=>{})}
    const visibility=()=>document.visibilityState==='hidden'?movie.pause():play()
    const tick=(now:number)=>{
      if(stopped)return
      if(document.visibilityState==='visible'&&now-lastPaint>=33&&movie.currentTime!==lastTime){draw();lastTime=movie.currentTime;lastPaint=now}
      request=requestAnimationFrame(tick)
    }
    play();request=requestAnimationFrame(tick)
    document.addEventListener('visibilitychange',visibility);window.addEventListener('pointerdown',play,{once:true})
    return ()=>{stopped=true;cancelAnimationFrame(request);movie.pause();poster.onload=extension.onload=null;document.removeEventListener('visibilitychange',visibility);window.removeEventListener('pointerdown',play)}
  },[chapter,width,height,media])
  return <div className="completion-artwork" aria-hidden="true" inert>
    <img src={media+'poster.webp'} alt=""/>
    <video ref={video} src={media+'motion.mp4'} poster={media+'poster.webp'} autoPlay loop muted playsInline preload="auto" disablePictureInPicture tabIndex={-1}/>
    <canvas ref={canvas}/>
  </div>
}
