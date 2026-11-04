import { useState } from 'react'
import { Link, NavLink, Navigate, Route, Routes, useLocation, useParams } from 'react-router-dom'
import { artifacts } from './data/artifacts'
import { ArtifactCard } from './components/ArtifactCard'
import { useGame } from './state/GameProvider'
import { statusOf } from './state/game'
import type { Artifact, Language } from './types'
import Restoration from './components/Restoration'
function Journal({open}:{open:(a:Artifact)=>void}) {
  const {state,t}=useGame()
  return <><div className="page-heading"><div><span className="eyebrow">FIELD NOTES / 01</span><h1>{t('atlas')}</h1></div></div><p className="intro">{t('journalDesc')}</p><div className="journal-grid">{artifacts.map(a=>{
    const status=statusOf(state,a.id)
    return <button key={a.id} className="journal-entry" disabled={status==='locked'} onClick={()=>open(a)}><div className="journal-symbol">{status==='locked'?'?':'◇'}</div><span className="status">{t(status)}</span><h2>{a.name[state.language]}</h2><p>{status==='locked'?t('lockedRecord'):t('testBadge')}</p><span className="arrow">↗</span></button>
  })}</div></>
}
function FutureLevel(){
  const {id}=useParams();const {t}=useGame()
  if(id==='1')return <Navigate to="/levels/1" replace/>
  if(id!=='2'&&id!=='3')return <Navigate to="/levels/1" replace/>
  return <section className="future"><span className="chapter-large">0{id}</span><span className="eyebrow">{t('upcoming')}</span><h1>{t(id==='2'?'l2':'l3')}</h1><h2>{t('future')}</h2><p>{t('futureDesc')}</p><Link className="primary" to="/levels/1">{t('return')} →</Link></section>
}
export default function App(){
  const {state,dispatch,storageError,t}=useGame();const [selected,setSelected]=useState<Artifact|null>(null)
  const [menu,setMenu]=useState(false);const location=useLocation();const inGallery=location.pathname==='/levels/1'
  const inspect=(a=artifacts[0])=>{dispatch({type:'discover',id:a.id});setSelected(a)}
  const count=Object.values(state.artifacts).filter(s=>s!=='locked').length
  return <div className={`app-shell ${inGallery?'game-view restoration-view':''} ${menu?'menu-open':''}`}><aside className="sidebar"><Link className="brand" to="/levels/1" onClick={()=>setMenu(false)}><span className="brand-mark">時</span><span>BUCHEON<br/><b>MUSEUM</b></span></Link><div className="sidebar-rule"/><p className="sidebar-caption">{t('journey')}</p><nav className="chapters">{([1,2,3] as const).map((id)=><NavLink to={`/levels/${id}`} onClick={()=>setMenu(false)} key={id}><span className="chapter-num">0{id}</span><span>{t(`l${id}`)}<small>{t(id===1?'current':'upcoming')}</small></span><span className="chapter-state">{id===1?'◉':'⌑'}</span></NavLink>)}</nav><NavLink className="journal-link" to="/journal" onClick={()=>setMenu(false)}><span>▤</span> {t('atlas')} <span>↗</span></NavLink><div className="sidebar-bottom"><span className="tiny-diamond">◇</span><p>{t('subtitle')}</p><span className="version">CHAPTER 01 · v0.2.0</span></div></aside>
    <div className="main-shell"><header><div className="header-title">{t('title')}</div><div className="game-toolbar"><button className="menu-button" aria-expanded={menu} onClick={()=>setMenu(!menu)}>{menu?'×':'☰'} {t('menu')}</button><Link to="/journal">▤ {t('atlas')}</Link><button onClick={()=>{if(!document.fullscreenElement)document.documentElement.requestFullscreen?.().catch(()=>{});else document.exitFullscreen?.().catch(()=>{})}}>⛶ {t('fullscreen')}</button></div><div className="languages" aria-label="Language">{(['zh','ko','en'] as Language[]).map(lang=><button key={lang} aria-pressed={state.language===lang} onClick={()=>dispatch({type:'language',language:lang})}>{({zh:'中文',ko:'한국어',en:'EN'})[lang]}</button>)}</div></header><main>
      <div className="meta-strip"><span>{t('phase')}</span><div><span>{t('discoveredCount')} <b>{count.toString().padStart(2,'0')} / 01</b></span><span>{t('score')} <b>{state.score.toString().padStart(3,'0')}</b></span></div></div>
      {storageError&&<p className="storage-warning" role="alert">{t('storageError')}</p>}
      <Routes><Route path="/" element={<Navigate to="/levels/1" replace/>}/><Route path="/levels/1" element={<Restoration inspect={()=>inspect()} active={!selected&&!menu}/>}/><Route path="/levels/:id" element={<FutureLevel/>}/><Route path="/journal" element={<Journal open={inspect}/>}/><Route path="*" element={<Navigate to="/levels/1" replace/>}/></Routes>
      <footer><span>{storageError?'—':t('saved')}</span><button onClick={()=>{if(window.confirm(t('resetConfirm'))){setSelected(null);dispatch({type:'reset'})}}}>{t('reset')}</button></footer>
    </main></div>{selected&&<ArtifactCard artifact={selected} onClose={()=>setSelected(null)}/>}</div>
}
