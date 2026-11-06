import { useEffect, useState } from 'react'
import { Link, NavLink, Navigate, Route, Routes, useLocation, useParams } from 'react-router-dom'
import { artifacts } from './data/artifacts'
import { ArtifactCard } from './components/ArtifactCard'
import { useGame } from './state/GameProvider'
import { isLevelUnlocked, statusOf } from './state/game'
import type { Artifact, Language } from './types'
import Restoration from './components/Restoration'
import Home from './components/Home'
import GalleryHunt from './components/GalleryHunt'

function ToolbarIcon({name}:{name:'chapters'|'close'|'journal'|'fullscreen'|'home'}){
  const paths={
    chapters:'M4 7h16M4 12h12M4 17h16M18 12h2',
    close:'m6 6 12 12M18 6 6 18',
    journal:'M3 5h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5v13h-5a4 4 0 0 0-4 2 4 4 0 0 0-4-2H3zM12 9v11',
    fullscreen:'M9 4H4v5m11-5h5v5M4 15v5h5m11-5v5h-5',
    home:'m3 11 9-7 9 7M5.5 10v10h4v-6h5v6h4V10',
  }
  return <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={paths[name]}/></svg>
}
function Journal({open}:{open:(a:Artifact)=>void}) {
  const {state,t}=useGame()
  return <><div className="page-heading"><div><span className="eyebrow">FIELD NOTES / 01</span><h1>{t('atlas')}</h1></div></div><p className="intro">{t('journalDesc')}</p><div className="journal-grid">{artifacts.map(a=>{
    const status=statusOf(state,a.id)
    return <button key={a.id} className="journal-entry" disabled={status==='locked'} onClick={()=>open(a)}><div className="journal-symbol">{status==='locked'?'?':'◇'}</div><span className="status">{t(status)}</span><h2>{a.name[state.language]}</h2><p>{status==='locked'?t('lockedRecord'):a.museum?.[state.language]??t('testBadge')}</p><span className="arrow">↗</span></button>
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
  const [menu,setMenu]=useState(false);const location=useLocation();const inGallery=location.pathname==='/levels/1';const inHunt=location.pathname==='/levels/2';const playing=inGallery||inHunt
  useEffect(()=>{
    if(!menu)return
    const closeMenu=(event:KeyboardEvent)=>{if(event.key==='Escape')setMenu(false)}
    window.addEventListener('keydown',closeMenu)
    return ()=>window.removeEventListener('keydown',closeMenu)
  },[menu])
  const inspect=(a=artifacts[0])=>{dispatch({type:'discover',id:a.id});setSelected(a)}
  const count=Object.values(state.artifacts).filter(s=>s!=='locked').length
  if(location.pathname==='/')return <Home/>
  return <div className={`app-shell ${playing?`game-view restoration-view${inHunt?' hunt-view':''}`:''} ${menu?'menu-open':''}`}><aside id="chapter-menu" className="sidebar chapter-panel"><Link className="brand" to="/" aria-label={t('home')} onClick={()=>setMenu(false)}><span className="brand-mark">時</span><span>BUCHEON<br/><b>MUSEUM</b></span></Link><div className="sidebar-rule"/><p className="sidebar-caption">{t('journey')}</p><nav className="chapters" aria-label={t('journey')}>{([1,2,3] as const).map((id)=><NavLink to={`/levels/${id}`} onClick={()=>setMenu(false)} key={id}><span className="chapter-num">0{id}</span><span>{t(`l${id}`)}<small>{t(id===3?'upcoming':isLevelUnlocked(state,id)?'current':'huntLocked')}</small></span><span className="chapter-state" aria-hidden="true">{id!==3&&isLevelUnlocked(state,id)?'◉':'⌑'}</span></NavLink>)}</nav><Link className="chapter-home" to="/" onClick={()=>setMenu(false)}><ToolbarIcon name="home"/> {t('home')} <span aria-hidden="true">↗</span></Link><NavLink className="journal-link" to="/journal" onClick={()=>setMenu(false)}><ToolbarIcon name="journal"/> {t('atlas')} <span>↗</span></NavLink><div className="sidebar-bottom"><span className="tiny-diamond">◇</span><p>{t('subtitle')}</p><span className="version">CHAPTER 01 · v0.2.0</span></div></aside>
    <div className="main-shell"><header><Link className="header-title" to="/" aria-label={t('home')} onClick={()=>setMenu(false)}>{t('title')}</Link><div className="game-toolbar"><button className="menu-button carved-button" aria-expanded={menu} aria-controls="chapter-menu" onClick={()=>setMenu(!menu)}><ToolbarIcon name={menu?'close':'chapters'}/>{t('menu')}</button><Link className="carved-button" to="/journal" onClick={()=>setMenu(false)}><ToolbarIcon name="journal"/>{t('atlas')}</Link><button onClick={()=>{if(!document.fullscreenElement)document.documentElement.requestFullscreen?.().catch(()=>{});else document.exitFullscreen?.().catch(()=>{})}} className="carved-button"><ToolbarIcon name="fullscreen"/>{t('fullscreen')}</button></div><div className="languages carved-switch" role="group" aria-label="Language">{(['zh','ko','en'] as Language[]).map(lang=><button key={lang} lang={lang} aria-pressed={state.language===lang} onClick={()=>dispatch({type:'language',language:lang})}>{({zh:'中文',ko:'한국어',en:'EN'})[lang]}</button>)}</div></header><main>
      <div className="meta-strip"><span>{t('phase')}</span><div><span>{t('discoveredCount')} <b>{count.toString().padStart(2,'0')} / 01</b></span><span>{t('score')} <b>{state.score.toString().padStart(3,'0')}</b></span></div></div>
      {storageError&&<p className="storage-warning" role="alert">{t('storageError')}</p>}
      <Routes><Route path="/levels/1" element={<Restoration inspect={()=>inspect()} active={!selected&&!menu}/>}/><Route path="/levels/2" element={<GalleryHunt active={!menu}/>}/><Route path="/levels/:id" element={<FutureLevel/>}/><Route path="/journal" element={<Journal open={inspect}/>}/><Route path="*" element={<Navigate to="/" replace/>}/></Routes>
      <footer><span>{storageError?'—':t('saved')}</span><button onClick={()=>{if(window.confirm(t('resetConfirm'))){setSelected(null);dispatch({type:'reset'})}}}>{t('reset')}</button></footer>
    </main></div>{selected&&<ArtifactCard artifact={selected} onClose={()=>setSelected(null)}/>}</div>
}
