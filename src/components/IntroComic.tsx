import {useEffect,useId,useRef,useState} from 'react'
import {useGame} from '../state/GameProvider'
import {museumText} from '../data/modernMuseum'
import {arrivalComicUrl} from '../state/museumJourney'
export default function IntroComic({onContinue}:{onContinue:()=>void}){
 const {state}=useGame(),txt=(key:Parameters<typeof museumText>[1])=>museumText(state.language,key),dialog=useRef<HTMLDialogElement>(null),title=useId()
 const [loaded,setLoaded]=useState(false),[failed,setFailed]=useState(false),[attempt,setAttempt]=useState(0),done=useRef(false)
 useEffect(()=>{dialog.current?.showModal();return()=>dialog.current?.close()},[])
 return <dialog ref={dialog} className="journey-comic" aria-labelledby={title} onCancel={e=>e.preventDefault()}>
  <div className="journey-comic-layout"><div className="journey-comic-art">
   <img key={attempt} src={import.meta.env.BASE_URL+arrivalComicUrl+(attempt?'?retry='+attempt:'')} alt={txt('comicNote')} onLoad={()=>setLoaded(true)} onError={()=>setFailed(true)}/>
   {!loaded&&<p role="status">{txt(failed?'comicError':'comicLoading')}</p>}
  </div><div className="journey-comic-caption"><div><h2 id={title}>{txt('comicTitle')}</h2><p>{txt('comicNote')}</p></div><div className="journey-comic-actions">
   {failed&&<button className="stone-button" onClick={()=>{setFailed(false);setLoaded(false);setAttempt(v=>v+1)}}>{txt('comicRetry')}</button>}
   <button className="stone-button" autoFocus disabled={!loaded&&!failed} onClick={()=>{if(done.current)return;done.current=true;onContinue()}}>{txt('comicContinue')}</button>
  </div></div></div>
 </dialog>
}
