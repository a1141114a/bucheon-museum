import { lazy, Suspense, useState } from 'react'
import { Link } from 'react-router-dom'
import type { CopyKey } from '../i18n'
import { useGame } from '../state/GameProvider'
import { isLevelUnlocked } from '../state/game'
import { clueIds, movement, type Station } from '../state/exploration'
import './gallery-hunt.css'

const Scene = lazy(() => import('./GalleryScene'))
const stationLabels = {west:'huntWest', east:'huntEast', rear:'huntRear', chest:'huntChest'} satisfies Record<Station,CopyKey>
const directions = [
  ['huntForward','▲','forward',1], ['huntLeft','◀','side',-1],
  ['huntBack','▼','forward',-1], ['huntRight','▶','side',1],
] as const

export default function GalleryHunt({active}:{active:boolean}) {
  const {state,dispatch,t} = useGame()
  const [near,setNear] = useState<Station | null>(null)
  const [showHint,setShowHint] = useState(false)
  const {clues,opened} = state.gallery

  if (!isLevelUnlocked(state,2)) return <section className="hunt-lock">
    <h1>{t('l2')}</h1>
    <p>{t('huntLocked')}</p>
    <Link className="primary" to="/levels/1">{t('return')}</Link>
  </section>

  function inspect(station: Station) {
    if (!active || station !== near || opened) return
    if (station === 'chest') dispatch({type:'gallery-open'})
    else dispatch({type:'gallery-clue',id:station})
  }

  const collected = near !== null && near !== 'chest' && clues.includes(near)
  const blockedChest = near === 'chest' && clues.length !== clueIds.length

  return <section className="hunt-root" aria-labelledby="hunt-title">
    <div className="hunt-scene">
      <Suspense fallback={<div className="scene-error">3D…</div>}>
        <Scene active={active} clues={clues} opened={opened} onNear={setNear} onInspect={inspect} error={t('error')}/>
      </Suspense>
    </div>
    <div className="hunt-brief">
      <h1 id="hunt-title">{t('l2')}</h1>
      <p>{t('huntIntro')}</p>
      <p>{t('huntControls')}</p>
      <button type="button" className="stone-button" aria-expanded={showHint} onClick={() => setShowHint(!showHint)}>{t('hint')}</button>
      {showHint && <ul>{clueIds.map(id => <li key={id}>{clues.includes(id) ? '✓' : '◇'} {t(stationLabels[id])}</li>)}</ul>}
    </div>
    <div className="hunt-controls">
      <div className="hunt-pad" role="group" aria-label={t('huntControls')} inert={!active}>
        {directions.map(([label,symbol,axis,value]) => <button type="button" key={label} className="stone-button" aria-label={t(label)}
          onPointerDown={event => { event.currentTarget.setPointerCapture(event.pointerId); movement[axis]=value }}
          onPointerUp={() => { if (movement[axis]===value) movement[axis]=0 }}
          onLostPointerCapture={() => { if (movement[axis]===value) movement[axis]=0 }}
          onPointerCancel={() => { if (movement[axis]===value) movement[axis]=0 }}>
          {symbol}
        </button>)}
      </div>
      <div className="hunt-status">
        <strong>{t('huntClues')} {clues.length} / {clueIds.length}</strong>
        <p role="status">{opened?t('huntDone'):blockedChest?t('huntNeedClues'):near?t(stationLabels[near]):t('huntApproach')}</p>
        {!opened && near && !collected && !blockedChest &&
          <button type="button" className="stone-button" onClick={() => inspect(near)}>{t(near==='chest'?'huntOpen':'huntCollect')}</button>}
      </div>
    </div>
  </section>
}
