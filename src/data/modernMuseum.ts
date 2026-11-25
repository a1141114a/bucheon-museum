import type {Language} from '../types'
export const modernMuseumModel='models/modern-museum/european-porcelain-passage-v3.glb'
const copy={
 title:['现代 · 富川市立博物馆','현재 · 부천시립박물관','The present · Bucheon City Museum'],
 place:['统合馆 2F · 欧洲瓷器展厅','통합관 2층 · 유럽자기전시실','Integrated Hall 2F · European Porcelain Gallery'],
 welcome:['你回到了现代。曾经走入的画作，如今安静地陈列在真实展厅中。','현재로 돌아왔습니다. 지나온 그림들이 이제 실제 전시실에 조용히 놓여 있습니다.','You have returned to the present. The artworks you entered now rest quietly in the gallery.'],
 controls:['WASD／方向键或摇杆移动，拖动画面转向。点击展品或画框可查看馆藏介绍。','WASD·방향키 또는 스틱으로 이동하고 화면을 드래그해 둘러보세요. 전시품이나 액자를 누르면 소개를 볼 수 있습니다.','Move with WASD, arrows or the joystick; drag to look. Click an exhibit or framed work to read its introduction.'],
 ending:['旅途在此完整','여정의 완성','The Journey Is Whole'],
 introTitle:['旅程起点 · 现代展厅','여정의 시작 · 현재 전시실','The beginning · Present-day gallery'],
 introNote:['自由参观，向展厅尽端的墙面走近。进入传送门后开始新一轮冒险，保留已收藏藏品。','자유롭게 둘러보고 전시실 끝 벽으로 다가가세요. 포털에 들어가면 새 여정을 시작하며 수집품은 유지됩니다.','Explore freely and approach the far wall. The portal begins a new journey while keeping your collection.'],
 portalReveal:['墙面出现了时光裂隙…','벽에 시간의 균열이 나타납니다…','A rift in time appears in the wall…'],
 portalPull:['你被吸入了时光之中…','시간의 틈으로 빨려 들어갑니다…','You are drawn into the rift in time…'],
 comicTitle:['穿越时光 · 冒险开始','시간을 넘어 · 모험의 시작','Through time · The adventure begins'],
 comicNote:['你穿过了时光裂隙，来到一座神秘的博物馆。','시간의 균열을 지나 신비로운 박물관에 도착했습니다.','You crossed the rift in time and arrived at a mysterious museum.'],
 comicContinue:['开始冒险','모험 시작','Begin adventure'],
 comicLoading:['正在展开时光漫画…','시간 여행 만화를 불러옵니다…','Opening the time-travel comic…'],
 comicError:['漫画暂未加载，可重试或继续冒险。','만화를 불러오지 못했습니다. 다시 시도하거나 계속할 수 있습니다.','The comic could not load. Retry or continue your adventure.'],
 comicRetry:['重新加载漫画','만화 다시 불러오기','Reload comic'],
 guideTitle:['寻找时光裂隙','시간의 균열 찾기','Find the time rift'],
 guideForward:['沿过道向前，走到展厅尽端。','통로를 따라 전시실 끝까지 앞으로 가세요.','Follow the aisle to the far end of the gallery.'],
 guideWall:['到尽端后看向左侧空白墙面，继续靠近，传送门就会出现。','끝에서 왼쪽 빈 벽을 바라보고 다가가면 포털이 나타납니다.','At the far end, turn toward the blank wall on the left. Approach it to reveal the portal.'],
 guideHide:['收起指引','안내 접기','Hide guide'],
 guideShow:['展开指引','안내 펼치기','Show guide'],
 guideDistance:['下一处指引','다음 안내 지점','Next guide point'],
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
