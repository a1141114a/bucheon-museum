# 富川博物馆：失落的时光之谜

**부천 박물관: 잃어버린 시간의 비밀**  
**Bucheon Museum: The Secret of Lost Time**

当前版本 **0.2.0：第一关可玩练习版**。今晚范围为第一关修复流程、UI 和模型精度；第二关“展厅寻宝”和第三关“时间机关”保留路由，尚未制作。真实文物依旧必须先由用户审核再建模使用。

## 运行

推荐 Node.js 22 LTS（>=22.12）及 npm。本机使用 Node 24.22.1。

```sh
npm ci
npm run dev
npm test
npm run build
npm run preview
```

当前本机预览为 `http://127.0.0.1:5174/#/levels/1`。开发服务器停止后需重新启动；其他电脑或手机不能直接用这个回环地址访问。

本机 PATH 中没有 npm，实际可用替代命令（在本项目根目录运行）：

```powershell
node ../../work/npm-bootstrap/package/bin/npm-cli.js run dev
node ../../work/npm-bootstrap/package/bin/npm-cli.js test
node ../../work/npm-bootstrap/package/bin/npm-cli.js run build
```

上述 npm CLI 属于本机工作区辅助工具，不在源码压缩包内。其他机器正常安装 Node.js（包含 npm）后，使用标准命令即可。更多环境信息见 [ENVIRONMENT.md](docs/ENVIRONMENT.md)。

## 第一关怎么玩

1. 首次进入阅读操作说明，点击“开始修复”。
2. 点击工作台上的 3D 碎片，或底部碎片匣 A–I 按钮选择。碎片会升到罐体旁，按原尺寸悬浮，方便对照。
3. 使用左右旋转按钮或键盘 Q / E，每次旋转 90°。
4. 观察器物虚影和断面，点击对应的 3D 缺口或底部编号 1–9 尝试归位。
5. 位置和方向都正确才会吸附，显示成功反馈并获得 20 分；错误尝试不会改变修复进度。
6. 九枚碎片全部修复，额外获得 100 分并显示结算。无提示满分 280 分。

每关最多 3 次提示，每次扣 5 分。提示显示当前碎片对应的位置和所需右转次数。拖动空白处旋转观察视角，滚轮或双指缩放；相机有距离范围，不能穿过地板。墙壁和立柱在挡住工作区时会临时隐藏，转回后恢复。罐体只显示朝向镜头且未被已拼实体遮挡的待修复编号，成功归位后对应数字移除。观察过近或转动后，可点击“恢复视角”返回初始构图。

手机底部碎片和位置栏可横向滑动，主要修复按钮至少 44 px。已完成桌面浏览器的手机尺寸模拟，尚未完成真实移动设备触控与 GPU 性能验收。

进度、碎片方向、提示次数和语言自动存储在本机 localStorage；刷新可继续。旧版 v1 图鉴存档会迁移到 v2。“重新修复”只重置本关，保留图鉴和语言；“重置全部进度”位于通用页面页脚。

## UI 与素材边界

UI 按用户参考方向改成厚边框石板、木框、羊皮纸、藤蔓和有按压反馈的按钮。两张原创 UI 皮肤由内置 image_gen 生成，已放入项目，提示词及用途见 [UI_ASSETS.md](docs/UI_ASSETS.md)。没有裁切或复制参考图中的商业游戏素材。

主场景、器物及九枚碎片都是实时渲染的三维模型，不用图片伪装 3D。只有 HUD 的装饰性皮肤是二维图片，文字为可访问、可翻译的 HTML 文本，支持中文、韩语、英语。

当前器物为 **原创褐釉练习瓮**，不是富川博物馆真实馆藏复原。未经核实和授权的真实文物照片没有进入公开构建目录。真实文物获批数量仍为 0；照片许可与用户素材审核分别记录。详见 [ASSET_REVIEW.md](docs/ASSET_REVIEW.md)。

## Blender 源文件和精细模型

已使用 `D:/blender/blender.exe`（Blender 5.2.3 LTS）实际生成：

- `blender/scripts/create_restoration_vessel.py`：可重复生成九枚不等宽、不等高且断口起伏的实体碎片，保留器壁、卷口、拉坯细纹及原创釉面贴图。
- `blender/blend/restoration_vessel.blend`：可编辑源文件，贴图已打包。
- `public/models/restoration_vessel.glb`：当前第一关加载的游戏模型，约 1.72 MB。
- `blender/scripts/validate_restoration_vessel.py`：闭合网格、法线、UV、材质、贴图及 GLB 回读验证。

新模型合计 **33,738 顶点、33,912 面**，相比最初的 1,026 顶点测试器物，增加了曲面采样、器壁和断口细节。多边形数量不是质量的唯一标准，当前仍是练习器物，正式藏品需审核后重新制作。

```powershell
& 'D:/blender/blender.exe' --background --python-exit-code 1 --python blender/scripts/create_restoration_vessel.py
& 'D:/blender/blender.exe' --background --python-exit-code 1 --python blender/scripts/validate_restoration_vessel.py
```

重建会覆盖同名练习模型。原阶段的 `test_vessel.blend`、生成脚本和 GLB 仍保留作为框架测试记录。Blender 存在面向 6.0 的 `Material.use_nodes` 弃用提示，目前 5.2.3 正常导出。

## 架构

React 19、TypeScript、Vite、Three.js、React Three Fiber 9、Drei。HashRouter 保证静态 Pages 刷新不会因关卡路由而 404。

| 路径 | 职责 |
|---|---|
| `src/components/Restoration.tsx` | 第一关操作、教程、提示、结算及 UI |
| `src/components/RestorationScene.tsx` | GLB 碎片、缺口、吸附动画、工作台、灯光和相机 |
| `src/state/restoration.ts` | 碎片身份、方向、放置校验、计分、存档解析 |
| `src/state/game.ts` | 总状态、存档迁移、图鉴和关卡关系 |
| `src/components/ArtifactCard.tsx` | 藏品/练习器物名片 |
| `src/types.ts` / `src/data/artifacts.ts` | 三语藏品结构、核实、审核及图片许可 |
| `src/i18n.ts` | 中韩英文案 |
| `src/adventure.css` | 当前冒险 UI 皮肤与响应式布局 |
| `src/App.tsx` | 三关和图鉴路由、全局菜单 |
| `blender/` / `public/models/` | 脚本、可编辑源文件和游戏模型 |
| `tests/` | 修复流程、存档、积分、审核规则、翻译及基础空间边界测试 |

## 验证

30 项测试通过（含虚影过滤、场景遮挡及编号朝向测试）。已在浏览器完整通关一次：使用一次提示后获得 275 分；错误位置、错误方向、成功吸附、提示扣分、刷新续玩、结算及重新修复均已验证。另在独立测试进度验证了绕一圈观察无遮挡，以及拼合后编号立即移除。GLB 和 UI 图片在生产构建 `/museum-game/` 子路径下正常加载，实际完成一枚碎片修复。

完整验证证据、局限和下一步见 [CHAPTER1_VALIDATION.md](docs/CHAPTER1_VALIDATION.md)。旧 [VALIDATION.md](docs/VALIDATION.md) 是先前纯框架阶段的历史记录，不代表当前功能状态。

## GitHub Pages

项目仓库：[a1141114a/bucheon-museum](https://github.com/a1141114a/bucheon-museum)。GitHub Pages 已配置为使用 GitHub Actions；每次推送 main 后自动测试、构建和发布，准确状态可在 [Actions](https://github.com/a1141114a/bucheon-museum/actions) 中查看。源码保留 `package-lock.json`，不上传 `node_modules`、本机缓存或未授权参考照片。

页面地址（首次部署完成后可用）：[在线试玩](https://a1141114a.github.io/bucheon-museum/#/levels/1)。当前内容为第一关练习版，后两关尚未开放。

默认 `base: './'`。CI 使用 `/<仓库名>/`；自定义域名或 `<owner>.github.io` 根站点请改为 `/`。本次也实际验证了 `/museum-game/` 子路径。

仓库 Settings → Pages → Source 选择 GitHub Actions。推送 `main` 或手动触发工作流后，先测试、构建，再部署 `dist/`。PR 只做测试构建。若采用子目录布局，需修改工作流工作目录、lockfile 和产物路径。

## 接下来的协作

今晚先体验第一关的修复逻辑、操作方式和 UI 风格，再根据共同反馈打磨。第二、第三关后续分别推进；不自动定时执行。真实文物候选资料包由用户审核，通过后再建模并替换练习模型。真实照片还需独立确认公开使用许可。
