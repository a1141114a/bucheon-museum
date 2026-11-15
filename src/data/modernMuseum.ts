import type {Language} from '../types'
export const modernMuseumModel='models/modern-museum/european-porcelain-passage-v2.glb'
const copy={
 title:['现代 · 富川市立博物馆','현재 · 부천시립박물관','The present · Bucheon City Museum'],
 place:['统合馆 2F · 欧洲瓷器展厅','통합관 2층 · 유럽자기전시실','Integrated Hall 2F · European Porcelain Gallery'],
 welcome:['你回到了现代。曾经走入的画作，如今安静地陈列在真实展厅中。','현재로 돌아왔습니다. 지나온 그림들이 이제 실제 전시실에 조용히 놓여 있습니다.','You have returned to the present. The artworks you entered now rest quietly in the gallery.'],
 controls:['WASD／方向键或摇杆移动，拖动画面转向。点击画框可查看作品介绍。','WASD·방향키 또는 스틱으로 이동하고 화면을 드래그해 둘러보세요. 액자를 누르면 작품 소개를 볼 수 있습니다.','Move with WASD, arrows or the joystick; drag to look. Click a framed work to read its introduction.'],
 ending:['旅途在此完整','여정의 완성','The Journey Is Whole'],
 recap:['旅途回顾','여정 돌아보기','Journey recap'],
 close:['继续参观','계속 관람','Continue exploring'],
 source:['馆方实景与导览 ↗','공식 전시 사진과 안내 ↗','Official gallery photographs ↗'],
 city:['博物馆介绍 ↗','부천시 박물관 소개 ↗','City museum introduction ↗'],
 home:['返回主页','홈으로','Return home'],
 restart:['重新探索画境','그림 여정 다시 시작','Explore the paintings again'],
 loading:['正在进入现代博物馆…','현재의 박물관으로 들어갑니다…','Entering the present-day museum…'],
 transition:['穿越最终之门，回到现代…','마지막 문을 지나 현재로 돌아갑니다…','Through the final door, back to the present…'],
} as const
export function museumText(lang:Language,key:keyof typeof copy){return copy[key][lang==='zh'?0:lang==='ko'?1:2]}
export function museumWalkable(_room:number,x:number,z:number){
 if(!Number.isFinite(x)||!Number.isFinite(z)||x< -1.53||x>2.12||z< -5.95||z>5.97)return false
 return ![[-.30,2.2],[-.45,-3.25]].some(([cx,cz])=>Math.abs(x-cx)<.65&&Math.abs(z-cz)<.65)
}
