import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import { useGame } from '../state/GameProvider'
import { statusOf } from '../state/game'
import { canModelCollection, canPublishPhoto, storageJarArtifact } from '../data/artifacts'
import type { Artifact } from '../types'
import './artifact-model.css'
import './artifact-ledger.css'
import ArtifactFrameMotion from './ArtifactFrameMotion'

const ArtifactModelViewer = lazy(() => import('./ArtifactModelViewer'))

export function ArtifactCard({artifact,onClose}:{artifact:Artifact;onClose:()=>void}) {
  const {state,dispatch,t}=useGame(); const dialog=useRef<HTMLDialogElement>(null)
  const [showModel, setShowModel] = useState(false)
  const [photoFailed, setPhotoFailed] = useState(false)
  const status=statusOf(state,artifact.id)
  const modelUrl = artifact.kind === 'test' || canModelCollection(artifact) ? artifact.model.url : null
  const photoUrl = canPublishPhoto(artifact) ? artifact.photo.url : null
  const showPhoto = Boolean(photoUrl && !photoFailed)
  const previewUrl = modelUrl && (artifact.id === storageJarArtifact.id || artifact.level === 2)
    ? import.meta.env.BASE_URL + `models/${artifact.id}-preview.png`
    : null
  useEffect(()=>{
    const previous=document.activeElement as HTMLElement|null
    const element=dialog.current; element?.showModal()
    return ()=>{element?.close();previous?.focus()}
  },[])
  return <dialog ref={dialog} className="artifact-dialog exhibit-card artifact-ledger" onCancel={onClose} onClick={e=>{if(e.target===e.currentTarget)onClose()}} aria-labelledby="artifact-title">
    <ArtifactFrameMotion/>
    <div className="ledger-safe-area">
      <div className="ledger-topline">
        <span className="status">{t(status)}</span>
        <div className="card-actions">
          <div className="languages carved-switch" role="group" aria-label="Language">{(['zh', 'ko', 'en'] as const).map((language) =>
            <button type="button" key={language} lang={language} aria-pressed={state.language === language} onClick={() => dispatch({type:'language', language})}>
              {{zh:'中文', ko:'한국어', en:'EN'}[language]}
            </button>
          )}</div>
          <button type="button" className="ledger-close" autoFocus onClick={onClose} aria-label={t('close')}>×</button>
        </div>
      </div>
      <div className="ledger-scroll">
        <div className="ledger-columns">
          <section className="ledger-display" aria-labelledby="artifact-title">
            <div className="ledger-identity">
            <h2 id="artifact-title">{artifact.name[state.language]}</h2>
            <p className="multilingual">
              {(['zh', 'ko', 'en'] as const).filter(language => language !== state.language).map((language, index) => (
                <span key={language} lang={language}>{index > 0 && ' / '}{artifact.name[language]}</span>
              ))}
            </p>
            </div>
            <figure className="exhibit-photo ledger-photo">
              <div className="ledger-image-slot">
                {showModel && modelUrl
                  ? <Suspense fallback={<p role="status">{t('loadingModel')}</p>}>
                      <ArtifactModelViewer url={import.meta.env.BASE_URL + modelUrl} label={t('viewModel')} error={t('modelUnavailable')} loading={t('loadingModel')}/>
                    </Suspense>
                  : showPhoto && photoUrl
                    ? <img src={photoUrl} alt={artifact.name[state.language]} referrerPolicy="no-referrer" onError={()=>setPhotoFailed(true)}/>
                    : previewUrl
                      ? <img src={previewUrl} alt={`${artifact.name[state.language]} · ${t('modelPreview')}`} width={840} height={840}/>
                      : <p>{t('noPhoto')}</p>}
              </div>
              <figcaption>
                <span>{showModel ? t('viewModel') : !showPhoto && previewUrl ? t('modelPreview') : artifact.museum?.[state.language] ?? artifact.photo.credit}</span>
                {artifact.photo.sourceUrl&&<a className="artifact-source-link" href={artifact.photo.sourceUrl} target="_blank" rel="noreferrer">{t('officialPhoto')} ↗</a>}
              </figcaption>
            </figure>
            {modelUrl&&<div className="ledger-model-actions">
              <button type="button" className="ledger-button" aria-expanded={showModel} onClick={() => setShowModel(!showModel)}>{t(showModel ? 'hideModel' : 'viewModel')}</button>
              {showModel&&<p className="ledger-note">{t('modelControls')}{artifact.model.accuracy==='approximate'&&<> · {t('reconstructionNote')}</>}</p>}
            </div>}
          </section>
          <section className="ledger-information">
            <dl>{(['museum','period','material','dimensions','purpose'] as const).map(field=>artifact[field]&&<div key={field}><dt>{t(field)}</dt><dd>{artifact[field][state.language]}</dd></div>)}</dl>
            <section className="ledger-history"><h3>{t('history')}</h3><p>{artifact.history[state.language]}</p></section>
            <section className="ledger-sources"><h3>{t('sources')}</h3>{artifact.sources.length?artifact.sources.map(s=><p key={s.url}><a className="artifact-source-link" href={s.url} target="_blank" rel="noreferrer">{s.title} ↗</a></p>):<p>{t('noSources')}</p>}</section>
            {status==='discovered'&&<button type="button" className="ledger-button ledger-save" onClick={()=>dispatch({type:'unlock',id:artifact.id})}>{t('save')} <span aria-hidden="true">↗</span></button>}
          </section>
        </div>
      </div>
    </div>
  </dialog>
}
