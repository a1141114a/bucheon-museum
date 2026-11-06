import { useEffect, useRef, type KeyboardEvent, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { coinPuzzleNeighbors } from '../state/coinPuzzle'
import { useGame } from '../state/GameProvider'
import './coin-puzzle.css'

const faceUrl=import.meta.env.BASE_URL+'models/gallery-coin-puzzle.png'

function CopperDialog({children,onClose,reward=false}:{children:ReactNode;onClose:()=>void;reward?:boolean}) {
  const dialog=useRef<HTMLDialogElement>(null)
  useEffect(()=>{
    const element=dialog.current
    const previous=document.activeElement as HTMLElement|null
    element?.showModal()
    return ()=>{element?.close();previous?.focus()}
  },[])
  return <dialog ref={dialog} className={`coin-puzzle-dialog${reward?' coin-puzzle-reward':''}`}
    aria-labelledby="coin-puzzle-title" onCancel={event=>{event.preventDefault();onClose()}}>
    {children}
  </dialog>
}

interface PuzzleProps {
  board:readonly number[]
  moves:number
  onMove:(index:number)=>void
  onShuffle:()=>void
  onClose:()=>void
}

export function CoinPuzzle({board,moves,onMove,onShuffle,onClose}:PuzzleProps) {
  const {t}=useGame()
  const empty=board.indexOf(0)
  const movable=coinPuzzleNeighbors(empty)
  function keyMove(event:KeyboardEvent<HTMLDivElement>) {
    const offsets:Record<string,number>={ArrowUp:-3,ArrowDown:3,ArrowLeft:-1,ArrowRight:1}
    const offset=offsets[event.key]
    if (offset===undefined) return
    const index=empty+offset
    event.preventDefault()
    if (movable.includes(index)) onMove(index)
  }
  return <CopperDialog onClose={onClose}>
    <div className="coin-puzzle-heading">
      <div><p className="coin-puzzle-kicker">Ⅱ · ◈</p><h2 id="coin-puzzle-title">{t('coinPuzzleTitle')}</h2></div>
      <button className="coin-puzzle-close" type="button" aria-label={t('close')} onClick={onClose}>×</button>
    </div>
    <p className="coin-puzzle-instructions">{t('coinPuzzleInstructions')}</p>
    <div className="coin-puzzle-content">
      <div className="coin-puzzle-board" role="group" aria-label={t('coinPuzzleTitle')} onKeyDown={keyMove}>
        {board.map((tile,index)=>tile===0
          ? <div className="coin-puzzle-empty" key={tile} aria-label={t('coinPuzzleEmpty')}>◇</div>
          : <button type="button" className="coin-puzzle-tile" key={tile} aria-disabled={!movable.includes(index)}
            data-piece={tile} aria-label={`${t('coinPuzzlePiece')} ${tile}`}
            style={{backgroundImage:`url("${faceUrl}")`,backgroundPosition:`${(tile-1)%3*50}% ${Math.floor((tile-1)/3)*50}%`}}
            onClick={()=>onMove(index)}><span>{tile}</span></button>)}
      </div>
      <figure className="coin-puzzle-reference">
        <img src={faceUrl} alt={t('coinPuzzleReference')} width="420" height="420"/>
        <figcaption>{t('coinPuzzleReference')}</figcaption>
      </figure>
    </div>
    <div className="coin-puzzle-footer">
      <p aria-live="polite">{t('coinPuzzleMoves')} <strong>{moves}</strong></p>
      <button type="button" className="coin-puzzle-action" onClick={onShuffle}>{t('coinPuzzleShuffle')}</button>
    </div>
  </CopperDialog>
}

export function CoinReward({onClose}:{onClose:()=>void}) {
  const {t}=useGame()
  return <CopperDialog onClose={onClose} reward>
    <p className="coin-puzzle-kicker">◈ ◈ ◈</p>
    <h2 id="coin-puzzle-title">{t('coinPuzzleReward')}</h2>
    <p className="coin-puzzle-instructions">{t('coinPuzzleNextNote')}</p>
    <div className="coin-puzzle-footer">
      <button type="button" className="coin-puzzle-action" onClick={onClose}>{t('close')}</button>
      <Link className="coin-puzzle-action coin-puzzle-next" to="/levels/3">{t('coinPuzzleNext')} →</Link>
    </div>
  </CopperDialog>
}
