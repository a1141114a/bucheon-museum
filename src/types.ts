export type Language = 'zh' | 'ko' | 'en'
export type Localized = Record<Language, string>
export type ArtifactStatus = 'locked' | 'discovered' | 'unlocked'
export type LevelId = 1 | 2 | 3
export interface Artifact {
  id: string
  kind: 'test' | 'collection'
  level: LevelId
  name: Localized
  museum?: Localized
  dimensions?: Localized
  period: Localized
  material: Localized
  purpose: Localized
  history: Localized
  verification: 'test-only' | 'pending' | 'verified'
  review: { status: 'not-required-test' | 'pending' | 'approved' | 'rejected'; approvedAt: string | null; evidence: string | null }
  sources: { title: string; url: string; accessedAt?: string }[]
  photo: { url: string | null; sourceUrl: string | null; previewUrl?: string | null; rights: 'pending' | 'authorized'; credit: string; licenseEvidence: string | null }
  model: { url: string | null; provenance: 'procedural-test' | 'blender'; accuracy: 'not-a-replica' | 'pending' | 'reviewed' | 'approximate' }
}
