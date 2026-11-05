# 真实藏品审核流程

2026-11-05 的审核材料在 [候选清单](../museum-assets/sources.md) 和 [数据索引](../museum-assets/artifacts-index.json)。清单有 18 项，其中传统储藏瓮、独立青铜箭镞、新生翁主胎罐、向日葵纹观赏石进入首批独立建模。

1. 按 `bcm-数字` 提交选择结果。候选的唯一 ID、三语资料、照片来源和建模疑点记录在各自的 `metadata.json`。
2. 对所选器物核对照片轮廓、尺寸和看不见的部分，记录同意日期及审核证据。真实藏品建模需要逐件确认。
3. 实物照片的公开使用范围单独核实，记录摄影者、权利人、许可链接或书面证据。原站阅览和图片再发布分别处理。
4. 审核材料在 `museum-assets/`，与运行时 `src/data/artifacts.ts` 分开。通过审核后才按正式展品接入游戏状态、图鉴与关卡，并通过 `canModelCollection()` 和 `canPublishPhoto()` 检查。

可编辑源文件、模型路径、性能目标和还原精度的约定见 [建模记录](../museum-assets/modeling-report.md)。
