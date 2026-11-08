import {useEffect,useLayoutEffect,useRef,useState,type ReactNode} from 'react'
import {createPortal,flushSync} from 'react-dom'
import CompletionMotion from './CompletionMotion'
import {fitCompletion} from './completionFrame'
import './completion-card.css'

export default function CompletionCard({chapter,label,onClose,children}:{chapter:1|2;label:string;onClose:()=>void;children:ReactNode}){
  const ref=useRef<HTMLDialogElement>(null)
  const measure=()=>fitCompletion(chapter,window.innerWidth,Math.min(window.innerHeight,window.visualViewport?.height||window.innerHeight))
  const [frame,setFrame]=useState(measure)
  useLayoutEffect(()=>{
    const update=()=>flushSync(()=>setFrame(measure()))
    setFrame(measure());window.addEventListener('resize',update);window.visualViewport?.addEventListener('resize',update)
    return ()=>{window.removeEventListener('resize',update);window.visualViewport?.removeEventListener('resize',update)}
  },[chapter])
  useEffect(()=>{
    const previous=document.activeElement,overflow=document.body.style.overflow
    document.body.style.overflow='hidden';ref.current?.showModal()
    return ()=>{ref.current?.close();document.body.style.overflow=overflow;if(previous instanceof HTMLElement&&previous.isConnected)previous.focus()}
  },[])
  return createPortal(<dialog ref={ref} className={`completion-card completion-card-${chapter}${frame.extended?' completion-card-extended':''}`}
    style={{width:frame.width,height:frame.height}} aria-label={label}
    onCancel={e=>{e.preventDefault();onClose()}}>
    <CompletionMotion chapter={chapter} width={frame.width} height={frame.height}/>
    <div className="completion-card-content" style={frame.inset}>{children}</div>
  </dialog>,document.body)
}
