import {useId,useRef,type MouseEvent} from 'react'
import {Link} from 'react-router-dom'
import {useGame} from '../state/GameProvider'
import './home.css'

const languages = {zh:'中文',ko:'한국어',en:'EN'} as const
const languageChoices = Object.entries(languages) as [keyof typeof languages,string][]

function LanguageSelector(){
  const {state,dispatch,t}=useGame()
  return <div className="home-languages" role="group" aria-label={t('language')}>
    {languageChoices.map(([language,label])=><button key={language} lang={language}
      aria-pressed={state.language===language} onClick={()=>dispatch({type:'language',language})}>{label}</button>)}
  </div>
}

function Pavilion(){
  return <svg className="home-pavilion" viewBox="0 0 240 58" fill="none" stroke="currentColor"
    strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M3 53h234M41 49h158M69 48h102M81 45V34m13 11V35m13 10V35m26 10V35m13 10V35m13 10V34M113 47v-7q7-7 14 0v7"/>
    <path d="M77 30c-10 1-17 0-23-4 20 1 34-5 41-15m50 0c7 10 21 16 41 15-6 4-13 5-23 4zm18 0c6-1 12-4 15-8M77 30c-6-1-12-4-15-8"/>
    <path d="M91 9q8 3 29 3t29-3c-3-1-4-3-3-5m-52 0c1 2 0 4-3 5m16 8-5 8m14-8-2 8m10-8 2 8m7-8 5 8M86 34h68"/>
  </svg>
}

function Flourish({className}:{className:string}){
  return <svg className={className} viewBox="0 0 132 38" fill="none" stroke="currentColor"
    strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
    <path d="M2 26c12-2 20-3 30-1 11 2 17 7 30 6 12-1 18-7 14-13-3-6-13-6-16-1-3 5 4 7 8 4M36 21c9-7 14-10 20-9 1-7 10-10 17-7 8-3 18 0 21 6 10-3 20 1 22 7 14 1 17 9 11 13-9 5-19 1-29-1-11-2-20 2-28 4"/>
  </svg>
}

function MenuIcon({name}:{name:'play'|'journal'|'settings'}){
  return <svg className="home-menu-icon" viewBox="0 0 32 32" fill="none" stroke="currentColor"
    strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {name==='play'?<path d="M9 5.5 26 16 9 26.5Z" fill="currentColor"/>
      :name==='journal'?<path d="M16 8c-4.5-4-8.7-4-13-2v20c4.7-2 9-1.3 13 1.5 4-2.8 8.3-3.5 13-1.5V6c-4.3-2-8.5-2-13 2Zm0 0v19.5M6.5 10v11.5c2.6-.5 4.5 0 6 1m13-12.5v11.5c-2.6-.5-4.5 0-6 1"/>
      :<><path d="M13 3h6l1 4 2.8 1.6 4-.9 3 5.2-2.8 3.1v3.2l2.8 3.1-3 5.2-4-.9L20 28l-1 3h-6l-1-3-2.8-1.4-4 .9-3-5.2L5 19.2V16l-2.8-3.1 3-5.2 4 .9L12 7Z" transform="translate(1 0) scale(.94)"/><circle cx="16" cy="16" r="4.5"/></>}
  </svg>
}

function Plaque(){
  const paper=useId()
  const frame='M37 4H323Q335 4 341 15Q350 16 350 24Q358 27 359 38Q358 49 350 52Q350 60 341 61Q335 72 323 72H37Q25 72 19 61Q10 60 10 52Q2 49 1 38Q2 27 10 24Q10 16 19 15Q25 4 37 4Z'
  return <svg className="home-plaque" viewBox="0 0 360 76" preserveAspectRatio="none" aria-hidden="true">
    <defs><linearGradient id={paper} x2="0" y2="1">
      <stop offset="0" stopColor="#d6a568"/><stop offset=".48" stopColor="#f6d9a4"/><stop offset="1" stopColor="#e2b575"/>
    </linearGradient></defs>
    <path d={frame} fill="#c88c45" stroke="#e9ba72" strokeWidth="2"/>
    <path d={frame} transform="translate(5 5) scale(.9722 .8684)" fill="#57321c" stroke="#774926" strokeWidth="2"/>
    <path d={frame} transform="translate(10 9) scale(.9444 .7632)" fill={`url(#${paper})`} stroke="#f8dda6" strokeWidth="2.4"/>
    <path d="M25 38l5-5 5 5-5 5zm300 0 5-5 5 5-5 5zM40 13h280M40 63h280"
      fill="none" stroke="#8c552e" opacity=".6"/>
  </svg>
}

type LockableOrientation = ScreenOrientation & { lock?: (orientation: 'landscape') => Promise<void> }

async function preferLandscape(event: MouseEvent<HTMLAnchorElement>) {
  if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey ||
    !window.matchMedia('(pointer: coarse) and (orientation: portrait)').matches) return

  const orientation = screen.orientation as LockableOrientation | undefined
  if (!orientation?.lock || !document.fullscreenEnabled) return

  const enteredFullscreen = !document.fullscreenElement
  try {
    if (enteredFullscreen) await document.documentElement.requestFullscreen()
    await orientation.lock('landscape')
  } catch {
    if (enteredFullscreen && document.fullscreenElement) {
      await document.exitFullscreen().catch(() => {})
    }
  }
}

export default function Home(){
  const {state,t}=useGame()
  const settings=useRef<HTMLDialogElement>(null)
  const toggleFullscreen=()=>{
    const request=document.fullscreenElement?document.exitFullscreen?.():document.documentElement.requestFullscreen?.()
    request?.catch(()=>{})
  }

  return <main className="museum-home" lang={state.language==='zh'?'zh-CN':state.language} aria-labelledby="home-title">
    <img className="home-backdrop" src={import.meta.env.BASE_URL+'ui/museum-home.webp'} alt="" fetchPriority="high"/>
    <div className="home-top"><LanguageSelector/></div>
    <div className="home-content">
      <div className="home-heading">
        <Pavilion/>
        <p className="home-museum">{t('homeMuseum')}<span className="home-seal" aria-hidden="true">探秘</span></p>
        <div className="home-title-line">
          <Flourish className="home-cloud home-cloud-left"/>
          <h1 id="home-title">{t('homeTitle')}</h1>
          <Flourish className="home-cloud home-cloud-right"/>
        </div>
        <p className="home-tagline">{t('homeTagline')}</p>
      </div>
      <nav className="home-menu" aria-label={t('title')}>
        <Link className="home-menu-item" to="/levels/1" onClick={preferLandscape}><Plaque/><MenuIcon name="play"/><span>{t('startGame')}</span></Link>
        <Link className="home-menu-item" to="/journal"><Plaque/><MenuIcon name="journal"/><span>{t('atlas')}</span></Link>
        <button className="home-menu-item" aria-haspopup="dialog" onClick={()=>settings.current?.showModal()}>
          <Plaque/><MenuIcon name="settings"/><span>{t('gameSettings')}</span>
        </button>
      </nav>
      <p className="home-rotate-note">{t('rotateDevice')}</p>
    </div>
    <dialog ref={settings} className="home-settings" aria-labelledby="home-settings-title"
      onClick={event=>{if(event.target===event.currentTarget)settings.current?.close()}}>
      <div className="home-settings-content">
        <h2 id="home-settings-title">{t('gameSettings')}</h2>
        <div className="home-settings-language"><span>{t('language')}</span><LanguageSelector/></div>
        {document.fullscreenEnabled&&<button className="home-settings-button" onClick={toggleFullscreen}>{t('fullscreen')}</button>}
        <button className="home-settings-button" onClick={()=>settings.current?.close()}>{t('close')}</button>
      </div>
    </dialog>
  </main>
}
