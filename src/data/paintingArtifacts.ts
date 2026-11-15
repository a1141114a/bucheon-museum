import type {Artifact,Localized} from '../types'
const l=(zh:string,ko:string,en:string):Localized=>({zh,ko,en})
export const paintingArtifactIds=['bcm-991','bcm-990','bcm-989','bcm-988','bcm-986'] as const
const records=[
 {
  id:991,image:1321,name:l('迈森《拇指姑娘》','마이센 「엄지공주」','Meissen: Thumbelina'),maker:l('迈森（馆方标注）','마이센 (박물관 표기)','Meissen (museum attribution)'),
  period:l('德国，20 世纪','독일, 20세기','Germany, 20th century'),dimensions:'59.0 × 59.0 cm',
  material:l('陶瓷画板；画框材质未注明','도자기 화판, 액자 재질 미기재','Ceramic plaque; frame material not specified'),
  purpose:l('带框装饰性画板，以童话题材供观赏','동화 주제를 감상하는 장식용 화판 액자','Framed decorative plaque illustrating a fairy tale'),
  history:l('馆方确认其题材取自安徒生童话《拇指姑娘》，以迈森具有代表性的蓝色表现花中的主人公。原作还可见飞燕、花叶和青蛙等叙事细节。\n\n馆方将其置于欧洲陶瓷画板传统中介绍：从18世纪中叶起，这类画板曾作为建筑、家具和盒匣等的装饰。这个传统的起点不等于本件的制作年代；本件登记为20世纪。个人设计者、画师及具体制作年份未注明。',
   '박물관은 안데르센의 동화 「엄지공주」를 소재로, 마이센 특유의 푸른 색으로 꽃 속 주인공을 표현한 작품이라고 설명한다. 원작에는 제비와 꽃, 개구리 등 이야기의 세부도 보인다.\n\n18세기 중엽부터 건축·가구·케이스 장식에 사용된 도자기 화판의 전통과 연결된다. 이는 이 작품의 제작연대가 아니며, 등록 연대는 20세기다. 개인 디자이너·화가와 제작연도는 미기재다.',
   'The museum identifies Andersen’s Thumbelina as the subject, with the heroine inside a flower rendered in Meissen blue. Swallows, flowers and a frog add narrative details visible in the original.\n\nThe museum places it within the tradition of ceramic plaques used to decorate buildings, furniture and cases from the mid-eighteenth century. That historical starting point is not this object’s date: its record says twentieth century. No individual designer, painter or exact year is named.'),
 },
 {
  id:990,image:1320,name:l('KPM《玛利亚与圣婴》','KPM 「마리아와 아기 예수」','KPM: Mary and the Infant Jesus'),maker:l('柏林皇家瓷器制造所 KPM（馆方标注）','베를린왕립도자기 KPM (박물관 표기)','Royal Porcelain Manufactory Berlin, KPM (museum attribution)'),
  period:l('德国，19 世纪','독일, 19세기','Germany, 19th century'),dimensions:'59.0 × 114.0 cm',
  material:l('陶瓷画板；哥特式内部框架及外框材质未注明','도자기 화판, 고딕 양식 프레임 등의 재질 미기재','Ceramic plaque; Gothic surround and outer-frame materials not specified'),
  purpose:l('基督教宗教题材的带框装饰画板','그리스도교 성화를 담은 장식용 화판','Framed decorative plaque with a Christian devotional subject'),
  history:l('馆方描述玛利亚怀抱圣婴，坐在铺有织物的座椅上，下方配以枝叶和果实；画板的哥特式教堂框架强化了庄严的宗教氛围。\n\n馆方将本件归入KPM陶瓷画板。官网提到该制造机构曾描绘欧洲名画及人物题材，这是工艺背景，不能据此把伦勃朗或拉斐尔认定为本件作者。本件个人画师、原画归属及具体制作年份均待核实。',
   '박물관은 아기 예수를 안은 마리아가 직물을 깐 의자에 앉고, 아래에 나뭇가지와 과일이 놓인 성화라고 설명한다. 고딕 양식의 교회 프레임은 경건한 분위기를 더한다.\n\nKPM 도자기 화판으로 소개된다. 박물관이 KPM의 일반적인 명화 재현 전통을 언급하지만, 이를 근거로 이 작품을 렘브란트나 라파엘로의 작품이라고 단정할 수 없다. 개인 화가·원화의 귀속·정확한 제작연도는 미확인이다.',
   'The museum describes Mary holding the infant Jesus on a textile-covered seat, with branches and fruit below. A Gothic church-like surround reinforces the devotional setting.\n\nThe record identifies it as a KPM ceramic plaque. Its discussion of KPM reproducing European paintings is general background, not an attribution of this object to Rembrandt or Raphael. The individual painter, source painting and exact production year remain unverified.'),
 },
 {
  id:989,image:1319,name:l('KPM《美丽的劳拉》','KPM 「아름다운 로라」','KPM: Beautiful Laura'),maker:l('柏林皇家瓷器制造所 KPM（馆方标注）','베를린왕립도자기 KPM (박물관 표기)','Royal Porcelain Manufactory Berlin, KPM (museum attribution)'),
  period:l('德国，19 世纪','독일, 19세기','Germany, 19th century'),dimensions:'64.0 × 64.0 cm',
  material:l('陶瓷画板；外框材质未注明','도자기 화판, 액자 재질 미기재','Ceramic plaque; frame material not specified'),
  purpose:l('女性肖像题材的带框观赏画板','여성 초상을 담은 장식용 화판','Framed decorative portrait plaque'),
  history:l('官网以《美丽的劳拉》为题，描述了一位拥有金色波浪长发的贵妇。原作将侧面人物肖像与圆形瓷面、金彩纹饰及方形外框组合，展示陶瓷画板的装饰表现力。\n\n馆方把它归入19世纪德国KPM作品。这里保留官网正式题名，不把照片题签上的英文说明替换为未经核实的作者或原画名称。人物身份、个人画师和具体制作年份尚未由该条目说明。',
   '공식 제목은 「아름다운 로라」이며, 박물관은 금빛 물결 머리카락이 인상적인 귀부인을 표현했다고 설명한다. 측면 초상, 둥근 도자기 면과 금채 장식, 사각 액자가 결합되어 있다.\n\n등록 정보는 독일 19세기의 KPM 작품이다. 사진 명패의 영문 설명과 구별하여 공식 제목을 사용한다. 인물의 신원, 개인 화가와 정확한 제작연도는 해당 자료에 미기재다.',
   'The official title is Beautiful Laura. The museum describes a noblewoman distinguished by golden, wavy hair. The profile portrait, round ceramic field, gilded ornament and square outer frame create a layered decorative composition.\n\nThe catalogue assigns it to KPM, Germany, nineteenth century. The official title is retained rather than treating the photograph’s English label as a verified artist or source-painting attribution. The sitter, individual painter and exact year are not specified.'),
 },
 {
  id:988,image:1318,name:l('KPM《女子习作》','KPM 「여인의 습작」','KPM: Study of a Woman'),maker:l('柏林皇家瓷器制造所 KPM（馆方标注）','베를린왕립도자기 KPM (박물관 표기)','Royal Porcelain Manufactory Berlin, KPM (museum attribution)'),
  period:l('德国，19 世纪','독일, 19세기','Germany, 19th century'),dimensions:'74.0 × 80.0 cm',
  material:l('陶瓷画板；多层外框材质未注明','도자기 화판, 다층 액자의 재질 미기재','Ceramic plaque; layered-frame materials not specified'),
  purpose:l('表现祈祷与救赎主题的观赏画板','기도와 구원의 빛을 표현한 장식용 화판','Decorative plaque with a devotional theme'),
  history:l('馆方正式题名为《女子习作》，并将画面解释为：一位正在祈祷的女性，接受来自天空的救赎之光。原作中上仰的视线、深色长发与头部周围的暖色背景形成鲜明对比。\n\n官网登记为19世纪德国KPM陶瓷画板。它与游戏“晨光圣殿”的场景名称属于不同层次：场景是艺术化演绎，不是馆方给作品的历史背景。个人作者、人物身份和精确制作年份仍待核实。',
   '공식 제목은 「여인의 습작」이다. 박물관은 기도하는 여인에게 하늘에서 구원의 빛이 내리는 장면이라고 설명한다. 위를 향한 시선과 어두운 머리카락, 머리 주변의 따뜻한 배경이 대비된다.\n\n독일 19세기의 KPM 도자기 화판으로 등록되어 있다. 게임의 공간명과 연출은 작품의 공식 역사적 배경이 아닌 예술적 해석이다. 개인 작가·인물의 신원·정확한 제작연도는 미확인이다.',
   'The museum’s title is Study of a Woman. It interprets the image as a praying woman receiving the light of salvation from above. Her upward gaze and dark hair contrast with the warm field around her head.\n\nThe record lists a nineteenth-century German KPM ceramic plaque. The game’s sanctuary setting is an artistic interpretation, not the museum’s documented historical setting. The individual artist, sitter and precise production year remain unverified.'),
 },
 {
  id:986,image:1316,name:l('迈森《一千零一夜》','마이센 「아라비안 나이트」','Meissen: Arabian Nights'),maker:l('迈森（馆方标注）','마이센 (박물관 표기)','Meissen (museum attribution)'),
  period:l('德国，20 世纪','독일, 20세기','Germany, 20th century'),dimensions:'46.3 × 47.2 cm',
  material:l('陶瓷浮雕装饰件；外框材质未注明','도자기 부조 장식품, 액자 재질 미기재','Ceramic relief ornament; frame material not specified'),
  purpose:l('以飞毯故事为题材的带框观赏装饰','하늘을 나는 양탄자를 소재로 한 액자 장식품','Framed decorative relief inspired by a flying-carpet story'),
  history:l('馆方确认作品取材自《一千零一夜》中“飞翔的地毯”意象，细致表现人物服装及随身装饰，并以浮雕形式装入画框。它具有突出的立体装饰性质，不应仅按平面油画理解。\n\n官网登记为20世纪德国迈森作品。游戏中的蓝金宫廷、喷泉和最终之门属于关卡演绎，并非该藏品的实际出土地或原始陈设环境。人物姓名、个人设计者和具体制作年份未在条目中注明。',
   '박물관은 「아라비안 나이트」의 하늘을 나는 양탄자에서 모티브를 얻어 인물의 의상과 소품을 섬세하게 표현한 도자기 부조 장식품이라고 설명한다. 부조를 액자에 넣은 작품으로, 단순한 평면 유화가 아니다.\n\n독일 20세기 마이센 작품으로 등록되어 있다. 게임의 궁전·분수·최종 문은 창작된 공간이며 실제 출토지나 원래 설치 환경을 뜻하지 않는다. 인물 이름·개인 디자이너·정확한 제작연도는 미기재다.',
   'The museum identifies the flying-carpet motif from Arabian Nights and emphasizes the detailed costumes and accessories. It is a ceramic relief mounted within a frame, rather than simply a flat oil painting.\n\nThe catalogue lists Meissen, Germany, twentieth century. The game’s palace, fountain and final door are invented settings, not its documented archaeological or original display context. The characters’ names, individual designer and precise production year are not supplied.'),
 },
]
export const paintingArtifacts:Artifact[]=records.map((r,index)=>({
 id:`bcm-${r.id}`,kind:'collection',level:3,cardStyle:'painting',name:r.name,maker:r.maker,
 creator:l('个人作者、画师未注明，待核实','개인 작가·화가 미기재, 확인 필요','Individual artist/painter not specified; unverified'),
 museum:l('富川市立博物馆 · 欧洲瓷器展厅','부천시립박물관 · 유럽자기전시실','Bucheon City Museum · European Porcelain Gallery'),
 period:r.period,material:r.material,dimensions:l(r.dimensions+'（馆方尺寸）',r.dimensions+' (박물관 표기)',r.dimensions+' (museum record)'),purpose:r.purpose,history:r.history,
 verification:'verified',review:{status:'approved',approvedAt:'2026-11-15',evidence:'User supplied these five originals for the painting worlds and requested researched cards and journal integration.'},
 sources:[{title:records[index].name.ko,url:`https://www.bcmuseum.or.kr/ko/collection/${r.id}/view`,accessedAt:'2026-11-15'}],
 photo:{url:null,sourceUrl:`https://www.bcmuseum.or.kr/comm/file/thumb?id=${r.image}`,referenceAsset:`paintings/art-${index+1}.jpg`,rights:'pending',credit:'부천시박물관 / Bucheon Museums',licenseEvidence:null},
 model:{url:`models/painting-worlds-v2/artwork-${index+1}.glb`,provenance:'blender',accuracy:'approximate'},
}))

