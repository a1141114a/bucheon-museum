import {useEffect,useRef} from 'react'
import {ledgerSource} from './ledgerFrame'

const media=import.meta.env.BASE_URL+'ui/artifact-ledger/'

/** Add a static middle section. Every original movie row is drawn exactly once;
 * the top and animated bottom keep their natural proportions. */
export default function ArtifactFrameMotion({width,height}:{width:number;height:number}) {
  const video=useRef<HTMLVideoElement>(null),canvas=useRef<HTMLCanvasElement>(null)
  useEffect(()=>{
    const element=video.current,surface=canvas.current
    if(!element||!surface)return
    surface.style.visibility='hidden'
    element.muted=true;element.defaultMuted=true;element.playsInline=true
    const context=surface.getContext('2d',{alpha:false})
    const ratio=Math.min(window.devicePixelRatio||1,1.5)
    surface.width=Math.round(width*ratio);surface.height=Math.round(height*ratio)
    context?.setTransform(ratio,0,0,ratio,0,0)
    const poster=new Image(),extension=new Image()
    let stopped=false,request=0,dirty=true,lastTime=-1,lastPaint=0
    const scale=width/ledgerSource.width,extra=Math.max(0,height-ledgerSource.height*scale)
    const split=ledgerSource.insertionY,top=split*scale
    const bands=(image:CanvasImageSource,sourceWidth:number,left=0)=>{
      if(!context)return
      context.drawImage(image,0,0,sourceWidth,split,left*scale,0,sourceWidth*scale,top)
      context.drawImage(image,0,split,sourceWidth,ledgerSource.height-split,left*scale,top+extra,sourceWidth*scale,(ledgerSource.height-split)*scale)
    }
    const draw=()=>{
      if(!context||!poster.complete||!poster.naturalWidth)return
      context.fillStyle='#ffdaa0';context.fillRect(0,0,width,height)
      bands(poster,ledgerSource.width)
      if(extra>0&&extension.complete&&extension.naturalWidth){
        const tileHeight=extension.naturalHeight*scale
        for(let y=top;y<top+extra-.1;y+=tileHeight-.7){
          const remaining=Math.min(tileHeight,top+extra-y)
          context.drawImage(extension,0,0,extension.naturalWidth,remaining/scale,0,y,width,remaining)
        }
      }
      if(element.readyState>=2){try{bands(element,ledgerSource.videoWidth,ledgerSource.videoLeft)}catch{/* Keep the still frame during decoder transitions. */}}
      surface.style.visibility='visible'
    }
    poster.onload=extension.onload=()=>{dirty=true;draw()}
    poster.src=media+'frame-poster.webp';extension.src=media+'frame-extension.webp'
    const tick=(now=0)=>{
      if(stopped)return
      if(document.visibilityState==='visible'&&(dirty||(now-lastPaint>=33&&element.currentTime!==lastTime))){draw();lastTime=element.currentTime;lastPaint=now;dirty=false}
      request=requestAnimationFrame(tick)
    }
    const play=()=>{if(!stopped&&document.visibilityState==='visible')void element.play().catch(()=>{})}
    const visibility=()=>{if(document.visibilityState==='hidden')element.pause();else{dirty=true;play()}}
    play();tick()
    document.addEventListener('visibilitychange',visibility);window.addEventListener('pointerdown',play,{once:true})
    return ()=>{
      stopped=true;cancelAnimationFrame(request);element.pause();poster.onload=extension.onload=null
      document.removeEventListener('visibilitychange',visibility);window.removeEventListener('pointerdown',play)
    }
  },[width,height])
  return <div className="ledger-artwork" aria-hidden="true" inert>
    <img className="ledger-frame-complete" src={media+'frame-poster.webp'} alt="" width={1112} height={720}/>
    <video ref={video} className="ledger-frame-video" width={960} height={720}
      src={media+'frame-motion.mp4'} poster={media+'video-poster.webp'} autoPlay loop muted playsInline preload="auto" disablePictureInPicture tabIndex={-1}/>
    <canvas ref={canvas} className="ledger-frame-canvas"/>
  </div>
}
