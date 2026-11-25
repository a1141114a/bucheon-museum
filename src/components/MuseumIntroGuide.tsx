import {useState} from 'react'
import {useGame} from '../state/GameProvider'
import {museumText} from '../data/modernMuseum'
import {museumGuideBearing,museumGuideTarget} from '../state/museumJourney'
import type {Pose} from '../state/paintings'
export default function MuseumIntroGuide({pose}:{pose:Pose}){
 const {state}=useGame(),txt=(key:Parameters<typeof museumText>[1])=>museumText(state.language,key),[open,setOpen]=useState(true),target=museumGuideTarget(pose)
 return <div className="museum-intro-guide">
  <div className="museum-guide-heading"><strong>{txt('guideTitle')}</strong><button className="stone-button" aria-expanded={open} aria-controls="museum-guide-steps" onClick={()=>setOpen(v=>!v)}>{txt(open?'guideHide':'guideShow')}</button></div>
  <div className="museum-guide-compass"><span className="museum-guide-arrow" aria-hidden="true" style={{transform:`rotate(${-museumGuideBearing(pose)}rad)`}}>↑</span><span>{txt('guideDistance')} · {Math.max(1,Math.ceil(Math.hypot(pose.x-target.x,pose.z-target.z)))} m</span></div>
  <ol id="museum-guide-steps" hidden={!open}><li className={pose.z> -4.3?'is-current':'is-done'}>{txt('guideForward')}</li><li className={pose.z<=-4.3?'is-current':''}>{txt('guideWall')}</li></ol>
 </div>
}
