import type { Artifact } from '../types'

// Deliberately no real collection entries until item-level verification.
export const artifacts: Artifact[] = [{
  id: 'test-vessel', kind: 'test', level: 1,
  name: { zh: '褐釉练习瓮 · 原创游戏器物', ko: '갈색 유약 연습용 항아리 · 독자 제작', en: 'Amber-glazed practice vessel · original game prop' },
  period: { zh: '不适用（测试模型）', ko: '해당 없음 (테스트 모델)', en: 'Not applicable (test model)' },
  material: { zh: '数字陶土、原创釉面材质（三维练习模型）', ko: '디지털 점토 및 독자 제작 유약 재질 (3D 연습 모델)', en: 'Digital clay and original glaze material (3D practice model)' },
  purpose: { zh: '验证三维渲染与点击交互', ko: '3D 렌더링 및 클릭 상호작용 검증', en: 'Validate 3D rendering and picking' },
  history: { zh: '原创技术测试形体，不是富川博物馆藏品复原。尚未接入经过核实及授权的真实藏品资料。', ko: '독자적인 기술 테스트 형태이며 부천시박물관 소장품의 복원품이 아닙니다. 검증 및 사용 허가를 받은 소장품 자료는 아직 연결되지 않았습니다.', en: 'An original technical test form, not a replica of a Bucheon Museum object. Verified collection records and licensed photographs have not been connected yet.' },
  verification: 'test-only', sources: [],
  review: { status: 'not-required-test', approvedAt: null, evidence: null },
  photo: { url: null, sourceUrl: null, rights: 'pending', credit: '', licenseEvidence: null },
  model: { url: 'models/restoration_vessel.glb?layout=irregular-v2', provenance: 'blender', accuracy: 'not-a-replica' },
}]

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
