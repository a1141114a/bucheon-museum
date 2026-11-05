import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import { useGame } from '../state/GameProvider'
import { statusOf } from '../state/game'
import { canModelCollection, canPublishPhoto } from '../data/artifacts'
import type { Artifact } from '../types'
import './artifact-model.css'

const ArtifactModelViewer = lazy(() => import('./ArtifactModelViewer'))

export function ArtifactCard({artifact,onClose}:{artifact:Artifact;onClose:()=>void}) {
  const {state,dispatch,t}=useGame(); const dialog=useRef<HTMLDialogElement>(null)
  const [showModel, setShowModel] = useState(false)
  const [photoFailed, setPhotoFailed] = useState(false)
  const status=statusOf(state,artifact.id)
  const modelUrl = artifact.kind === 'test' || canModelCollection(artifact) ? artifact.model.url : null
  // The museum-hosted reference is visible during local review while reuse permission is pending.
  const photoUrl = canPublishPhoto(artifact) ? artifact.photo.url : import.meta.env.DEV ? artifact.photo.sourceUrl : null
  useEffect(()=>{
    const previous=document.activeElement as HTMLElement|null
    const element=dialog.current; element?.showModal()
    return ()=>{element?.close();previous?.focus()}
  },[])
  return <dialog ref={dialog} className="artifact-dialog exhibit-card" onCancel={onClose} onClick={e=>{if(e.target===e.currentTarget)onClose()}} aria-labelledby="artifact-title">
    <div className="card-top">
      <span className="eyebrow"><span aria-hidden="true">◆</span> {t(artifact.kind === 'test' ? 'testBadge' : 'atlas')}</span>
      <div className="card-actions">
        <div className="languages carved-switch" role="group" aria-label="Language">{(['zh', 'ko', 'en'] as const).map((language) =>
          <button key={language} lang={language} aria-pressed={state.language === language} onClick={() => dispatch({type:'language', language})}>
            {{zh:'中文', ko:'한국어', en:'EN'}[language]}
          </button>
        )}</div>
        <button className="carved-button card-close" onClick={onClose} aria-label={t('close')}>×</button>
      </div>
    </div>
    <div className="card-content"><span className="status">{t(status)}</span><h2 id="artifact-title">{artifact.name[state.language]}</h2>
      <p className="multilingual">{Object.entries(artifact.name).filter(([lang])=>lang!==state.language).map(([,name])=>name).join(' / ')}</p>
      <figure className="exhibit-photo">
        {photoUrl&&!photoFailed
          ? <img src={photoUrl} alt={artifact.name[state.language]} referrerPolicy="no-referrer" onError={()=>setPhotoFailed(true)}/>
          : <p>{t('noPhoto')}</p>}
        {(artifact.photo.credit||artifact.photo.sourceUrl)&&<figcaption>
          <span>{artifact.museum?.[state.language] ?? artifact.photo.credit}</span>
          {artifact.photo.sourceUrl&&<a className="artifact-source-link" href={artifact.photo.sourceUrl} target="_blank" rel="noreferrer">{t('officialPhoto')} ↗</a>}
        </figcaption>}
      </figure>
      {modelUrl && <div className="artifact-model-section">
        <button className="primary" aria-expanded={showModel} onClick={() => setShowModel(!showModel)}>
          {t(showModel ? 'hideModel' : 'viewModel')}
        </button>
        {showModel && <>
          <p className="muted">{t('modelControls')}</p>
          {artifact.model.accuracy==='approximate'&&<p className="muted">{t('reconstructionNote')}</p>}
          <Suspense fallback={<p role="status">{t('loadingModel')}</p>}>
            <ArtifactModelViewer url={import.meta.env.BASE_URL + modelUrl} label={t('viewModel')} error={t('modelUnavailable')} loading={t('loadingModel')}/>
          </Suspense>
        </>}
      </div>}
      <dl>{(['museum','period','material','dimensions','purpose','history'] as const).map(field=>artifact[field]&&<div key={field}><dt>{t(field)}</dt><dd>{artifact[field][state.language]}</dd></div>)}</dl>
      <h3>{t('sources')}</h3>{artifact.sources.length?artifact.sources.map(s=><p key={s.url}><a className="artifact-source-link" href={s.url} target="_blank" rel="noreferrer">{s.title} ↗</a></p>):<p className="muted">{t('noSources')}</p>}
      {status==='discovered'&&<button className="primary wide" onClick={()=>dispatch({type:'unlock',id:artifact.id})}>{t('save')} <span>↗</span></button>}
    </div>
  </dialog>
}
