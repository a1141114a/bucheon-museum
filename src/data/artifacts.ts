import type { Artifact, Localized } from '../types'
import storageJar from '../../museum-assets/artifacts/bcm-1072/metadata.json'
import arrowhead from '../../museum-assets/artifacts/bcm-937/metadata.json'
import placentaJars from '../../museum-assets/artifacts/bcm-exh-1659-tae/metadata.json'
import viewingStone from '../../museum-assets/artifacts/bcm-569/metadata.json'

export const storageJarArtifact = {
  id: storageJar.id, kind: 'collection', level: 1,
  name: storageJar.name,
  museum: storageJar.museum,
  dimensions: { zh: '17 × 42.5 厘米', ko: '17 × 42.5 cm', en: '17 × 42.5 cm' },
  period: { zh: '年代未详', ko: '시대 미상', en: 'Date unknown' },
  material: { zh: '陶器（瓮器）', ko: '질그릇(옹기)', en: 'Earthenware (onggi)' },
  purpose: storageJar.purpose,
  history: storageJar.historyAndSignificance,
  verification: 'verified',
  sources: storageJar.sources.map(({title, url, checkedOn}) => ({title, url, accessedAt: checkedOn})),
  review: { status: 'approved', approvedAt: storageJar.review.approvedAt, evidence: 'User selected the jar and requested its use in chapter one.' },
  photo: { url: null, sourceUrl: storageJar.photos[0].originalUrl, rights: 'pending', credit: storageJar.photos[0].publisher, licenseEvidence: null },
  model: { url: 'models/bcm-1072-storage-jar.glb', provenance: 'blender', accuracy: 'approximate' },
} satisfies Artifact

function displayArtifact(record:typeof arrowhead | typeof placentaJars | typeof viewingStone, period:Localized, material:Localized):Artifact {
  const photo=record.photos[0]
  return {
    id:record.id,kind:'collection',level:2,name:record.name,museum:record.museum,period,material,
    purpose:record.purpose,history:record.historyAndSignificance,verification:'verified',
    sources:record.sources.map(({title,url,checkedOn})=>({title,url,accessedAt:checkedOn})),
    review:{status:'approved',approvedAt:record.review.approvedAt,
      evidence:'User approved the independent model and requested distinct modeled exhibits in chapter two display cases.'},
    photo:{url:null,sourceUrl:photo.originalUrl,rights:'pending',credit:photo.publisher,licenseEvidence:null},
    model:{url:`models/${record.id}-exhibit.glb`,provenance:'blender',accuracy:'approximate'},
  }
}

export const artifacts: Artifact[] = [
  storageJarArtifact,
  displayArtifact(arrowhead,
    {zh:'青铜时代',ko:'청동기 시대',en:'Bronze Age'},
    {zh:'青铜',ko:'청동',en:'Bronze'}),
  displayArtifact(placentaJars,
    {zh:'推定为朝鲜王朝中期',ko:'조선 중기 추정',en:'Attributed to the middle Joseon period'},
    {zh:'白瓷',ko:'백자',en:'White porcelain'}),
  displayArtifact(viewingStone,
    {zh:'岩石形成年代未详；2004 年捐赠入藏',ko:'암석의 형성 시기는 미상이며 2004년 기증됨',en:'Formation date unknown; donated in 2004'},
    {zh:'球粒状流纹岩',ko:'구과상 유문암',en:'Spherulitic rhyolite'}),
]

export function canPublishPhoto(artifact: Artifact): boolean {
  return artifact.kind === 'collection' && artifact.verification === 'verified'
    && artifact.review.status === 'approved' && Boolean(artifact.review.approvedAt && artifact.review.evidence)
    && artifact.photo.rights === 'authorized' && Boolean(artifact.photo.url && artifact.photo.sourceUrl && artifact.photo.licenseEvidence)
}

// Modeling and game integration require explicit user approval of real objects.
export function canModelCollection(artifact: Artifact): boolean {
  return artifact.kind === 'collection' && artifact.verification === 'verified'
    && artifact.review.status === 'approved' && Boolean(artifact.review.approvedAt && artifact.review.evidence)
}
