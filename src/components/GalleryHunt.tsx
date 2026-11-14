import { lazy, Suspense, useEffect, useState } from 'react'
import { Link,useNavigate } from 'react-router-dom'
import {paintingCopy} from '../data/paintingWorlds'
import { artifacts } from '../data/artifacts'
import type { Artifact } from '../types'
import type { CopyKey } from '../i18n'
import { useGame } from '../state/GameProvider'
import { isLevelUnlocked } from '../state/game'
import { clueIds, movement, type Station } from '../state/exploration'
import { coinPuzzleSolved, createCoinPuzzle, moveCoinTile } from '../state/coinPuzzle'
import { CoinPuzzle, CoinReward } from './CoinPuzzle'
import MovementJoystick,{useTouchControls} from './MovementJoystick'
import './gallery-hunt.css'

const Scene = lazy(() => import('./GalleryScene'))
const stationLabels = {west:'huntWest', east:'huntEast', rear:'huntRear', chest:'huntChest'} satisfies Record<Station,CopyKey>
const directions = [
  ['huntForward','▲','forward',1], ['huntLeft','◀','side',-1],
  ['huntBack','▼','forward',-1], ['huntRight','▶','side',1],
] as const

export default function GalleryHunt({active,onArtifact}:{active:boolean;onArtifact:(artifact:Artifact)=>void}) {
  const {state,dispatch,t} = useGame()
  const navigate=useNavigate()
  const [nearPainting,setNearPainting]=useState(false)
  const touchControls=useTouchControls()
  const [near,setNear] = useState<Station | null>(null)
  const [exhibitId,setExhibitId] = useState<string|null>(null)
  const exhibit = artifacts.find(item=>item.id===exhibitId)
  const [showHint,setShowHint] = useState(false)
  const [briefOpen,setBriefOpen] = useState(false)
  const [sceneKey,setSceneKey] = useState(0)
  const [phase,setPhase] = useState<'idle'|'puzzle'|'celebration'|'reward'|'entering'>('idle')
  const [board,setBoard] = useState(createCoinPuzzle)
  const [moves,setMoves] = useState(0)
  const {clues,opened} = state.gallery
  const sceneActive=active&&phase==='idle'
  const celebrating=phase==='celebration'||phase==='reward'

  useEffect(()=>{
    if(phase!=='celebration')return
    const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const timer=window.setTimeout(()=>setPhase('reward'),reduced?0:2900)
    return ()=>window.clearTimeout(timer)
  },[phase])

  function shufflePuzzle() {
    setBoard(createCoinPuzzle())
    setMoves(0)
  }

  function movePuzzle(index:number) {
    if(phase!=='puzzle')return
    const next=moveCoinTile(board,index)
    if(!next)return
    setBoard(next)
    setMoves(value=>value+1)
    if(coinPuzzleSolved(next)){
      dispatch({type:'gallery-open'})
      setPhase('celebration')
    }
  }

  if (!isLevelUnlocked(state,2)) return <section className="hunt-lock">
    <h1>{t('l2')}</h1>
    <p>{t('huntLocked')}</p>
    <Link className="primary" to="/levels/1">{t('return')}</Link>
  </section>

  function restart() {
    if (!sceneActive || !window.confirm(t('huntRestartConfirm'))) return
    movement.forward=0
    movement.side=0
    setNear(null)
    setExhibitId(null)
    setShowHint(false)
    shufflePuzzle()
    dispatch({type:'gallery-restart'})
    setSceneKey(key=>key+1)
  }

  function inspect(station: Station) {
    if (!sceneActive || station !== near || opened) return
    if (station === 'chest') {
      if(clues.length!==clueIds.length)return
      movement.forward=0
      movement.side=0
      setPhase('puzzle')
    } else dispatch({type:'gallery-clue',id:station})
  }

  function inspectExhibit(id:string) {
    if (sceneActive && exhibit?.id===id) onArtifact(exhibit)
  }

  const blockedChest = near === 'chest' && clues.length !== clueIds.length

  return <section className="hunt-root" data-touch-controls={touchControls} aria-labelledby="hunt-title">
    <div className="hunt-scene">
      <Suspense fallback={<div className="scene-error">3D…</div>}>
        <Scene key={sceneKey} language={state.language} active={sceneActive} clues={clues} opened={opened} celebrating={celebrating} onNear={setNear} onInspect={inspect} onNearExhibit={setExhibitId} onExhibit={inspectExhibit} error={t('error')} entering={phase==='entering'} onNearPainting={setNearPainting} onEnterPainting={()=>{if(sceneActive&&nearPainting){movement.forward=0;movement.side=0;setPhase('entering')}}} onEnteredPainting={()=>{dispatch({type:'photo-start'});navigate('/levels/3')}}/>
      </Suspense>
    </div>
    <button type="button" className="stone-button hunt-brief-launch" aria-controls="hunt-task-panel"
      aria-expanded={briefOpen} disabled={!sceneActive} hidden={briefOpen||phase!=='idle'}
      onClick={()=>setBriefOpen(true)}>☷ {t('huntTaskPanel')}</button>
    <div id="hunt-task-panel" className="hunt-brief" inert={!sceneActive} hidden={!briefOpen||phase!=='idle'}>
      <div className="hunt-brief-heading">
        <h1 id="hunt-title">{t('l2')}</h1>
        <button type="button" className="hunt-collapse" aria-label={t('huntHidePanel')}
          aria-controls="hunt-task-panel" aria-expanded={briefOpen} onClick={()=>setBriefOpen(false)}>×</button>
      </div>
      <div><p>{t('huntIntro')}</p><p>{t('huntControls')}</p></div>
      <div className="hunt-brief-actions">
        <button type="button" className="stone-button" aria-expanded={showHint} onClick={() => setShowHint(!showHint)}>{t('hint')}</button>
        <button type="button" className="stone-button" disabled={!active} onClick={restart}>{t('huntRestart')}</button>
        <button type="button" className="stone-button" disabled={!sceneActive} onClick={()=>{movement.forward=0;movement.side=0;setNear(null);setExhibitId(null);setSceneKey(value=>value+1)}}>{t('returnEntrance')}</button>
      </div>
      {showHint && <ul>{clueIds.map(id => <li key={id}>{clues.includes(id) ? '✓' : '◇'} {t(stationLabels[id])}</li>)}</ul>}
    </div>
    <div className="hunt-controls" inert={!sceneActive} hidden={phase!=='idle'}>
      {touchControls?<MovementJoystick key={sceneKey} active={sceneActive} label={t('huntJoystick')} help={t('huntJoystickHelp')}/>:<div className="hunt-pad" role="group" aria-label={t('huntControls')} inert={!active}>
        {directions.map(([label,symbol,axis,value]) => <button type="button" key={label} className="stone-button" aria-label={t(label)}
          onPointerDown={event => { event.currentTarget.setPointerCapture(event.pointerId); movement[axis]=value }}
          onPointerUp={() => { if (movement[axis]===value) movement[axis]=0 }}
          onLostPointerCapture={() => { if (movement[axis]===value) movement[axis]=0 }}
          onPointerCancel={() => { if (movement[axis]===value) movement[axis]=0 }}>
          {symbol}
        </button>)}
      </div>}
      <div className="hunt-status">
        <strong>{t('huntClues')} {clues.length} / {clueIds.length}</strong>
        <p role="status">{opened?t('huntDone'):blockedChest?t('huntNeedClues'):near&&near!=='chest'?(clues.includes(near)?t('huntCoinCollected'):t('huntClickCoin')):near?t(stationLabels[near]):exhibit?exhibit.name[state.language]:t('huntApproach')}</p>
        {!opened && near==='chest' && !blockedChest &&
          <button type="button" className="stone-button" onClick={() => inspect(near)}>{t('huntOpen')}</button>}
        {exhibit && !near && <button type="button" className="stone-button" onClick={() => inspectExhibit(exhibit.id)}>{t('huntExhibit')}</button>}
        {opened&&nearPainting&&<button type="button" className="stone-button" onClick={()=>{movement.forward=0;movement.side=0;setPhase('entering')}}>{paintingCopy(state.language,'enter')}</button>}
      </div>
    </div>
    {phase==='puzzle' && <CoinPuzzle board={board} moves={moves} onMove={movePuzzle} onShuffle={shufflePuzzle} onClose={()=>setPhase('idle')}/>}
    {phase==='reward' && <CoinReward onClose={()=>setPhase('idle')}/>}
    {phase==='entering'&&<div className="photo-crossing"><span>{paintingCopy(state.language,'reveal')}</span></div>}
  </section>
}

