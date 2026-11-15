# 现代博物馆真实藏品替换

日期：2026-11-15。用户批准951、941、978开始建模，并要求场景中示意器物全部改为真实馆藏。

## 展示与证据

保留已核实的991、986、990、988四件画框作品，新增以下12件展示；每件模型与名牌均导出artifactId，点击进入统一资料卡。来源为馆方单件目录，原图许可保持pending；未把下载照片投射到模型。细花纹、隐蔽部分为手工近似，非扫描复刻。展示高度不是实物测绘尺寸。

|编号|藏品|官方资料|
|---|---|---|
|bcm-951|皇家伍斯特《日本风钱纹花瓶》|[官方条目](https://www.bcmuseum.or.kr/ko/collection/951/view)|
|bcm-941|塞夫勒《和平花瓶》|[官方条目](https://www.bcmuseum.or.kr/ko/collection/941/view)|
|bcm-978|迈森花卉餐具组|[官方条目](https://www.bcmuseum.or.kr/ko/collection/978/view)|
|bcm-985|赫伦德《印度花》小咖啡杯|[官方条目](https://www.bcmuseum.or.kr/ko/collection/985/view)|
|bcm-994|巴卡拉向日葵花瓶|[官方条目](https://www.bcmuseum.or.kr/ko/collection/994/view)|
|bcm-995|勒格拉葡萄藤花瓶|[官方条目](https://www.bcmuseum.or.kr/ko/collection/995/view)|
|bcm-993|拉利克酒红玫瑰花瓶|[官方条目](https://www.bcmuseum.or.kr/ko/collection/993/view)|
|bcm-992|埃米尔·加莱红花花瓶|[官方条目](https://www.bcmuseum.or.kr/ko/collection/992/view)|
|bcm-997|带埃米尔·加莱签名的玻璃杯|[官方条目](https://www.bcmuseum.or.kr/ko/collection/997/view)|
|bcm-996|穆勒《中国山水》花瓶|[官方条目](https://www.bcmuseum.or.kr/ko/collection/996/view)|
|bcm-957|帝国皇冠双耳花瓶|[官方条目](https://www.bcmuseum.or.kr/ko/collection/957/view)|
|bcm-1000|迈森历代标记瓷盘框|[官方条目](https://www.bcmuseum.or.kr/ko/collection/1000/view)|

951与941的器形与实景主柜对应。978是经批准的替换餐具，**不是**照片中尚未确认身份的青花餐具。同样，其余藏品的新位置为游戏陈列安排，不声称馆内原位陈列。

移除原示意花瓶、杯盘、烛台、餐具、果盘与花枝等；保留建筑、柜体、玻璃、桌布、家具与照明。新三件附可编辑源文件和独立预览；建模脚本支持单件重生成。

## 文件与重建

- `blender/scripts/create_museum_real_exhibits.py`：951、941、978的真实3D建模。
- `blender/blend/museum-real-exhibits/`、`public/models/museum-real-exhibits/`：三件实际生成的.blend与.glb。
- `blender/scripts/replace_museum_exhibits.py`：器物移除、导入、陈列和真实名称名牌。
- `blender/scripts/create_modern_bucheon_museum.py`：全展厅生成入口，先精细化设施，再安装已批准器物。
- `blender/blend/modern-museum/european-porcelain-passage.blend`：可编辑完整展厅。
- `public/models/modern-museum/european-porcelain-passage-v3.glb`：当前网页模型。
- `museum-assets/batches/museum-real-exhibits-2026-11-15.json`：三语卡片、官方尺寸原值、审批证据与版权状态。
- `src/data/museumExhibits.ts`：16件可点击展品注册表。资料库仍有30件，标明其中8件在现代展厅使用；不改原17件游戏计分图鉴。

运行：`blender --background --factory-startup --python blender/scripts/create_museum_real_exhibits.py`，再运行 `create_modern_bucheon_museum.py`；Blender 5.2.3，依赖项目的建模公共工具。

## 实际验证

类型检查、72项测试、VITE_BASE_PATH=/bucheon-museum/的生产构建通过。三个单件源文件与完整展厅源文件重新打开成功。GLB结构测试检查16个身份完整、示意器物节点已移除、新资产真实存在。

Chromium以独立测试存档逐一点击16件展品，标题均与编号相符，并检查手机及iPad名片；Chromium/WebKit复核6组视口（320×568至1440×900）、中韩英三语、移动、旅途回顾与刷新完成状态。另复核真实拖动转向后的画作点击与触摸摇杆。检查不等同于每台真实iPad的帧率测试。
