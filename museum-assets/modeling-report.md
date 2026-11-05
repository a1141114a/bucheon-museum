# 藏品建模与游戏接入记录

## 本轮状态

现有项目用 React、TypeScript、Vite、Three.js、React Three Fiber 和 Drei。第一关是原创瓮器修复，第二关是展厅寻宝，第三关是时间机关。第一关可玩，后两关目前为待开放页面。藏品审核数据放在独立目录，游戏运行时仍使用 `src/data/artifacts.ts` 的原创练习瓮记录。

首批制作四项独立复原模型。纹理由脚本生成，馆方与市方照片用作外观参考。独立模型存放在此目录的 `artifacts/`。展位与用途等用户另行指定。

| 模型 | 预览 | 参考与补全 |
|---|---|---|
| 传统储藏瓮 | [PNG](artifacts/bcm-1072/preview.png) | 按馆照重建双耳、暖色口肩、深腹与纹带。暂以 42.5 cm 为高度、17 cm 为口径参考，腹径、内腔和背面近似。 |
| 独立青铜箭镞 | [PNG](artifacts/bcm-937/preview.png) | 取馆照上排左起第三枚。5.0 cm 为模型估计总长，馆方只公布全组范围。厚度和背面近似。 |
| 新生翁主胎罐 | [PNG](artifacts/bcm-exh-1659-tae/preview.png) | 依据富川市展照制作内外罐和可单独移动的盖。外罐暂高约 30 cm，尺寸、背面耳孔及内壁近似。 |
| 向日葵纹观赏石 | [PNG](artifacts/bcm-569/preview.png) | 正面重绘浅色放射纤维、深色同心环与外围矿带。颜色和模拟细微起伏的法线贴图均内嵌于模型。背侧形状近似。 |

每个目录包含 `model.blend`、`model.glb`、`preview.png`、`metadata.json` 与 `model-stats.json`。GLB 使用米、Y-up，贴图内嵌，只导出藏品网格。`.blend` 同时保留可编辑模型和预览灯光。

使用 Blender 5.2.3 LTS 运行共享的 [生成脚本](generate_model.py)，最后一个参数是项目 ID。

```powershell
blender -b -t 6 --python generate_model.py -- bcm-1072
```

## 后续按件交付

- 在 `artifacts/<id>/` 补齐 `generate_model.py`、`model.blend`、`model.glb` 和 `preview.png`。按需建立 `images/`、`textures/`。实物照片取得相应许可后再保存至项目。
- Blender 以米为单位。以器物底面中心设原点并统一正面。GLB 导出为 glTF Y-up，检查 UV、法线、材质和真实比例。游戏模型放在 `public/models/`，目录资料记录其运行时路径。
- 陶器优先用旋转体，工具以挤出、曲线和基本几何为主，观赏石优先用低面数网格。普通模型目标约 3,000–10,000 个三角面，简单陶器和工具尽量低于 3,000 个。以导出后测量的实际面数与体积为准。
- 对照原图逐项区分可见细节、馆方文字记录和补全推测。反面、底面及不可见内腔分别记录。预览图注明为 3D 模型渲染。
- 接入时复用现有图鉴、交互状态和三语信息卡。批准后按现有关卡玩法安排展位，再测试接近、悬停、点击、拖动、双指缩放、资源路径和手机性能。
