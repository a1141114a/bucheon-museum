import type { Artifact } from '../types'
import storageJar from '../../museum-assets/artifacts/bcm-1072/metadata.json'

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

export const artifacts: Artifact[] = [storageJarArtifact]

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
