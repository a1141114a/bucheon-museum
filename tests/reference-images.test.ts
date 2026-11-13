import {describe,it,expect} from 'vitest'
import {artifacts,canPublishPhoto} from '../src/data/artifacts'
import {museumReferencePhotoCandidates,museumReferencePhotoUrl} from '../src/data/referenceImages'

describe('official comparison references',()=>{
  it('keeps all requested official originals and their pending license status',()=>{
    expect(artifacts).toHaveLength(12)
    for(const artifact of artifacts){
      expect(museumReferencePhotoUrl(artifact)).toBe(artifact.photo.sourceUrl)
      expect(artifact.photo.rights).toBe('pending')
      expect(canPublishPhoto(artifact)).toBe(false)
    }
  })
  it('does not expose unverified or unapproved object references',()=>{
    const a=artifacts[0]
    expect(museumReferencePhotoUrl({...a,verification:'pending'})).toBeNull()
    expect(museumReferencePhotoUrl({...a,review:{...a.review,status:'pending'}})).toBeNull()
  })
  it('rejects untrusted or insecure external image sources',()=>{
    for(const sourceUrl of ['http://www.bcmuseum.or.kr/image.jpg','https://example.com/image.jpg','javascript:alert(1)',null])
      expect(museumReferencePhotoUrl({...artifacts[0],photo:{...artifacts[0].photo,sourceUrl}})).toBeNull()
  })
  it('retains the verified museum display image when its full-size endpoint fails',()=>{
    const artifact=artifacts.find(a=>a.id==='bcm-929')!
    expect(museumReferencePhotoCandidates(artifact)).toEqual([artifact.photo.sourceUrl,artifact.photo.previewUrl])
    expect(museumReferencePhotoCandidates({...artifact,photo:{...artifact.photo,previewUrl:'https://example.com/other.jpg'}})).toEqual([artifact.photo.sourceUrl])
  })
})
