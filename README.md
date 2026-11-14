# 富川博物馆：失落的时光之谜

부천 박물관: 잃어버린 시간의 비밀 · Bucheon Museum: The Secret of Lost Time

[打开游戏主页](https://a1141114a.github.io/bucheon-museum/) · [GitHub Actions](https://github.com/a1141114a/bucheon-museum/actions)

React、TypeScript、Vite、Three.js、React Three Fiber、Drei 实时 3D 网页游戏，提供中文、韩语、英语。HashRouter 支持 GitHub Pages 子路径及刷新。

## 运行与部署

推荐 Node.js 22.12 或更新版本，安装时包含 npm。

```sh
npm ci
npm run dev
npm test
npm run build
npm run preview
```

`npm run dev` 输出的本机地址只用于本机预览。分享请使用上方的 GitHub Pages 链接。`main` 更新后 Actions 自动测试、构建和部署；CI 使用 `VITE_BASE_PATH=/bucheon-museum/`，本机默认相对路径。

## 当前三个章节

1. **瓮器修复**：点击真实 3D 碎片选择，使用两个旋转按钮或 Q / E 旋转，再点击罐体虚影的对应缺口拼合。底部字母和数字按键已取消。修复完成播放光效和动态结算卡。左上任务说明可以收起。
2. **展厅寻宝**：探索展柜、查看藏品介绍，靠近后点击藏品背后的三枚金币拾取。中央宝箱的金币滑块拼图完成后，宝箱打开并喷出金币。后墙第一幅画作发光，靠近后点击“走入画境”进入第三章。
3. **画境之门**：依次探索青花庭院、哥特教堂、金色沙龙、晨光圣殿、蓝金宫廷五个三维空间。前四个空间各藏有下一幅画作。拾取后到金色地面圆纹处，正对预设画框，举起、对齐、放置，再向前走入实时展开的空间。最后寻找钥匙、打开最终之门，结束旅程。没有计时、计分或尝试次数限制，也不能自由改造空间。

第三章的场景名称是游戏章节名，并非已核实的藏品正式题名。原作信息入口保留完整参考图，并明确注明尚待核实的资料。入口立体展品采用有实际厚度、封闭背面及原作投影的高浮雕；深度和背面是艺术化推定，不是扫描得到的完整圆雕。

桌面：WASD / 方向键移动，拖动画面转向，第三章可按 E 互动。手机与 iPad：左侧摇杆移动、拖动画面转向；按钮可完成拾取、举起、放置、入画和开门。网页不会强制锁定横屏。

进度自动存储在当前浏览器的 localStorage。第三章刷新后回到当前画境入口，保留已拾取、已放置和钥匙状态。重新探索只重置第三章。旧齿轮关的通关与分数不迁移为新画境通关；前两章及图鉴收藏保留。浏览器清理网站数据会删除本机进度。

## 图鉴与素材

藏品状态为 locked / discovered / unlocked。图鉴提供收藏卡片和原图 / 3D 对照分区；对照随已发现和已解锁记录更新。馆方原图、官方入口、已有核实资料和许可状态沿用项目数据记录。图鉴按可见范围加载模型，避免同时建立大量 WebGL 上下文。

真实藏品必须先经用户审核再建模；缺少核实的信息不得补编。本次五幅画作及五组环境素材由用户指定用于第三章。具体素材映射、建模方式与限制见 [画境实现记录](docs/PAINTING_CHAPTER.md)。

## Blender 源文件

第三章新增两份可重复执行的 `bpy` 脚本：

```sh
blender --background --factory-startup --python blender/scripts/create_painting_worlds.py
blender --background --factory-startup --python blender/scripts/create_painting_props.py
```

- `blender/blend/painting-worlds/world-1.blend` 至 `world-5.blend`：五个可编辑场景，原始贴图已打包。
- 同目录 `portal-frame.blend`、`lectern.blend`、`key.blend`：画框、画架和钥匙。
- `public/models/painting-worlds/room-1.glb` 至 `room-5.glb`：游戏场景模型。
- 同目录 `sculpture-1.glb` 至 `sculpture-5.glb`：独立入口高浮雕。
- 同目录 `portal-frame.glb`、`lectern.glb`、`key.glb`：公共交互模型。
- `environment-assets/painting-worlds/source/atlas-1.png` 至 `atlas-5.png`：原始材质集合图。
- `public/paintings/art-1.jpg` 至 `art-5.jpg`：用户提供的原作参考，文件未改写。

建模脚本会覆盖同名输出。请先复制需要手工修改的 `.blend`；Blender 的 Open 打开 `.blend`，Import → glTF 2.0 打开 `.glb`。其他已完成章节的原始脚本、模型及文档继续保留。

## 主要代码

| 路径 | 职责 |
|---|---|
| `src/components/Restoration.tsx` | 第一章修复与 UI |
| `src/components/GalleryHunt.tsx` / `GalleryScene.tsx` | 第二章寻宝与后墙入口 |
| `src/components/PhotoChamber.tsx` / `PaintingScene.tsx` | 第三章流程、UI、场景调度 |
| `src/components/ArtPortal.tsx` | 原作、实时目标场景窗口、连续穿越合成 |
| `src/components/PaintingWorld.tsx` / `PaintingWalk.tsx` | 模型、灯光、移动、边界与资源释放 |
| `src/state/paintings.ts` / `game.ts` | 对齐、接近判定、进度与旧存档迁移 |
| `src/data/paintingWorlds.ts` | 三语画境文案与素材映射 |
| `src/components/ArtifactCard.tsx` / `Journal.tsx` | 藏品名片及图鉴 |

旧 `TimeScene.tsx`、时间齿轮模型和相关文档作为历史资源保留，不再被第三章路由加载；旧时间机关动作已停用。

## 验证

本次类型检查、54 项自动测试、生产构建通过。隔离浏览器进度完成第二章入口 → 四次拾画 / 对齐 / 穿越 → 第五画境钥匙与最终门 → 刷新与重新探索。另检查五种窗口尺寸的中韩英排版、桌面键盘、WebKit 触屏摇杆与原作信息窗。

这些是桌面浏览器和 WebKit 引擎的自动化检查，不等于所有真实手机 / iPad 的性能验收。Three.js 生产包保留大体积渲染依赖的构建提示；画境按当前与相邻场景加载，离开后释放模型资源。
