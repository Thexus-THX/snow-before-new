# 《雪落之前》P1A：统一场景渲染底层

> 适用仓库：`https://github.com/Thexus-THX/snow-before-new.git`  
> 工作分支：直接使用 `develop`，不要创建新分支  
> 本阶段性质：运行时底层开发  
> 本阶段不制作新剧情、不开发编辑器、不接入完整音频系统

---

## 0. 开始前必须确认

先执行：

```bash
git checkout develop
git pull origin develop
npm ci
npm run check
```

如果 `npm run check` 未通过，先记录原始错误，不要为了通过检查而擅自修改剧情、美术或扩大任务范围。

阅读以下文件：

```text
docs/00_README.md
docs/02_GAME_LOGIC.md
docs/03_STORY_BLUEPRINT.md
docs/04_ART_ASSET_SPEC.md
docs/05_AUDIO_ASSET_SPEC.md
docs/07_DATA_SCHEMA.md
PROGRESS.md

src/pages/GamePage.tsx
src/app/stores/gameStore.ts
src/engine/gameEngine.ts
src/engine/saveManager.ts
src/schemas/types.ts
src/schemas/gameSchema.ts
src/content/game-data.json

src/components/game/StatusBar.tsx
src/components/game/SceneArea.tsx
src/components/game/DialoguePanel.tsx
src/components/game/ChoicePanel.tsx
src/components/game/HistoryPanel.tsx

src/components/common/GameViewport.tsx
src/styles/tokens.css
src/styles/global.css
```

### 当前仓库事实

当前 `develop` 已完成 P0/P0.1：

- 新游戏与继续游戏已分离；
- `commitChoice()` 已是原子选择事务；
- 精确历史回滚和关键选择边界已实现；
- `SaveEnvelope`、旧存档迁移和损坏存档处理已实现；
- `startNewGame()` 已清除旧持久化存档；
- 自动存档已统一经过 `buildSaveEnvelope()` 与 `writeSave()`；
- Vitest 与 `npm run check` 已存在。

**本阶段不得重写或绕过上述逻辑。**

当前 Schema 已支持以下 `SceneTemplate`：

```text
standardDialogue
freeLayout
letter
chapterIntro
historicalEvent
seasonJournal
ending
```

当前 `GamePage.tsx` 仍主要按照普通场景布局渲染，没有根据 `scene.template` 完整分发，因此特殊页面无法形成真正独立的视觉与交互。

---

# 1. 本阶段目标

建立统一、可扩展、可测试的场景渲染层：

```text
GamePage
└── SceneRenderer
    ├── StandardDialogueScene
    ├── ChapterIntroScene
    ├── LetterScene
    ├── HistoricalEventScene
    ├── SeasonJournalScene
    ├── EndingScene
    └── FreeLayoutScene
```

完成后：

- `GamePage` 负责初始化、Store交互、选择提交、历史回滚等运行逻辑；
- `SceneRenderer` 只负责按 `scene.template` 分发；
- 普通场景继续保持现有 864px 场景区 + 216px 对话区；
- 特殊场景使用完整 1920×1080 逻辑画布；
- 特殊场景隐藏普通 `StatusBar`、`SceneArea`、`DialoguePanel`；
- 任何缺字段或缺素材情况都不能导致白屏；
- 继续游戏、刷新和存档恢复时，必须仍停留在正确的特殊场景。

---

# 2. 开发前先做模板审计

在修改代码前，完整扫描 `src/content/game-data.json`，输出并记录：

```text
每种 template 的场景数量
每种 template 的场景 ID
每个特殊场景是否具备对应 content 字段
每个场景引用的背景、UI、道具路径
当前是否存在“语义上是特殊页面但 template 仍是 standardDialogue”的场景
```

重点核对：

```text
chapterIntro      -> content.chapterTitle / dateText / locationText / backgroundText
letter            -> content.letter
historicalEvent   -> content.historicalEvent
seasonJournal     -> content.journal
ending            -> content.ending
freeLayout        -> elements 或可用的 content 字段
```

把审计结果写入完成报告，也可以在 `PROGRESS.md` 中增加简短统计。

### 数据修改边界

本阶段以渲染底层为主：

- 不新增剧情事件；
- 不新增角色；
- 不新增结局；
- 不改选择文本；
- 不改选择效果、条件、数值和标记；
- 不重写现有剧情文字；
- 不为了展示效果擅自扩写家书、札记或历史说明。

只有在以下情况下允许小范围修改 `game-data.json`：

1. 某个现有场景已经明确属于特殊页面；
2. 原有文字和素材都已存在；
3. 只需要把现有字段整理到 Schema 已定义的结构中；
4. 不改变场景 ID、跳转、选择、数值、标记和原文含义。

所有数据调整必须在完成报告中逐项列出。

**不得在本阶段批量新增八个季节札记、三封新家书或新历史文本。缺少的内容留待后续内容接入阶段。**

---

# 3. 文件结构

建议新增：

```text
src/components/scenes/
├── SceneRenderer.tsx
├── StandardDialogueScene.tsx
├── SpecialSceneShell.tsx
├── ChapterIntroScene.tsx
├── LetterScene.tsx
├── HistoricalEventScene.tsx
├── SeasonJournalScene.tsx
├── EndingScene.tsx
├── FreeLayoutScene.tsx
├── SceneFallback.tsx
├── sceneRendererTypes.ts
└── useAdvanceGuard.ts
```

样式建议新增：

```text
src/styles/special-scenes.css
```

允许根据当前项目风格略微调整文件名，但必须保持职责清晰，不要把所有组件重新塞回 `GamePage.tsx`。

---

# 4. SceneRenderer

`SceneRenderer` 必须使用穷尽分发，不能依赖大量模糊布尔判断。

示意：

```tsx
switch (scene.template) {
  case "standardDialogue":
    return <StandardDialogueScene ... />;
  case "chapterIntro":
    return <ChapterIntroScene ... />;
  case "letter":
    return <LetterScene ... />;
  case "historicalEvent":
    return <HistoricalEventScene ... />;
  case "seasonJournal":
    return <SeasonJournalScene ... />;
  case "ending":
    return <EndingScene ... />;
  case "freeLayout":
    return <FreeLayoutScene ... />;
  default:
    return <SceneFallback ... />;
}
```

要求：

- TypeScript 对模板类型进行穷尽检查；
- 未知模板或字段缺失时显示安全降级页；
- 禁止返回空白页面；
- 禁止在组件内直接修改 Zustand state；
- 所有推进仍调用从 `GamePage` 传入的回调；
- 所有选择仍经过现有 `commitChoice()`；
- 不在渲染层复制条件判断和结局判定逻辑。

---

# 5. StandardDialogueScene

把当前普通场景的显示职责从 `GamePage.tsx` 中抽出，但必须保持原有行为不退化。

继续使用：

```text
StatusBar
SceneArea
DialoguePanel
ChoicePanel
HistoryPanel
```

必须保留：

- 1920×864 场景区域；
- 1920×216 对话区域；
- 72px 状态栏叠加；
- 打字机效果；
- 点击一次显示全文、再次推进；
- 普通选项与关键选项；
- 关键选择二次确认；
- 锁定选项三态显示；
- 履历面板；
- 普通选择精确回滚；
- 关键选择不可回滚。

不要重写 ChoicePanel 或 P0 的选择事务。

---

# 6. SpecialSceneShell

所有特殊页面共用一个全屏外壳：

```text
逻辑尺寸：1920×1080
position: relative
overflow: hidden
背景：scene.background
```

要求：

- 不显示普通状态栏；
- 不显示普通216px对话框；
- 继续使用外层 `GameViewport` 等比缩放；
- 支持背景缺失时的安全底色；
- 提供统一的“继续”按钮区域；
- 支持点击背景推进，但交互控件必须 `stopPropagation()`；
- 增加一次性推进保护，避免双击触发两次 `advanceScene()`；
- Enter / Space 可以推进，输入控件聚焦时不得误触；
- 按钮必须可键盘聚焦；
- 切换场景后推进锁自动复位。

不要在这一阶段添加复杂转场库。

---

# 7. ChapterIntroScene

数据来源：

```text
scene.background
scene.content.chapterTitle
scene.content.dateText
scene.content.locationText
scene.content.backgroundText
scene.content.text
```

表现要求：

- 全屏章节背景；
- 标题为视觉中心；
- 年份、季节、地点使用克制的小字档案排版；
- `backgroundText` 显示2—4句章节说明；
- `content.text` 可作为短时间落款或补充；
- 页面底部显示“点击继续”或同风格按钮；
- 不显示角色立绘、普通对话框和状态栏；
- 缺少某个可选字段时自然隐藏，不显示 `undefined`。

参考背景：

```text
/assets/backgrounds/bg_time_note_four_seasons.webp
/assets/backgrounds/bg_creative_note.webp
```

当前至少需要保证 `prologue_time_skip` 能正确使用该组件。

---

# 8. LetterScene

数据来源严格使用 `content.letter`：

```text
date
salutation
pages
postscript
signature
paperAsset
historyPlainText
```

现有UI素材：

```text
/assets/ui/ui_letter_paper.png
```

要求：

- 信纸居中显示；
- 支持1—3页；
- 进入新信件时页码重置为0；
- 前一页、后一页按钮不触发场景推进；
- 最后一页才显示“收起信件”或“继续”；
- 不使用滚动条；
- 正文区域必须有固定安全边距；
- 日期、称呼、正文、附言、署名分区；
- `postscript` 和 `signature` 只在合适页面显示；
- 页码显示为 `1 / N`；
- 文字超出设计容量时，开发环境给出警告，运行时不得溢出信纸；
- 本阶段不播放 `openSfx/pageTurnSfx/closeSfx`，仅保留字段，等待P2音频系统；
- 离开信件场景时，历史面板应记录一次 `historyPlainText`，类型为 `letter`，不得把每次翻页都写入历史。

可用信封素材：

```text
/assets/props/prop_envelope_family_01.png
/assets/props/prop_envelope_family_02.png
/assets/props/prop_envelope_family_03.png
```

是否显示信封必须由场景数据或 `elements` 决定，不要在所有信件中强行硬编码同一信封。

---

# 9. HistoricalEventScene

数据来源：

```text
content.historicalEvent.date
content.historicalEvent.title
content.historicalEvent.imageAsset
content.historicalEvent.paragraphs
content.historicalEvent.gameplayNotice
content.historicalEvent.sourceNote
```

现有素材：

```text
/assets/ui/ui_historical_event_frame.png
/assets/props/prop_newspaper_lugouqiao_1937.png
```

要求：

- 使用全屏历史事件页；
- 视觉语言为旧报纸、档案与事件通报；
- 日期、标题、报纸图、正文层级清晰；
- `paragraphs` 按段落显示；
- `gameplayNotice` 与史实正文视觉上区分；
- `sourceNote` 使用小号克制排版；
- 不做现代科技弹窗、发光卡片或策略游戏UI仿制；
- 页面关闭后只推进一次；
- 历史面板记录标题和正文摘要，类型为 `system`；
- 不在本阶段修改历史事实文本。

---

# 10. SeasonJournalScene

数据来源：

```text
content.journal.visibleSummary
content.journal.journalText
content.journal.keepsakes
```

现有素材：

```text
/assets/ui/ui_season_journal_panel.png
```

要求：

- 全屏背景上居中显示札记面板；
- 只显示显性状态：
  - 学识描述；
  - 身心状态描述；
  - 行动准备描述；
- 不显示担当、故土牵挂、角色信任、倾向、隐藏标记和数值公式；
- `journalText` 使用沈怀远第一人称札记排版；
- `keepsakes` 显示1—3项“本季留下的事物”；
- 没有 keepsakes 时自然隐藏该区域；
- 进入下一季按钮只触发一次；
- 本阶段不动态生成新文案，不使用AI实时生成札记。

---

# 11. EndingScene

数据优先级：

1. `scene.content.ending`
2. 若现有流程已经通过引擎解析顶层 `gameData.endings`，继续使用现有解析结果
3. 若字段暂时不完整，使用安全降级显示 `scene.name` 与已有 `content.text`

要求：

- 结局背景全屏；
- 显示结局名称和正文段落；
- 不显示 `GOOD`、`BAD`、完美、失败、遗憾等级；
- 支持进入既有旅程回顾场景；
- 不在组件中重新计算结局；
- 不更改现有结局条件；
- 不在P1阶段新增结局变体；
- 缺配音文件时不报错，本阶段不播放 `voice`。

现有背景：

```text
/assets/backgrounds/bg_ending_electric_wave_return.webp
/assets/backgrounds/bg_ending_foreign_lamp.webp
/assets/backgrounds/bg_journey_review.webp
```

---

# 12. FreeLayoutScene

严格读取 `scene.elements`，支持当前 Schema 中两类元素：

```text
image
text
```

坐标均使用1920×1080逻辑坐标：

```text
x
y
width
height
opacity
zIndex
```

图片元素支持：

```text
asset
fit: contain | cover
```

文字元素支持：

```text
text
fontFamily
fontSize
lineHeight
align
color
backgroundColor
```

要求：

- 按 `zIndex` 排序；
- 使用绝对定位；
- `opacity` 正确生效；
- 图片不可拖拽；
- 不开发编辑器；
- 不引入 Konva 作为运行时渲染依赖，普通 DOM/CSS 足够；
- 图片加载失败时显示开发环境警告，运行时隐藏损坏图片并保留页面；
- 若没有 `elements`，使用 `scene.content` 做安全降级，不得白屏；
- 可用于创作说明、时间说明、最终告别和旅程回顾。

---

# 13. 特殊场景历史记录

当前 `advanceScene()` 主要记录 `content.text`。P1需要让特殊场景在离开时也能得到合理历史记录，但不得破坏P0回滚。

建议增加纯函数：

```text
src/engine/sceneHistory.ts
```

例如：

```ts
buildHistoryEntryFromScene(scene: SceneDefinition): Omit<HistoryEntry, "id" | "createdAt"> | null
```

规则：

```text
standardDialogue -> content.text
letter           -> content.letter.historyPlainText，type=letter
historicalEvent  -> 标题 + 正文摘要，type=system
chapterIntro     -> 章节标题 + 背景说明，type=system
seasonJournal    -> journalText，type=system
ending           -> 结局标题 + 正文摘要，type=system
freeLayout       -> 可读文本摘要；无文本则不记录
```

要求：

- 一个场景只在真正离开时记录一次；
- 翻页不重复记录；
- 不写入隐藏数值；
- 不给特殊场景伪造回滚快照；
- 不允许跨越关键选择回滚；
- 继续使用现有 `advanceScene()` 和 SaveEnvelope；
- 修改 Store 前先写测试，变更尽可能小。

如果能够在不修改 Store 的情况下安全实现，也可以采用等价方案，但不得把历史记录逻辑分散在七个React组件中。

---

# 14. 错误与安全降级

新增 `SceneFallback`，处理：

- 模板已知但必要内容缺失；
- 背景图片加载失败；
- 道具图片加载失败；
- `elements` 为空；
- `nextSceneId` 缺失；
- 特殊场景内容不完整。

运行时要求：

- 不白屏；
- 显示场景名称和已有文字；
- 有合法 `nextSceneId` 时仍可继续；
- 没有合法目标时显示“返回标题”；
- 控制台给出包含 `scene.id` 的明确错误；
- 生产界面不展示技术堆栈。

不要在本阶段重做全局 ErrorBoundary；只处理场景渲染层的安全降级。

---

# 15. 样式要求

遵守：

```text
docs/04_ART_ASSET_SPEC.md
src/styles/tokens.css
```

视觉方向：

- 高精度叙事像素插画；
- 历史档案与纸质材料；
- 克制的电影感光影；
- 1930年代工业与文书语言；
- 不使用现代玻璃拟态；
- 不使用霓虹描边；
- 不使用圆润移动端卡片；
- 不添加夸张发光按钮；
- 文字必须由网页渲染，不烘焙进图片。

尽量使用CSS类，不要让新组件堆积数百行内联样式。

---

# 16. 测试

至少新增：

```text
src/components/scenes/__tests__/SceneRenderer.test.tsx
src/components/scenes/__tests__/LetterScene.test.tsx
src/components/scenes/__tests__/FreeLayoutScene.test.tsx
src/engine/__tests__/sceneHistory.test.ts
```

覆盖：

1. 七种模板分发到正确组件；
2. 未知/缺字段场景进入安全降级；
3. `standardDialogue` 保留普通布局；
4. 特殊模板不渲染普通状态栏和216px对话框；
5. 家书1页直接显示完成按钮；
6. 家书3页按顺序翻页；
7. 翻页不会推进场景；
8. 最后一页只能推进一次；
9. 切换到另一封信页码重置；
10. historicalEvent显示日期、标题、段落和提示；
11. seasonJournal不显示隐藏数值；
12. freeLayout按坐标和zIndex渲染图片与文字；
13. sceneHistory对每种模板生成正确且不泄露隐藏值的记录；
14. P0/P0.1原有测试全部继续通过。

测试不要依赖真实网络和音频文件。

---

# 17. 手动验收

启动：

```bash
npm run dev
```

至少手动检查：

```text
序章普通对话
序章选择
prologue_time_skip 章节页
一个有角色立绘的普通场景
一个关键选择及二次确认
一个锁定选项
一个可回滚普通选择
当前数据中实际存在的每一种特殊模板
刷新特殊场景后继续游戏
从标题页继续游戏恢复到特殊场景
```

屏幕尺寸：

```text
1366×768
1920×1080
2560×1440
```

确认等比缩放正常，没有文字超出逻辑画布。

---

# 18. 禁止事项

本阶段不要：

- 创建新Git分支；
- 开发可视化编辑器；
- 开发Konva拖拽；
- 接入完整音频系统；
- 新增背景音乐、环境音或配音；
- 新增剧情、角色或结局；
- 扩写家书、历史说明和季节札记；
- 修改选择文本、数值、条件、标记或结局门槛；
- 重写 `gameStore`；
- 重写 `saveManager`；
- 改变P0回滚边界；
- 改变1920×1080逻辑画布；
- 做移动端专用布局；
- 引入大型UI框架或动画库。

---

# 19. 完成标准

以下全部满足才算P1A完成：

```text
SceneRenderer按七种模板正确分发
普通场景行为没有退化
特殊页面使用1920×1080全屏布局
chapterIntro真实可用
letter组件支持1—3页
historicalEvent组件可用
seasonJournal组件可用
ending组件可用
freeLayout组件按elements渲染
所有特殊页面都有安全降级
特殊场景历史记录正确
双击不会重复推进
刷新和继续游戏可恢复特殊页面
全部测试通过
生产构建通过
```

---

# 20. 完成后的命令

执行：

```bash
npm run check
npm run build
git status
git diff --stat
```

更新：

```text
PROGRESS.md
```

提交：

```bash
git add .
git commit -m "实现统一场景渲染与特殊页面底层"
git push origin develop
```

不要创建新分支。

---

# 21. 完成报告格式

完成后必须汇报：

```text
1. 开始前模板审计结果
2. 新增文件
3. 修改文件
4. game-data.json 是否修改；若修改，逐项说明
5. 七种模板的实现状态
6. 特殊场景历史记录方案
7. 自动测试数量与结果
8. npm run check 结果
9. npm run build 结果
10. 手动验收场景
11. 尚未接入的数据或素材
12. Git commit hash
13. 本阶段遗留风险
```

完成并推送后停止，不进入P1B内容接入，也不进入P2音频系统。
