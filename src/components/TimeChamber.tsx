import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { artifacts } from '../data/artifacts'
import { useGame } from '../state/GameProvider'
import { isLevelUnlocked } from '../state/game'
import { timeAligned, timeArtifactIds, timeScore } from '../state/time'
import type { Artifact } from '../types'
import type { CopyKey } from '../i18n'
import './time-chamber.css'

const Scene=lazy(()=>import('./TimeScene'))
const ringLabels=['timeOuter','timeMiddle','timeInner'] as const
const symbolLabels=['timeSymbolA','timeSymbolB','timeSymbolC'] as const
const clueArtifacts=timeArtifactIds.map(id=>artifacts.find(artifact=>artifact.id===id)!)

function Finale({onClose}:{onClose:()=>void}) {
  const {state,t}=useGame()
  const ref=useRef<HTMLDialogElement>(null)
  useEffect(()=>{
    const previous=document.activeElement as HTMLElement|null
    ref.current?.showModal()
    return ()=>{ref.current?.close();previous?.focus()}
  },[])
  return <dialog ref={ref} className="time-finale" aria-labelledby="time-finale-title" onCancel={onClose}>
    <div className="time-finale-emblem" aria-hidden="true">✧</div>
    <p className="time-eyebrow">{t('timeFinish')}</p>
    <h2 id="time-finale-title">{t('timeSuccess')}</h2>
    <p>{t('timeFinishNote')}</p>
    <div className="time-scoreboard">
      <div><span>{t('timePoints')}</span><strong>{timeScore(state.time)}</strong></div>
      <div><span>{t('timeAllPoints')}</span><strong>{state.score}</strong></div>
    </div>
    <div className="time-finale-actions">
      <Link className="stone-button" to="/">{t('home')}</Link>
      <Link className="stone-button" to="/levels/2">{t('timeBackGallery')}</Link>
      <button type="button" className="stone-button" onClick={onClose}>{t('timeViewAgain')}</button>
    </div>
  </dialog>
}

export default function TimeChamber({active,onArtifact}:{active:boolean;onArtifact:(artifact:Artifact)=>void}) {
  const {state,dispatch,t}=useGame()
  const [selected,setSelected]=useState(0)
  const [viewKey,setViewKey]=useState(0)
  const [feedback,setFeedback]=useState<CopyKey>('timeReady')
  const [celebrating,setCelebrating]=useState(false)
  const [finale,setFinale]=useState(false)
  const [briefOpen,setBriefOpen]=useState(false)
  const time=state.time
  const enabled=active&&!celebrating&&!finale&&!time.solved

  useEffect(()=>{
    if(!celebrating)return
    const timer=window.setTimeout(()=>{setCelebrating(false);setFinale(true)},window.matchMedia('(prefers-reduced-motion: reduce)').matches?0:2600)
    return ()=>window.clearTimeout(timer)
  },[celebrating])

  useEffect(()=>{
    function key(event:KeyboardEvent) {
      if(!enabled||document.querySelector('dialog[open]')||event.target instanceof HTMLInputElement)return
      if(event.code==='KeyQ'||event.code==='KeyE'){
        event.preventDefault()
        dispatch({type:'time-rotate',ring:selected,direction:event.code==='KeyQ'?-1:1})
        setFeedback('timeReady')
      }
    }
    window.addEventListener('keydown',key)
    return ()=>window.removeEventListener('keydown',key)
  },[enabled,selected,dispatch])

  if(!isLevelUnlocked(state,3))return <section className="hunt-lock time-locked">
    <h1>{t('l3')}</h1><p>{t('timeLocked')}</p>
    <Link className="primary" to="/levels/2">{t('l2')}</Link>
  </section>

  function rotate(direction:1|-1) {
    if(!enabled)return
    dispatch({type:'time-rotate',ring:selected,direction})
    setFeedback('timeReady')
  }

  function check() {
    if(!enabled)return
    dispatch({type:'time-check'})
    if(timeAligned(time.rings)){setFeedback('timeRevealing');setCelebrating(true)}
    else setFeedback('timeWrong')
  }

  function restart() {
    if(!active||celebrating||!window.confirm(t('timeRestartConfirm')))return
    dispatch({type:'time-restart'})
    setFeedback('timeReady');setBriefOpen(false);setFinale(false);setSelected(0)
  }

  return <section className={`time-root${briefOpen?'':' time-guide-collapsed'}`} aria-label={t('timeTitle')}>
    <div className="time-scene">
      <Suspense fallback={<div className="scene-error">3D…</div>}>
        <Scene rings={time.rings} selected={selected} active={active&&!finale&&!celebrating}
          solved={time.solved} celebrating={celebrating} viewKey={viewKey}
          onSelect={setSelected} onArtifact={onArtifact} error={t('error')}/>
      </Suspense>
    </div>
    {briefOpen?<aside id="time-guide-panel" className="time-brief" hidden={celebrating} inert={!active}>
      <div className="time-brief-heading">
        <p className="time-eyebrow">Ⅲ · {t('l3')}</p>
        <h1 id="time-title">{t('timeTitle')}</h1>
        <button type="button" className="time-detail-toggle time-brief-collapse" aria-expanded="true" aria-controls="time-guide-panel" onClick={()=>setBriefOpen(false)}>{t('timePanelHide')}</button>
      </div>
      <p>{t('timeIntro')}</p><p>{t('timeScoreRule')}</p>
      {time.hints>0&&<section className="time-hint" aria-label={t('timeHintsRevealed')}>
        <h2>{t('timeHintsRevealed')}</h2>
        <ol className="time-hint-list">{(['timeHintOne','timeHintTwo','timeHintThree'] as const).slice(0,time.hints).map(key=><li key={key}>{t(key)}</li>)}</ol>
      </section>}
    </aside>:<button type="button" className="time-detail-toggle time-brief-reopen" hidden={celebrating} disabled={!active} aria-label={t('timePanelShow')} aria-expanded="false" onClick={()=>setBriefOpen(true)}><span aria-hidden="true">◇</span> {t('timeGuideLabel')}</button>}
    <div className="time-tools" hidden={celebrating} inert={!active}>
      <button type="button" className="stone-button" onClick={()=>setViewKey(value=>value+1)}><span aria-hidden="true">⌖</span><span className="time-tool-caption">{t('resetView')}</span></button>
      <button type="button" className="stone-button" disabled={time.solved||time.hints>=3} onClick={()=>{
        if(!enabled)return
        dispatch({type:'time-hint'});setBriefOpen(true)
      }}><span aria-hidden="true">✧</span><span className="time-tool-caption">{t('timeHint')} · {3-time.hints}/3</span></button>
      <button type="button" className="stone-button" onClick={restart}><span aria-hidden="true">↺</span><span className="time-tool-caption">{t('timeRestart')}</span></button>
    </div>
    <div className="time-dock" hidden={celebrating} inert={!active||finale}>
      <div className="time-artifact-clues" role="group" aria-label={t('timeClues')}>
        {clueArtifacts.map((artifact,index)=><button type="button" className="stone-button time-clue" key={artifact.id}
          onClick={()=>onArtifact(artifact)}><span aria-hidden="true">▤</span><span className="time-clue-letter" aria-hidden="true">{String.fromCharCode(65+index)}</span><span className="time-clue-name">{t(symbolLabels[index])}</span></button>)}
      </div>
      <div className="time-ring-controls">
        <div className="time-ring-tabs" role="group" aria-label={t('timeSelected')}>
          {ringLabels.map((label,index)=><button type="button" className="stone-button" key={label}
            aria-pressed={selected===index} onClick={()=>setSelected(index)}>
            <strong>{t(label)}</strong><span><b className="time-ring-symbol-letter" aria-hidden="true">{String.fromCharCode(65+time.rings[index])}</b><span className="time-ring-symbol-name">{t(symbolLabels[time.rings[index]])}</span></span>
          </button>)}
        </div>
        <div className="time-turn-controls">
          <button type="button" className="stone-button time-arrow" aria-label={t('timeLeft')} disabled={!enabled} onClick={()=>rotate(-1)}>↶</button>
          <button type="button" className="stone-button time-activate" disabled={!enabled} onClick={check}>{t('timeCheck')}</button>
          <button type="button" className="stone-button time-arrow" aria-label={t('timeRight')} disabled={!enabled} onClick={()=>rotate(1)}>↷</button>
        </div>
      </div>
      <p className="time-feedback" role="status">{time.solved?t('timeSuccess'):t(feedback)}</p>

      {time.solved&&<button type="button" className="time-detail-toggle" onClick={()=>setFinale(true)}>{t('timeFinish')}</button>}
    </div>
    {finale&&<Finale onClose={()=>setFinale(false)}/>}
  </section>
}
