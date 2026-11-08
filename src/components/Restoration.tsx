import { Link } from 'react-router-dom'
import {lazy,Suspense,useState,useEffect,useRef,type ReactNode} from 'react'
import {useGame} from '../state/GameProvider'
import {completionDurationMs,fragmentIds,trayOrder,rotationOf,placementResult,restorationScore} from '../state/restoration'
import {storageJarArtifact} from '../data/artifacts'
import CompletionCard from './CompletionCard'
const Scene=lazy(()=>import('./RestorationScene'))
function Modal({children,onClose,label}:{children:ReactNode;onClose?:()=>void;label:string}){
  const ref=useRef<HTMLDialogElement>(null)
  useEffect(()=>{const previous=document.activeElement as HTMLElement|null;ref.current?.showModal();return()=>{ref.current?.close();previous?.focus()}},[])
  return <dialog ref={ref} className="quest-dialog" aria-label={label} onCancel={e=>{e.preventDefault();onClose?.()}}>{children}</dialog>
}
export default function Restoration({inspect,active}:{inspect:()=>void;active:boolean}){
  const {state,dispatch,t,storageError}=useGame();const r=state.restoration
  const [selected,setSelected]=useState('');const [feedback,setFeedback]=useState('');const [hinted,setHinted]=useState(false)
  const [help,setHelp]=useState(false);const [dismissed,setDismissed]=useState(false)
  const [viewKey,setViewKey]=useState(0)
  const [completionStart,setCompletionStart]=useState<number|null>(null)
  const [revealing,setRevealing]=useState(false)
  const complete=r.placed.length===fragmentIds.length
  const select=(id:string)=>{if(!active||!r.started||r.placed.includes(id))return;setSelected(id);setHinted(false);setFeedback('')}
  const rotate=(direction:1|-1)=>{if(selected&&!complete&&active){dispatch({type:'restore-rotate',id:selected,direction});setFeedback('')}}
  const place=(target:string)=>{
    if(!active||help)return
    const result=placementResult(r,selected,target);setFeedback(result)
    if(result==='correct'){
      if(r.placed.length===fragmentIds.length-1&&!window.matchMedia('(prefers-reduced-motion: reduce)').matches){
        setCompletionStart(performance.now())
        setRevealing(true)
      }
      dispatch({type:'restore-place',id:selected,target})
      setSelected('')
      setHinted(false)
      dispatch({type:'discover',id:storageJarArtifact.id})
    }
  }
  useEffect(()=>{
    if(!revealing||completionStart===null)return
    const timer=window.setTimeout(()=>setRevealing(false),Math.max(0,completionDurationMs-(performance.now()-completionStart)))
    return ()=>window.clearTimeout(timer)
  },[completionStart,revealing])
  useEffect(()=>{
    const key=(e:KeyboardEvent)=>{if(!active||help||document.querySelector('dialog[open]'))return;if(e.code==='KeyQ'||e.code==='KeyE'){e.preventDefault();if(selected)dispatch({type:'restore-rotate',id:selected,direction:e.code==='KeyQ'?-1:1})}}
    window.addEventListener('keydown',key);return()=>window.removeEventListener('keydown',key)
  },[active,help,selected,dispatch])
  const replay=()=>{if(window.confirm(t('replayConfirm'))){dispatch({type:'restore-restart'});setSelected('');setFeedback('');setHinted(false);setDismissed(false);setCompletionStart(null)}}
  const letter=selected?String.fromCharCode(65+trayOrder.indexOf(selected)):'—'
  const blocked=!active||help||!r.started||revealing
  return <div className={`restoration-root${revealing?' revealing':''}`}>
    <section className="restoration-scene" aria-label={t('workshop')}><Suspense fallback={<div className="scene-error">3D…</div>}><Scene restoration={r} selected={selected} onSelect={select} onTarget={place} onInspect={()=>{if(!blocked)inspect()}} active={!blocked} hinted={hinted} error={t('error')} viewKey={viewKey} completionStart={completionStart} revealing={revealing}/></Suspense></section>
    <div className="chapter-plaque"><span>Ⅰ</span><div><small>{t('phase')}</small><strong>{t('workshop')}</strong></div></div>
    <div className="restoration-stats"><div className="stone-counter"><span>✦</span><div><small>{t('chapterPoints')}</small><strong>{restorationScore(r)}</strong></div></div><div className="stone-counter"><span>◈</span><div><small>{t('progress')}</small><strong>{r.placed.length} / 9</strong></div></div></div>
    <div className="quest-progress"><div className="progress-track"><span style={{width:`${r.placed.length/9*100}%`}}/></div><p>{complete?t('finished'):t('chooseFragment')}</p></div>
    <div className="atelier-label">{t('restorationArtifact')}</div>
    <aside className="restoration-tools" inert={revealing}><button className="stone-button" onClick={()=>setHelp(true)}><span aria-hidden="true" title={t('help')}>?</span><b className="tool-label">{t('help')}</b></button><button className="stone-button" onClick={()=>setViewKey(v=>v+1)}><span aria-hidden="true" title={t('resetView')}>⌖</span><b className="tool-label">{t('resetView')}</b></button><button className="stone-button" disabled={!selected||r.hints>=3||complete||blocked} onClick={()=>{dispatch({type:'restore-hint'});setHinted(true);setFeedback('')}}><span aria-hidden="true" title={t('hintCost')}>✧</span><b className="tool-label">{t('hintCost')}</b><small>{3-r.hints}/3</small></button><button className="stone-button" onClick={inspect}><span aria-hidden="true" title={t('inspectRestored')}>▤</span><b className="tool-label">{t('inspectRestored')}</b></button><button className="stone-button" onClick={replay}><span aria-hidden="true" title={t('replay')}>↺</span><b className="tool-label">{t('replay')}</b></button></aside>
    <div className={`restoration-feedback ${feedback==='correct'?'success':''}`} data-state={feedback} role="status" aria-live="polite">{revealing?t('revealing'):feedback?t(feedback as 'correct'|'wrongSlot'|'wrongRotation'|'invalid'):hinted&&selected?`${t('hintSlot')} ${fragmentIds.indexOf(selected)+1} · ${t('hintTurns')} ${(4-rotationOf(r,selected))%4}`:selected?`${t('selectedFragment')} ${letter} · ${t('chooseRotation')}`:t('rotateHelp')}</div>
    <section className="restoration-console" aria-label={t('fragmentTray')}>
      <div className="fragment-section"><div className="console-title"><span>◇</span><strong>{t('fragmentTray')}</strong>{complete?<button type="button" className="restoration-result" onClick={()=>setDismissed(false)}>{t('timeViewResults')}</button>:<small>{t('chooseFragment')}</small>}</div><div className="fragment-buttons">{trayOrder.map((id,i)=><button className={`fragment-button ${selected===id?'selected':''} ${r.placed.includes(id)?'placed':''}`} key={id} disabled={r.placed.includes(id)||blocked} aria-label={`${t('fragment')} ${String.fromCharCode(65+i)}`} aria-pressed={selected===id} onClick={()=>select(id)}><span>{r.placed.includes(id)?'✓':String.fromCharCode(65+i)}</span></button>)}</div></div>
      <div className="rotation-section"><strong>{selected?`${t('fragment')} ${letter}`:t('noSelection')}</strong><div><button className="tool-square" aria-label={t('rotateLeft')} disabled={!selected||blocked} onClick={()=>rotate(-1)}>↶</button><span>{selected?`${rotationOf(r,selected)*90}°`:'—'}</span><button className="tool-square" aria-label={t('rotateRight')} disabled={!selected||blocked} onClick={()=>rotate(1)}>↷</button></div></div>
      <div className="target-section"><div className="console-title"><strong>{t('chooseTarget')}</strong></div><div className="target-buttons">{fragmentIds.map((id,i)=><button key={id} className={`slot-button ${hinted&&selected===id?'hinted':''}`} aria-label={`${t('target')} ${i+1}`} disabled={!selected||r.placed.includes(id)||blocked} onClick={()=>place(id)}>{r.placed.includes(id)?'✓':i+1}</button>)}</div></div>
    </section>
    <div className="restore-storage">{storageError?t('storageError'):t('saved')}</div>
    {(!r.started||help)&&<Modal label={t('help')} onClose={r.started?()=>setHelp(false):undefined}><div className="dialog-emblem">◇</div><span className="quest-eyebrow">{t('phase')}</span><h1>{t('restoreTitle')}</h1><p>{t('restoreIntro')}</p><ol className="tutorial-steps"><li>{t('chooseFragment')}</li><li>{t('chooseRotation')} · Q / E</li><li>{t('chooseTarget')}</li></ol><p className="tutorial-detail">{t('rotateHelp')}<br/>{t('hintCost')} · {t('hintsLeft')} 3</p><p className="prop-note">{t('restorationArtifact')}</p><button className="adventure-primary" onClick={()=>{dispatch({type:'restore-start'});setHelp(false)}}>{r.started?t('resume'):t('begin')} <span>➜</span></button></Modal>}
    {complete&&!revealing&&!dismissed&&<CompletionCard chapter={1} label={t('finished')} onClose={()=>setDismissed(true)}><div className="dialog-emblem stars">✦ ✦ ✦</div><span className="quest-eyebrow">{t('phase')}</span><h1>{t('finished')}</h1><p>{t('finishedDesc')}</p><div className="completion-score">{restorationScore(r)}<small>{t('chapterPoints')}</small></div><p className="bonus-note">{t('completionBonus')}</p><div className="completion-actions"><button className="adventure-primary" onClick={()=>{setDismissed(true);inspect()}}>{t('inspectRestored')} ➜</button><button className="stone-button completion-secondary" onClick={()=>setDismissed(true)}>{t('close')}</button><Link className="adventure-primary" to="/levels/2">{t('l2')} ➜</Link></div></CompletionCard>}
  </div>
}

