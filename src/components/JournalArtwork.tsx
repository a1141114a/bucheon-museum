import {useState} from 'react'
import {canModelCollection,canPublishPhoto} from '../data/artifacts'
import {useGame} from '../state/GameProvider'
import type {Artifact} from '../types'
import './journal-artwork.css'

/** Only mounted for an unlocked entry. Unreviewed photos are never published. */
export default function JournalArtwork({artifact}:{artifact:Artifact}) {
  const {state,t}=useGame()
  const [photoFailed,setPhotoFailed]=useState(false)
  const [previewFailed,setPreviewFailed]=useState(false)
  const photo=canPublishPhoto(artifact)&&!photoFailed?artifact.photo.url:null
  const preview=canModelCollection(artifact)&&artifact.model.url&&!previewFailed
    ?import.meta.env.BASE_URL+`models/${artifact.id}-preview.png`:null
  const url=photo||preview
  if(!url)return <div className="journal-symbol">◇</div>
  const label=photo?artifact.photo.credit||artifact.museum?.[state.language]:t('modelPreview')
  return <div className="journal-artwork">
    <img src={url} alt={`${artifact.name[state.language]}${label?' · '+label:''}`} width={840} height={840}
      loading="lazy" decoding="async" referrerPolicy="no-referrer"
      onError={()=>{if(photo)setPhotoFailed(true);else setPreviewFailed(true)}}/>
    {label&&<span className="journal-artwork-caption">{label}</span>}
  </div>
}

