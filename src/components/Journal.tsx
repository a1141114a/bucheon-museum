import {useState} from 'react'
import {artifacts} from '../data/artifacts'
import {useGame} from '../state/GameProvider'
import {statusOf} from '../state/game'
import type {Artifact} from '../types'
import JournalArtwork from './JournalArtwork'
import JournalComparison from './JournalComparison'
import './journal-comparison.css'

export default function Journal({open}:{open:(a:Artifact)=>void}){
  const {state,t}=useGame()
  const [view,setView]=useState<'cards'|'comparison'>(()=>artifacts.some(a=>statusOf(state,a.id)!=='locked')?'comparison':'cards')
  return <>
    <div className="page-heading"><div><span className="eyebrow">FIELD NOTES / 01</span><h1>{t('atlas')}</h1></div></div>
    {view==='cards'&&<p className="intro">{t('journalDesc')}</p>}
    <div className="journal-partitions" role="group" aria-label={t('journalSections')}>
      <button type="button" aria-pressed={view==='comparison'} onClick={()=>setView('comparison')}>{t('journalCompareTab')}</button>
      <button type="button" aria-pressed={view==='cards'} onClick={()=>setView('cards')}>{t('journalCardsTab')}</button>
    </div>
    {view==='comparison'?<JournalComparison/>:<section aria-label={t('journalCardsTab')}><div className="journal-grid">{artifacts.map(a=>{
      const status=statusOf(state,a.id)
      return <button key={a.id} className="journal-entry" disabled={status==='locked'} onClick={()=>open(a)}>
        {status!=='locked'?<JournalArtwork artifact={a}/>:<div className="journal-symbol">?</div>}
        <span className="status">{t(status)}</span><h2>{a.name[state.language]}</h2>
        <p>{status==='locked'?t('lockedRecord'):a.museum?.[state.language]??t('testBadge')}</p><span className="arrow">↗</span>
      </button>
    })}</div></section>}
  </>
}
