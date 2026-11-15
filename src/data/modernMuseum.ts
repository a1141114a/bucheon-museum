import type {Language} from '../types'
export const modernMuseumModel='models/modern-museum/european-porcelain-passage.glb'
const copy={
 title:['现代 · 富川市立博物馆','현재 · 부천시립박물관','The present · Bucheon City Museum'],
 place:['统合馆 2F · 欧洲瓷器展厅（局部复原）','통합관 2층 · 유럽자기전시실 (부분 재현)','Integrated Hall 2F · European Porcelain Gallery (partial reconstruction)'],
 welcome:['你回到了现代。曾经走入的画作，如今安静地陈列在真实展厅中。','현재로 돌아왔습니다. 지나온 그림들이 이제 실제 전시실에 조용히 놓여 있습니다.','You have returned to the present. The artworks you entered now rest quietly in the gallery.'],
 about:['展厅与复刻依据','전시실과 재현 근거','About this reconstruction'],
 history:['富川市立博物馆在2021年整合、迁建后重新开放，设有瓮器、乡土历史、教育、欧洲瓷器及观赏石等展区。这里选取统合馆二楼欧洲瓷器展厅中，玻璃展柜与餐厅情境展柜之间的一段过道。','부천시립박물관은 여러 박물관을 통합·이전하여 2021년 재개관했습니다. 옹기·향토역사·교육·유럽자기·수석 전시를 갖추고 있습니다. 이 공간은 통합관 2층 유럽자기전시실의 유리 진열장과 다이닝룸 전시 사이 통로 일부를 재현했습니다.','Bucheon City Museum reopened in 2021 following integration and relocation. Its displays cover onggi, local history, education, European porcelain and viewing stones. This scene reconstructs a passage beside the glass showcases and dining-room display in the Integrated Hall’s second-floor European Porcelain Gallery.'],
 evidence:['依据馆方公开的多角度实景照片与展区示意建模。木地板、蓝粉色展墙、玻璃柜和轨道灯按照片还原；未取得测绘尺寸，距离与隐蔽结构为估算。环境中的花瓶、餐具纹样和镜面反射作了简化，不冒称单件藏品的精确模型。','공식 다각도 사진과 안내도를 참고했습니다. 나무 바닥·청색과 분홍색 벽·유리장·트랙 조명을 재현했지만 실측 치수는 없어 거리와 보이지 않는 구조는 추정입니다. 주변 꽃병·식기 문양·거울은 단순화했으며 개별 소장품의 정밀 복제품으로 표시하지 않습니다.','Based on official photographs and the gallery guide. Wood flooring, blue and rose display walls, glass cases and track lighting follow the photographs. Dimensions and concealed construction are estimated. Context vases, tableware patterns and mirror reflections are simplified, rather than presented as precise individual collection replicas.'],
 controls:['WASD／方向键或摇杆移动，拖动画面转向。点击画框可查看作品介绍。','WASD·방향키 또는 스틱으로 이동하고 화면을 드래그해 둘러보세요. 액자를 누르면 작품 소개를 볼 수 있습니다.','Move with WASD, arrows or the joystick; drag to look. Click a framed work to read its introduction.'],
 ending:['旅途在此完整','여정의 완성','The Journey Is Whole'],
 recap:['旅途回顾','여정 돌아보기','Journey recap'],
 close:['继续参观','계속 관람','Continue exploring'],
 source:['馆方实景与导览 ↗','공식 전시 사진과 안내 ↗','Official gallery photographs ↗'],
 city:['市政府博物馆介绍 ↗','부천시 박물관 소개 ↗','City museum introduction ↗'],
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
