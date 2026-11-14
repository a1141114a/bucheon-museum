import type {Language} from '../types'
export const paintingNames=[
 ['青花梦境','청화의 꿈','Porcelain Reverie'],
 ['静谧圣堂','고요한 성당','The Quiet Cathedral'],
 ['鎏金沙龙','황금빛 살롱','The Gilded Salon'],
 ['晨光圣殿','새벽빛 성전','Sanctuary of Dawn'],
 ['蓝金之夜','푸른 황금의 밤','A Night in Blue and Gold'],
] as const
// Rectangular bounds retain every original frame; never extract a subject silhouette.
export const paintingCrops=[[.096,.094,.808,.810],[.282,.058,.437,.885],[.086,.090,.824,.826],[.106,.096,.787,.804],[.082,.094,.836,.822]] as const
export const paintingText={
 title:['画境之门','그림 속으로','Beyond the Frame'],
 guide:['旅途指引','여정 안내','Journey guide'],
 intro:['寻找下一幅画作，将它带到地面的金色圆纹处。面向预设画框，举起画作并对齐，然后走入画中。','다음 그림을 찾아 바닥의 금빛 문양으로 가져가세요. 지정된 액자를 바라보고 그림을 들어 맞춘 뒤, 그림 안으로 걸어가세요.','Find the next artwork and carry it to the golden floor mark. Face the fixed frame, raise and align the artwork, then walk through.'],
 controls:['WASD / 方向键移动 · 拖动画面转向 · E 互动。触屏：左侧摇杆移动，拖动画面转向。','WASD / 방향키 이동 · 화면 드래그 시점 · E 상호작용. 터치: 왼쪽 스틱 이동, 화면 드래그 시점.','WASD / arrows to move · drag to look · E to interact. Touch: left joystick to move, drag the scene to look.'],
 free:['没有计时、计分或尝试次数限制。进度自动保存。','시간·점수·시도 횟수 제한이 없습니다. 진행은 자동 저장됩니다.','No timer, score or attempt limit. Progress saves automatically.'],
 find:['寻找下一幅画作','다음 그림 찾기','Find the next artwork'],
 take:['拾取画作','그림 줍기','Collect artwork'],
 carry:['画作已携带 · 前往金色地面标记','그림을 들고 금빛 바닥 표시로 이동하세요','Artwork collected · find the golden floor mark'],
 raise:['举起画作','그림 들기','Raise artwork'],
 lower:['放下查看','그림 내리기','Lower artwork'],
 align:['站在金色圆纹处，正对画框，调整视角使两框重合。','금빛 문양 위에서 액자를 정면으로 바라보며 두 테두리를 맞추세요.','Stand on the golden mark and face the frame. Adjust your view until the frames align.'],
 place:['对齐并放置','맞추어 놓기','Align & place'],
 walk:['画境已展开 · 向前走入画框','그림 속 공간이 열렸습니다 · 앞으로 걸어가세요','The world has unfolded · walk through the frame'],
 enter:['走入画境','그림 속으로 입장','Enter the artwork'],
 reveal:['画作正在化为立体空间…','그림이 입체 공간으로 펼쳐집니다…','The artwork is unfolding into space…'],
 loading:['正在准备画境…','그림 속 공간 준비 중…','Preparing the artwork world…'],
 keyFind:['寻找最终之门的钥匙','마지막 문의 열쇠 찾기','Find the key to the final door'],
 keyTake:['拾取钥匙','열쇠 줍기','Collect key'],
 keyCarry:['钥匙已找到 · 前往最终之门','열쇠를 찾았습니다 · 마지막 문으로 가세요','Key found · reach the final door'],
 open:['打开最终之门','마지막 문 열기','Open the final door'],
 finish:['旅途在此完整','여정의 완성','The Journey Is Whole'],
 ending:['你穿过了五幅画作，让失落的时光再次相连。','다섯 그림을 지나 잃어버린 시간을 다시 이었습니다.','You crossed five artworks and reconnected the lost moments.'],
 restart:['重新探索画境','그림 여정 다시 시작','Explore again'],
 confirm:['重新开始第三章？前两章及藏品图鉴会保留。','3장을 다시 시작할까요? 앞의 두 장과 도감은 유지됩니다.','Restart Chapter 3? Chapters 1–2 and your collection will be kept.'],
 home:['返回主页','홈으로','Return home'],
 back:['前往第二关的发光画作','2장의 빛나는 그림으로','Find the glowing artwork in Chapter 2'],
 entryNote:['宝箱开启后，展厅后方的画作将发光。靠近它，走入第三章。','보물상자를 연 뒤 전시장 뒤쪽 그림이 빛납니다. 가까이 가서 3장으로 들어가세요.','After opening the chest, a painting glows at the back of the hall. Approach it to enter Chapter 3.'],
 info:['查看原作','원작 보기','View the original'],
 source:['玩家提供的原作参考；藏品的正式题名、年代、作者与来源尚待核实。场景名称为游戏章节名称。展件完整保留原作、衬底及原始画框的正面图像，并建有实体背板、侧壁和外层框线；不再将画中人物抠成浮雕。它是带框展示模型，并非实物扫描或人物雕塑。','사용자가 제공한 원작 참고 이미지입니다. 정식 명칭·연대·작가·출처는 확인 중이며 공간명은 게임의 장 제목입니다. 전시 모델은 작품과 바탕, 원래 액자의 정면 이미지를 온전히 보존하고 입체 뒷판·측면·외곽 몰딩을 갖춥니다. 인물 실루엣 부조나 실물 스캔이 아닌 액자형 전시 모델입니다.','Original reference supplied by the player. Official title, date, creator and source remain unverified. World names are game chapter titles. The display preserves the whole artwork, mount and original frame image, with a solid backing, side walls and outer mouldings. It is a framed display model, not an extracted figure relief or a scan.'],
 close:['关闭','닫기','Close'],
 locked:['先完成第二关的金币拼图。','먼저 2장의 금화 퍼즐을 완성하세요.','Complete the Chapter 2 coin puzzle first.'],
} as const
export function paintingCopy(language:Language,key:keyof typeof paintingText){return paintingText[key][language==='zh'?0:language==='ko'?1:2]}
export function worldName(language:Language,index:number){return paintingNames[index][language==='zh'?0:language==='ko'?1:2]}
export const worldAsset=(file:string)=>`${import.meta.env.BASE_URL}models/painting-worlds-v2/${file}.glb`
export const artPhoto=(index:number)=>`${import.meta.env.BASE_URL}paintings/art-${index+1}.jpg`

