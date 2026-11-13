import {lazy,Suspense,useEffect,useRef,useState} from 'react'
import {Link} from 'react-router-dom'
import {artifacts,canModelCollection} from '../data/artifacts'
import {museumReferencePhotoCandidates} from '../data/referenceImages'
import {useGame} from '../state/GameProvider'
import {statusOf} from '../state/game'
import type {Artifact,Language} from '../types'
import './journal-comparison.css'

const ModelViewer=lazy(()=>import('./ArtifactModelViewer'))

/** Only the two closest visible models own WebGL contexts. Other rows retain
 * their model renders, so browsing a full collection does not exhaust iPad GPU
 * contexts. Scrolling activates a real 3D view automatically, without a card. */
function useVisibleModels(ids:string[]){
  const root=useRef<HTMLElement>(null)
  const [active,setActive]=useState<string[]>([])
  const signature=ids.join('|')
  useEffect(()=>{
    const tiles=Array.from(root.current?.querySelectorAll<HTMLElement>('[data-model-tile]')??[])
    if(!('IntersectionObserver' in window)){setActive(ids.slice(0,2));return}
    const visible=new Set<Element>()
    const update=()=>{
      const next=[...visible].sort((a,b)=>Math.abs(a.getBoundingClientRect().top+a.clientHeight/2-window.innerHeight/2)-Math.abs(b.getBoundingClientRect().top+b.clientHeight/2-window.innerHeight/2))
        .slice(0,2).map(el=>(el as HTMLElement).dataset.modelTile!)
      setActive(current=>current.join('|')===next.join('|')?current:next)
    }
    const observer=new IntersectionObserver(entries=>{
      for(const entry of entries){if(entry.isIntersecting)visible.add(entry.target);else visible.delete(entry.target)}
      update()
    },{rootMargin:'60px 0px',threshold:[0,.15,.5,1]})
    tiles.forEach(tile=>observer.observe(tile))
    window.addEventListener('resize',update)
    return ()=>{observer.disconnect();window.removeEventListener('resize',update)}
  },[signature])
  return {root,active}
}

function MuseumPhoto({artifact}:{artifact:Artifact}){
  const {state,t}=useGame(),[photoIndex,setPhotoIndex]=useState(0)
  const photos=museumReferencePhotoCandidates(artifact),photo=photos[photoIndex]
  return <figure className="comparison-figure">
    <figcaption className="comparison-media-title">{t('journalMuseumPhoto')}</figcaption>
    <div className="comparison-photo">
      {photo?<img src={photo} alt={artifact.name[state.language]+' · '+t('journalMuseumPhoto')}
        loading="lazy" decoding="async" referrerPolicy="no-referrer" width={1000} height={1000}
        onError={()=>setPhotoIndex(index=>index+1)}/>:<p className="comparison-placeholder">{t('journalPhotoUnavailable')}</p>}
    </div>
    <div className="comparison-media-note">
      <span>{artifact.photo.credit||artifact.museum?.[state.language]}</span>
      {artifact.photo.rights==='pending'&&<small>{t('journalPhotoRightsPending')}</small>}
      {artifact.photo.sourceUrl&&<a href={photo||artifact.photo.sourceUrl} target="_blank" rel="noreferrer">{t('officialPhoto')} ↗</a>}
    </div>
  </figure>
}

function ComparisonModel({artifact,active}:{artifact:Artifact;active:boolean}){
  const {state,t}=useGame(),[failed,setFailed]=useState(false)
  const model=canModelCollection(artifact)?artifact.model.url:null
  const preview=import.meta.env.BASE_URL+`models/${artifact.id}-preview.png`
  return <figure className="comparison-figure">
    <figcaption className="comparison-media-title">{t('journalModel')}</figcaption>
    <div className="comparison-model" data-model-tile={artifact.id}>
      {!failed&&<img className="comparison-model-preview" src={preview} alt={artifact.name[state.language]+' · '+t('modelPreview')}
        loading="lazy" decoding="async" width={840} height={840} onError={()=>setFailed(true)}/>}
      {active&&model&&<div className="comparison-live-model"><Suspense fallback={<span className="comparison-loading" role="status">{t('loadingModel')}</span>}>
        <ModelViewer url={import.meta.env.BASE_URL+model} label={artifact.name[state.language]+' · '+t('journalModel')}
          error={t('modelUnavailable')} loading={t('loadingModel')} inline/>
      </Suspense></div>}
      {!model&&<p className="comparison-placeholder">{t('modelUnavailable')}</p>}
    </div>
    <div className="comparison-media-note"><span>{t('journalModelControls')}</span><small>{t('reconstructionNote')}</small></div>
  </figure>
}

export default function JournalComparison(){
  const {state,t}=useGame()
  const available=artifacts.filter(a=>statusOf(state,a.id)!=='locked'&&canModelCollection(a))
  const {root,active}=useVisibleModels(available.map(a=>a.id))
  return <section ref={root} className="journal-comparison" aria-labelledby="journal-comparison-title">
    <div className="comparison-section-heading"><div><h2 id="journal-comparison-title">{t('journalCompareTitle')}</h2></div>
      <span className="comparison-count">{t('journalCompareCount')} <strong>{available.length} / {artifacts.length}</strong></span></div>
    <p className="comparison-intro">{t('journalCompareIntro')}</p>
    {!available.length?<div className="comparison-empty"><p>{t('journalCompareEmpty')}</p><Link className="carved-button" to="/levels/1">{t('l1')} →</Link></div>
    :<div className="comparison-list">{available.map(artifact=>{
      const status=statusOf(state,artifact.id)
      return <article className="comparison-exhibit" key={artifact.id} data-artifact-id={artifact.id} aria-label={artifact.name[state.language]}>
        <div className="comparison-exhibit-heading"><div><span className="comparison-id">{artifact.id}</span><h3>{artifact.name[state.language]}</h3>
          <p className="comparison-other-names">{(['zh','ko','en'] as Language[]).filter(lang=>lang!==state.language).map((lang,i)=><span key={lang} lang={lang}>{i>0?' / ':''}{artifact.name[lang]}</span>)}</p></div>
          <span className="status">{t(status)}</span></div>
        <div className="comparison-body">
          <div className="comparison-media"><MuseumPhoto artifact={artifact}/><ComparisonModel artifact={artifact} active={active.includes(artifact.id)}/></div>
          <div className="comparison-information">
            <dl>{(['museum','period','material','dimensions','purpose'] as const).map(field=>artifact[field]&&<div key={field}><dt>{t(field)}</dt><dd>{artifact[field][state.language]}</dd></div>)}</dl>
            <section><h4>{t('history')}</h4><p>{artifact.history[state.language]}</p></section>
            <section className="comparison-sources"><h4>{t('sources')}</h4>{artifact.sources.map(source=><a key={source.url} href={source.url} target="_blank" rel="noreferrer">{source.title} ↗</a>)}</section>
          </div>
        </div>
      </article>
    })}</div>}
  </section>
}

