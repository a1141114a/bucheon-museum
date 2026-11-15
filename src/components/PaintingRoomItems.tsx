import {useThree} from '@react-three/fiber'
import {artworkPositions,type PaintingProgress} from '../state/paintings'
import {ArtFrame} from './ArtPortal'
import {Model} from './PaintingWorld'
/** Shared by the playable room and its window view, avoiding prop pop-in. */
export default function PaintingRoomItems({room,progress,onTake}:{room:number;progress:PaintingProgress;onTake?:()=>void}){
 const {camera}=useThree(),point=artworkPositions[room],next=room+1
 if(room===4)return !progress.key?<group position={[point[0],1.4,point[1]]} name="final-key" onClick={onTake?e=>{if(e.delta<6){e.stopPropagation();onTake()}}:undefined}><Model file="key" scale={1.2}/><pointLight color="#ffd16a" intensity={5} distance={3}/></group>:null
 return !progress.found.includes(next)?<group position={[point[0],0,point[1]]} name="next-artwork" onClick={onTake?e=>{if(e.delta<6&&camera.position.distanceTo(e.point)<3){e.stopPropagation();onTake()}}:undefined}><Model file="lectern"/><ArtFrame index={next} height={.68} position={[0,1.45,0]}/><pointLight position={[0,1.5,.4]} intensity={3} color="#ffd182" distance={3}/></group>:null
}

