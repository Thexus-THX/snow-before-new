# 《雪落之前》P1C：全流程路线验收与运行稳定性清理

> 适用仓库：`https://github.com/Thexus-THX/snow-before-new.git`  
> 工作分支：`develop`  
> 本阶段性质：全流程验收 + Bug 修复 + 数据一致性检查  
> 前置条件：P1A 场景渲染底层完成；P1B 特殊场景内容接入完成  
> 本阶段不开发编辑器，不接入新美术素材，不接入新BGM/环境音/音效/配音

---

## 0. 开始前必须确认

本阶段统一以 `develop` 为最新开发分支。

开始前执行：

```bash
git fetch origin
git checkout develop
git pull origin develop
git branch --show-current
npm ci
npm run check
```

`git branch --show-current` 必须输出：

```text
develop
```

如果不是 `develop`，立即停止。

必须先阅读：

```text
PROGRESS.md
docs/00_README.md
docs/02_GAME_LOGIC.md
docs/03_STORY_BLUEPRINT.md
docs/07_DATA_SCHEMA.md

src/content/game-data.json
src/app/stores/gameStore.ts
src/engine/gameEngine.ts
src/engine/saveManager.ts
src/engine/sceneHistory.ts
src/pages/GamePage.tsx
src/pages/TitlePage.tsx
src/components/scenes/
src/components/game/
src/content/__tests__/
src/engine/__tests__/
src/app/stores/__tests__/
```

当前阶段事实：

```text
P0/P0.1 已完成：新游戏/继续游戏、版本化存档、原子选择、精确回滚、关键选择边界。
P1A 已完成：七种场景模板渲染、特殊页面、历史记录、防双击推进。
P1B 已完成：创作说明、时间说明、三封家书、卢沟桥事件、八季札记、旅程回顾接入。
当前累计 10 个测试文件、88 个测试通过。
```

---

# 1. 本阶段目标

P1C 不做新功能扩张，只做“完整可玩V1”的运行验收与修复。

目标是确认：

```text
新游戏可以从标题页一路进入剧情
创作说明 → 时间说明 → 序章 → 八季 → 家书/事件/札记 → 最终选择 → 两个结局 → 旅程回顾 → 致谢/标题
整条链路不中断、不白屏、不重复跳转
19 次有效选择数量不变
7 次关键选择数量不变
两个主结局均可到达
所有特殊场景可继续、可刷新恢复、可进入历史记录
普通选择可精确回滚
关键选择不可跨越回滚
存档、继续游戏、清除存档稳定
```

本阶段完成后，游戏应达到：

```text
“可以完整试玩、可以录演示视频、可以进行下一步音频接入”的状态。
```

---

# 2. 严格禁止事项

本阶段不要：

- 创建新 Git 分支；
- 切换到 `feat/runtime-foundation-p0` 或其他分支；
- 开发 `/editor`；
- 新增或替换任何美术素材；
- 新增或替换任何 BGM、环境音、音效、配音；
- 修改素材文件名；
- 修改 `docs/04_ART_ASSET_SPEC.md` 或 `docs/05_AUDIO_ASSET_SPEC.md`；
- 新增剧情章节；
- 新增主结局；
- 新增角色；
- 新增需要玩家选择的互动分支；
- 修改 19 次有效选择数量；
- 修改 7 次关键选择数量；
- 修改结局条件门槛；
- 重写 `gameStore`；
- 重写 `saveManager`；
- 重写 `SceneRenderer` 架构；
- 引入大型 UI 框架或动画库；
- 做移动端专用布局。

如果发现缺少美术或音频资源：

```text
不要自行新增占位资源。
不要自行生成图片/音乐。
不要改资源命名。
只在报告中列出“待用户提供素材清单”。
```

---

# 3. 全流程数据审计

新增或扩展数据审计测试，覆盖：

```text
1. 所有 scene.id 唯一
2. startSceneId 存在
3. 所有 nextSceneId 存在
4. 所有 choices[].nextSceneId 存在
5. 所有 choiceGroupId 内至少有一个 available 或 locked 可见候选
6. 所有 ending 场景可由主流程到达
7. journey_review 可由两个 ending 到达
8. thank_you 可由 journey_review 到达
9. 没有无法离开的死场景，除非明确是回到标题/终点
10. 所有特殊场景没有错误 choices/effects
11. 19 次有效选择数量不变
12. 7 次关键选择数量不变
13. 关键选择文本含有【关键选择】或数据层 critical 标记
14. 三封 letter 均有 date/salutation/pages/signature/historyPlainText
15. historicalEvent 含 date/title/paragraphs/gameplayNotice/sourceNote
16. 八个 seasonJournal 均含 visibleSummary/journalText/keepsakes
17. 所有 freeLayout 均有 elements 且元素坐标在 1920×1080 合理范围内
18. 所有 background / portraitAsset / imageAsset 路径对应 public/assets 下真实文件
19. 不存在 `undefined`、空字符串标题、空正文场景
20. 不存在 template 与 content 字段明显不匹配
```

建议新增：

```text
src/content/__tests__/fullFlowIntegrity.test.ts
src/content/__tests__/assetReferences.test.ts
```

如果已有测试覆盖相同职责，可扩展现有文件，不重复造轮子。

---

# 4. 路线模拟器测试

新增一个纯逻辑路线模拟测试，不依赖浏览器 UI。

建议文件：

```text
src/engine/__tests__/routeSimulation.test.ts
```

目标：用数据和 store/engine 逻辑模拟至少 6 条路线。

至少覆盖：

```text
路线A：高准备归国 → 《电波归途》较好变体
路线B：低准备归国 → 《电波归途》较仓促/代价变体
路线C：陈绍衡协助归国 → 归国但依赖同伴帮助
路线D：留下并支援国内 → 《异乡长灯》支援国内变体
路线E：长期研究留下 → 《异乡长灯》研究变体
路线F：混合选择/低准备 → 仍能到达一个合法结局，不白屏
```

要求：

- 不通过硬编码最终 scene id 作弊；
- 按场景 choices 选择对应选项推进；
- 遇到特殊场景自动推进；
- 遇到普通场景无选项时按 nextSceneId 推进；
- 遇到普通场景有选项时按路线策略选择；
- 若路线策略无法找到可用选项，测试应失败并输出 scene.id；
- 每条路线最多推进一定步数，例如 200 步，防止死循环；
- 每条路线最终必须进入 ending 或 thank_you 链路；
- 测试应输出或断言最终 ending 名称/场景 ID；
- 不修改生产代码逻辑来迁就测试。

如果当前结局解析机制不适合纯逻辑模拟，可以先补一个小型测试工具函数：

```text
src/engine/testUtils/routeRunner.ts
```

但不要把测试工具引入生产代码。

---

# 5. UI 运行稳定性检查

检查并修复以下问题：

```text
1. 特殊场景点击推进不重复触发
2. 家书翻页不会推进场景
3. 家书切换后页码重置
4. 历史事件页键盘推进可用
5. 季节札记页不显示隐藏数值
6. 结局页不显示 GOOD/BAD 等评价标签
7. 旅程回顾页面可继续到致谢或标题
8. 普通场景选项出现时不会被点击推进吞掉
9. 打字机显示全文时不会误推进两次
10. 关键选择二次确认框不被背景点击关闭后误提交
11. 回滚后当前场景、历史、快照、选择状态一致
12. 回滚到特殊场景时页面模板正确
13. 刷新后继续游戏能恢复当前特殊场景
14. 清除存档后继续游戏按钮置灰或安全处理
15. localStorage 损坏时不白屏
```

可新增或扩展组件测试：

```text
src/pages/__tests__/GamePage.flow.test.tsx
src/components/scenes/__tests__/SpecialSceneShell.test.tsx
src/components/game/__tests__/ChoicePanel.confirmation.test.tsx
```

测试要务实，不要求全 UI 自动化覆盖所有画面；重点覆盖容易破坏运行的交互。

---

# 6. 资源引用检查

本阶段只检查资源引用，不新增素材。

新增或扩展脚本/测试：

```text
src/content/__tests__/assetReferences.test.ts
```

检查路径：

```text
public/assets/backgrounds/
public/assets/characters/
public/assets/props/
public/assets/ui/
public/assets/audio/
```

规则：

```text
以 /assets/... 开头的路径，应对应 public/assets/... 中存在的文件
允许音频字段缺失
允许未来音频清单未接入
不允许图片路径引用不存在文件
不允许代码硬编码 public/ 前缀
```

如果发现缺失素材：

- 不要新增占位文件；
- 不要修改素材名绕过测试；
- 在报告中列清单；
- 对于已确定存在但路径写错的，允许修正 JSON 路径；
- 修正路径时必须说明。

---

# 7. 空占位类清理评估

当前 `src/engine/` 仍存在多个空占位类：

```text
conditionEvaluator.ts
effectApplier.ts
historyManager.ts
endingResolver.ts
assetResolver.ts
```

本阶段先评估，不强行删除。

要求：

```text
1. 检查是否被 import 或引用；
2. 如果完全未引用，且删除不会影响构建，可以删除；
3. 如果删除会扩大影响，则保留，并在 PROGRESS.md 标为“待清理”；
4. 不要把现有 gameEngine 逻辑拆进这些类；
5. 不要做大规模架构重构。
```

如果删除文件，必须有测试和构建通过。

---

# 8. PROGRESS.md 更新要求

完成后更新：

```text
PROGRESS.md
```

新增：

```text
### ✅ P1C 全流程路线验收与运行稳定性清理（日期）
```

写明：

```text
路线模拟覆盖数量
两个结局可达性
特殊场景恢复测试结果
资源引用检查结果
是否修改 game-data.json
是否改变选择数量：必须为否
是否改变关键选择数量：必须为否
是否改变结局条件：必须为否
测试文件数量与测试用例数量
npm run check 结果
npm run build 结果
待用户提供素材/音频清单，如有
```

---

# 9. 手动验收路线

启动：

```bash
npm run dev
```

手动至少跑两条路线：

## 路线一：归国方向

确认看到：

```text
标题页
创作说明
时间说明
序章
第一封家书
第一日春
第一日季节札记
1936秋家书
卢沟桥历史事件页
1937冬最终家书
最终选择两步结构
《电波归途》
旅程回顾
致谢/返回标题
```

## 路线二：留下方向

确认看到：

```text
标题页
创作说明
时间说明
关键选择确认
至少一次普通选择回滚
至少一次特殊场景刷新继续
《异乡长灯》
旅程回顾
致谢/返回标题
```

记录发现的问题并修复。若问题不属于本阶段范围，列为遗留风险，不要擅自扩张功能。

---

# 10. 完成命令

执行：

```bash
npm run check
npm run build
git status
git diff --stat
```

然后提交并推送：

```bash
git add .
git commit -m "完成全流程路线验收与运行稳定性清理"
git push origin develop
```

完成后停止，不进入 P2 音频系统。

---

# 11. 完成报告格式

完成后必须汇报：

```text
1. 当前分支
2. 修改文件列表
3. 新增测试文件与测试数量
4. 路线模拟覆盖结果
5. 两个结局可达性
6. 特殊场景刷新/继续/回滚验证结果
7. 资源引用检查结果
8. 是否修改 game-data.json：是/否；若是，说明原因
9. 是否改变选择数量：必须为否
10. 是否改变关键选择数量：必须为否
11. 是否改变结局条件：必须为否
12. 是否删除空占位类：是/否
13. npm run check 结果
14. npm run build 结果
15. 手动验收结果
16. 待用户提供素材/音频清单
17. Git commit hash
18. 遗留风险
```
