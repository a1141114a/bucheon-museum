import { useEffect, useRef } from 'react'
import { useGame } from '../state/GameProvider'
import { statusOf } from '../state/game'
import { canPublishPhoto } from '../data/artifacts'
import type { Artifact } from '../types'
export function ArtifactCard({artifact,onClose}:{artifact:Artifact;onClose:()=>void}) {
  const {state,dispatch,t}=useGame(); const dialog=useRef<HTMLDialogElement>(null)
  const status=statusOf(state,artifact.id)
  useEffect(()=>{
    const previous=document.activeElement as HTMLElement|null
    const element=dialog.current; element?.showModal()
    return ()=>{element?.close();previous?.focus()}
  },[])
  return <dialog ref={dialog} className="artifact-dialog" onCancel={onClose} onClick={e=>{if(e.target===e.currentTarget)onClose()}} aria-labelledby="artifact-title">
    <div className="card-top"><span className="eyebrow">{t('testBadge')}</span><button onClick={onClose} aria-label={t('close')}>×</button></div>
    <div className="photo-placeholder">{canPublishPhoto(artifact)?<figure><img src={artifact.photo.url!} alt={artifact.name[state.language]}/><figcaption>{artifact.photo.credit}</figcaption></figure>:<><span className="photo-symbol">◇</span><p>{t('noPhoto')}</p></>}</div>
    <div className="card-content"><span className="status">{t(status)}</span><h2 id="artifact-title">{artifact.name[state.language]}</h2>
      <p className="multilingual">{Object.entries(artifact.name).filter(([lang])=>lang!==state.language).map(([,name])=>name).join(' / ')}</p>
      <dl>{(['period','material','purpose','history'] as const).map(field=><div key={field}><dt>{t(field)}</dt><dd>{artifact[field][state.language]}</dd></div>)}</dl>
      <h3>{t('sources')}</h3>{artifact.sources.length?artifact.sources.map(s=><p key={s.url}><a href={s.url} target="_blank" rel="noreferrer">{s.title}</a></p>):<p className="muted">{t('noSources')}</p>}
      {status==='discovered'&&<button className="primary wide" onClick={()=>dispatch({type:'unlock',id:artifact.id})}>{t('save')} <span>↗</span></button>}
    </div>
  </dialog>
}
