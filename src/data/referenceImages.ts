import {canModelCollection,canPublishPhoto} from './artifacts'
import type {Artifact} from '../types'

const officialPhotoHosts=new Set(['www.bcmuseum.or.kr','bcmuseum.or.kr','news.bucheon.go.kr'])

/** The user requested external official reference images in the comparison
 * section on 2026-11-13. This does not assert or change a copyright license.
 * Existing card/photo-publication rules remain unchanged. */
export function museumReferencePhotoUrl(artifact:Artifact):string|null {
  if(!canModelCollection(artifact))return null
  if(canPublishPhoto(artifact))return artifact.photo.url
  if(!artifact.photo.sourceUrl)return null
  try {
    const url=new URL(artifact.photo.sourceUrl)
    return url.protocol==='https:'&&officialPhotoHosts.has(url.hostname)?url.href:null
  } catch {return null}
}

export function museumReferencePhotoCandidates(artifact:Artifact):string[]{
  const original=museumReferencePhotoUrl(artifact)
  if(!original)return []
  const urls=[original]
  if(artifact.photo.previewUrl){
    const preview=museumReferencePhotoUrl({...artifact,photo:{...artifact.photo,url:null,sourceUrl:artifact.photo.previewUrl}})
    if(preview&&!urls.includes(preview))urls.push(preview)
  }
  return urls
}
