import type { Artifact, Localized } from '../types'
import storageJar from '../../museum-assets/artifacts/bcm-1072/metadata.json'
import arrowhead from '../../museum-assets/artifacts/bcm-937/metadata.json'
import placentaJars from '../../museum-assets/artifacts/bcm-exh-1659-tae/metadata.json'
import viewingStone from '../../museum-assets/artifacts/bcm-569/metadata.json'
import item1754 from '../../museum-assets/artifacts/bcm-1754/metadata.json'
import item1760 from '../../museum-assets/artifacts/bcm-1760/metadata.json'
import item1099 from '../../museum-assets/artifacts/bcm-1099/metadata.json'
import item929 from '../../museum-assets/artifacts/bcm-929/metadata.json'
import item926 from '../../museum-assets/artifacts/bcm-926/metadata.json'
import item1060 from '../../museum-assets/artifacts/bcm-1060/metadata.json'
import item1252 from '../../museum-assets/artifacts/bcm-1252/metadata.json'
import item997 from '../../museum-assets/artifacts/bcm-997/metadata.json'

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

function displayArtifact(record:typeof arrowhead | typeof placentaJars | typeof viewingStone | typeof item1754 | typeof item1760 | typeof item1099 | typeof item929 | typeof item926 | typeof item1060 | typeof item1252 | typeof item997, period:Localized, material:Localized, dimensions?:Localized):Artifact {
  const photo=record.photos[0]
  return {
    id:record.id,kind:'collection',level:2,name:record.name,museum:record.museum,period,material,dimensions,
    purpose:record.purpose,
    history:record.id==='bcm-1760'?{
      zh:record.historyAndSignificance.zh+' 模型仅近似表现蓝色铭文的版式，未复原具体文字。',
      ko:record.historyAndSignificance.ko+' 모델의 청색 명문은 배치를 근사한 것으로 실제 글자를 재현하지 않았습니다.',
      en:record.historyAndSignificance.en+' The model approximates the blue inscription layout without transcribing its text.'
    }:record.historyAndSignificance,verification:'verified',
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
  displayArtifact(item1754,
    {"zh":"韩国近代","ko":"한국 근대","en":"Modern Korea"},
    {"zh":"瓮器陶","ko":"옹기","en":"Onggi earthenware"},
    {"zh":"高 29.0 厘米","ko":"높이 29.0 cm","en":"29.0 cm high"}),
  displayArtifact(item1760,
    {"zh":"1991 年","ko":"1991년","en":"1991"},
    {"zh":"白瓷","ko":"백자","en":"White porcelain"},
    {"zh":"口径 19.5 × 最大径 39.6 × 高 34 厘米","ko":"구연부 19.5 × 최대지름 39.6 × 높이 34 cm","en":"Rim Ø 19.5 × max. Ø 39.6 × height 34 cm"}),
  displayArtifact(item1099,
    {"zh":"韩国近代","ko":"한국 근대","en":"Modern Korea"},
    {"zh":"瓮器陶","ko":"옹기","en":"Onggi earthenware"},
    {"zh":"13 × 8 厘米","ko":"13 × 8 cm","en":"13 × 8 cm"}),
  displayArtifact(item929,
    {"zh":"韩国光复以后","ko":"한국 광복 이후","en":"Korea, after liberation"},
    {"zh":"待核实","ko":"미확인","en":"Unverified"},
    {"zh":"9.2 厘米","ko":"9.2 cm","en":"9.2 cm"}),
  displayArtifact(item926,
    {"zh":"韩国光复以后","ko":"한국 광복 이후","en":"Korea, after liberation"},
    {"zh":"牛角","ko":"소뿔","en":"Cattle horn"},
    {"zh":"3 × 5 厘米","ko":"3 × 5 cm","en":"3 × 5 cm"}),
  displayArtifact(item1060,
    {"zh":"韩国光复以后","ko":"한국 광복 이후","en":"Korea, after liberation"},
    {"zh":"待核实","ko":"미확인","en":"Unverified"},
    {"zh":"24 × 24 × 24 厘米","ko":"24 × 24 × 24 cm","en":"24 × 24 × 24 cm"}),
  displayArtifact(item1252,
    {"zh":"韩国光复以后","ko":"한국 광복 이후","en":"Korea, after liberation"},
    {"zh":"馆方条目未注明","ko":"박물관 자료에 미기재","en":"Not specified in the museum record"},
    {"zh":"20 × 13.5 厘米","ko":"20 × 13.5 cm","en":"20 × 13.5 cm"}),
  displayArtifact(item997,
    {"zh":"法国，19 世纪","ko":"프랑스, 19세기","en":"France, 19th century"},
    {"zh":"不透明玻璃、珐琅、金饰","ko":"불투명 유리, 에나멜, 금장","en":"Opaque glass, enamel and gilding"},
    {"zh":"11 × 7.4 × 14 厘米","ko":"11 × 7.4 × 14 cm","en":"11 × 7.4 × 14 cm"}),
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
