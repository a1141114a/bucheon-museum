import type {Pose} from './paintings'
/** Empty part of the end wall, beside the existing framed work. */
export const museumPortal={x:-1.65,y:1.44,z:-6.22,approachZ:-5.90,radius:2.9} as const
export const portalRevealSeconds=.85
export const portalPullSeconds=1.55
export function nearMuseumPortal(p:Pick<Pose,'x'|'z'>){
 return Number.isFinite(p.x)&&Number.isFinite(p.z)&&Math.hypot(p.x-museumPortal.x,p.z-museumPortal.approachZ)<museumPortal.radius
}

export const portalVideoUrl='ui/journey/museum-portal.mp4'
export const arrivalComicUrl='ui/journey/arrival-comic.png'

/** Full video plane height; visible doorway is approximately 3 m, base at floor level. */
export const portalFrameHeight=4.7
export function museumGuideTarget(p:Pick<Pose,'x'|'z'>){return p.z> -4.3?{x:1.1,z:-4.75}:{x:-1.35,z:-5.4}}
export function museumGuideBearing(p:Pose){const target=museumGuideTarget(p),heading=Math.atan2(-(target.x-p.x),-(target.z-p.z));return Math.atan2(Math.sin(heading-p.yaw),Math.cos(heading-p.yaw))}
