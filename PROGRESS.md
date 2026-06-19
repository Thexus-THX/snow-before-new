# 《雪落之前》V1 开发进度

> 最后更新：2026-06-19（P2A 无配音版音频底层系统）

---

## 项目概况

- **项目名**：雪落之前（Snow Before）
- **类型**：数据驱动叙事视觉小说
- **技术栈**：React 18 + TypeScript + Vite + Zustand + Zod + React Router + Vitest
- **画布**：1920×1080 逻辑坐标，等比缩放适配任意屏幕
- **素材规范**：docs/04_ART_ASSET_SPEC.md / 05_AUDIO_ASSET_SPEC.md
- **数据 Schema**：docs/07_DATA_SCHEMA.md

---

## 当前进度

### ✅ 阶段 1：项目骨架
- Vite + React + TypeScript 项目初始化
- Zustand 状态管理、Zod 数据校验
- React Router 路由（/ `/game` `/editor` `/settings`）
- CSS 变量体系（tokens.css）、深色叙事主题全局样式
- GameViewport 等比缩放容器（1920×1080 → 窗口自适应）
- TypeScript 类型定义（types.ts）、Zod Schema（gameSchema.ts）

### ✅ 阶段 2：GameEngine + JSON 场景读取
- `src/engine/gameEngine.ts` — 游戏数据访问层：`getScene`/`getCharacter`/`getChapter`/`seasonLabel` 等 API
- `src/content/game-data.json` — **48 个场景**，完整覆盖序章至第八日 + 结局 + 旅程回顾
- Zod 校验自动拦截不合法数据
- gameStore 集成引擎，`import` JSON → 校验 → 注入 store

### ✅ 阶段 3：状态栏 + 场景区 + 对话区
- `StatusBar.tsx`（72px）— 章节信息 + 数值（学识/身心/行动准备）
- `SceneArea.tsx`（864px）— 场景背景 + 角色立绘
- `DialoguePanel.tsx`（216px）— 对话/旁白/内心独白文本
- 三栏布局 72 + 864 + 216 = 1080 固定比例

### ✅ 阶段 4：选择系统 + 数值 + 条件
- 条件评估引擎 — 9 种条件类型（statMin/Max, prepMin/Exact, trustMin, flag/notFlag, tendencyMin, reliableCountMin）
- `ChoicePanel.tsx` — 普通/关键/锁定选项三态渲染，关键选择二次确认
- `commitChoice` — 原子选择事务（单次 set() 完成快照+效果+历史+推进+存档）
- `evaluateConditionGroup` — all/any/none 逻辑组合
- 锁定选项 + 叙事化提示（`lockedHint`）

### ✅ 阶段 5：自动存档 + 历史面板 + 回滚
- `HistoryPanel.tsx` — 右侧 480px 侧边面板，显示旁白/对话/选择历史
- 精确回滚（使用 entry.rollbackSnapshotId），截断未来历史与快照
- 关键选择不可跨越边界（store 双重校验）
- `saveManager.ts` — 版本化存档（SaveEnvelope），Zod 校验，旧存档迁移
- `autoSavePoint` 自动存档到 localStorage

### ✅ 阶段 6：打字机文本动画
- 逐字显示动画，速度受 `settingsStore.textSpeed` 控制
- 实际毫秒值来自 `gameData.settings.textSpeeds`（slow/normal/fast）
- 点击中途 → 立即显示全文，点击全文 → 推进场景
- 设置变化在下一段文字立即生效

### ✅ 阶段 7：素材接入 + 标题页特效
- **场景背景**：19 张 `.webp` 全部就绪（序章~第八日 + 结局 + 标题）
- **角色立绘**：5 角色 × 多状态（沈怀远/陈绍衡/娜佳/别洛夫/伊万），共 19 张
- SceneArea 显示真实背景图 + content.portraitAsset 驱动角色立绘
- **标题页特效**：
  - 背景：`bg_day08_winter_station.webp` 风雪车站全屏
  - BGM：`bgm_00_title.ogg` 自动循环播放
  - Canvas 像素雪花动画：160 粒子，右上/上边缘→左下方 25° 飘落
  - **火车烟囱烟雾动画**：像素风黑灰烟雾粒子，脉冲式随机爆发（间隔 100~500ms）
  - **火车灯光源**：3 个复古橙黄像素圆形光源，独立闪烁
  - 三按钮：开始新游戏 / 继续游戏 / 设置

### ✅ 阶段 8：完整剧情数据（Days 1-8 + 结局）
- **48 个场景**，9 个章节（序章 + Days 1-8）
- **19 次有效选择**完整实现，其中 7 次标注为【关键选择】
- 两条主结局完整路径
- 结局条件评估 + 旅程回顾 + 致谢页

### ✅ P0 运行时底层纠错与稳定化（2026-06-18）

#### 新游戏/继续游戏流程
- 标题页三按钮：开始新游戏（有存档时确认覆盖）/ 继续游戏（无存档时置灰）/ 设置
- `GameLaunchMode` 启动意图传递，GamePage 不再无条件 `startNewGame()`
- 直接访问 `/game`：优先继续有效存档 → 无有效存档才新建
- `initializedRef` 防 StrictMode 双重初始化

#### 版本化存档系统（saveManager.ts）
- `SaveEnvelope`：schemaVersion + gameId + gameDataVersion + savedAt + state + snapshots
- Zod 校验 + 场景/章节引用校验 + rollbackSnapshotId 快照校验
- `LoadSaveResult` 六态：ok / not-found / migrated / corrupt / incompatible / storage-unavailable
- 旧裸 GameState 自动迁移为 SaveEnvelope

#### 原子选择事务（commitChoice）
- 单次 `set()` 完成：快照创建 → 效果应用 → 历史写入 → 场景推进 → 自动存档
- 防重复提交（submittingChoice 锁 + already-applied 检查）
- `CommitChoiceResult`：ok / busy / locked / already-applied / invalid-choice / missing-scene

#### 精确回滚 + 关键选择边界
- `rollbackToHistoryEntry`：使用 entry.rollbackSnapshotId 精确回滚
- 截断未来历史与快照，回退到快照对应场景
- `canRollbackEntry`：关键选择边界校验，不可跨越已确认关键选择
- HistoryPanel 显示不可回退原因

#### 选项三态 + choiceGroupId
- `ResolvedChoice`：available / locked / hidden
- `getResolvedChoices`：条件解析 + choiceGroupId 去重（同组只返回一个）
- ChoicePanel 渲染锁定选项（置灰 + disabled + lockedHint）

#### 文字速度接入
- DialoguePanel 从 settingsStore 读取 textSpeed
- 实际毫秒值从 gameData.settings.textSpeeds 读取
- 移除硬编码 speedMap

#### 自动测试体系
- Vitest + jsdom + @testing-library
- 4 个测试文件，35 个测试用例，覆盖 16 个必测场景
- `npm run check` = test + build

#### 音频管理
- `audioManager.ts` — 全局 BGM 单例，TitlePage/SettingsPage 共享
- 页面打开即自动播放（浏览器阻止时 fallback 首次交互）
- SettingsPage 音量调节实时生效（musicVolume × masterVolume）
- `visibilitychange` 监听：页面切后台自动暂停，回前台续播

### ✅ 固定比例布局
- SceneArea 864px + DialoguePanel 216px = 1080px 严格固定
- StatusBar 72px 叠加浮层

### ✅ 章节切换
- advanceScene 自动更新 chapterId

### ✅ 数值系统完整性
- 4 项长期数值 + 4 角色信任值 + 5 项行动准备
- 派生值自动计算 + 倾向值

### ✅ P0.1 存档一致性与新游戏覆盖修复（2026-06-18）

#### saveManager 版本化存档
- `SaveEnvelope`：schemaVersion + gameId + gameDataVersion + savedAt + state + snapshots
- Zod 校验 + 场景/章节引用校验
- `LoadSaveResult` 六态：ok / not-found / migrated / corrupt / incompatible / storage-unavailable
- 旧裸 GameState 自动迁移为 SaveEnvelope

#### 统一持久化写入通道
- `_persistState()` 内部函数：所有自动存档必经此通道
- `advanceScene()` 的 autoSavePoint 存档 → SaveEnvelope（不再是裸 GameState）
- `lockCriticalChoice()` 的存档 → SaveEnvelope
- 快照集合随存档完整保留，刷新后可继续精确回滚

#### 新游戏立即清除旧存档
- `startNewGame()` 首先调用 `clearSave()` 删除旧持久化存档
- 即使 localStorage 不可用，当前会话仍可正常开始

#### 自动测试
- Vitest + jsdom，2 个测试文件，18 个测试用例
- 覆盖：新游戏覆盖、自动存档格式、快照保留、存储异常降级

---

### ✅ P1A 统一场景渲染底层（2026-06-18）

#### SceneRenderer 穷尽分发
- `SceneRenderer.tsx` — 按 `scene.template` switch-case 穷尽分发七种模板
- `StandardDialogueScene` — 从 GamePage 提取普通场景渲染逻辑，保持 864+216 布局不退化
- `SpecialSceneShell` — 全屏外壳（1920×1080），背景、点击/键盘推进、双击保护
- `ChapterIntroScene` — 章节介绍页（标题中心、小字档案排版）
- `LetterScene` — 家书阅读（1-3 页翻页、最后一页收起信件）
- `HistoricalEventScene` — 历史事件页（旧报纸/档案视觉）
- `SeasonJournalScene` — 季节札记（只显示显性状态）
- `EndingScene` — 结局展示（标题 + 段落）
- `FreeLayoutScene` — 自由排版（elements 按坐标/zIndex/opacity 渲染）
- `SceneFallback` — 安全降级页（未知模板/缺字段不白屏）

#### 特殊场景历史记录
- `sceneHistory.ts` — 纯函数 `buildHistoryEntryFromScene`，七种模板各有对应历史记录规则

#### 防双击推进
- `useAdvanceGuard.ts` — 500ms 锁定期，场景切换自动复位
- Enter/Space 键盘推进，输入控件聚焦时不误触

#### 自动测试
- 新增 4 个测试文件：SceneRenderer（8 测试）、LetterScene（5 测试）、FreeLayoutScene（3 测试）、sceneHistory（14 测试）
- 累计 9 个测试文件，73 个测试全部通过

#### 模板审计结果
- `standardDialogue`: 43 场景 ✅
- `chapterIntro`: 1 场景（prologue_time_skip）✅
- `ending`: 2 场景 ✅
- `freeLayout`: 2 场景（均无 elements，安全降级）✅
- `letter`: 0 场景（组件已实现，待数据接入）
- `historicalEvent`: 0 场景（组件已实现，待数据接入）
- `seasonJournal`: 0 场景（组件已实现，待数据接入）

#### Bug 修复（2026-06-18）
- **序章选项面板不显示**：`GamePage.handleAdvance` 中 `!nextSceneId` 检查在"显示选项"逻辑之前，导致 `StandardDialogueScene` 传空字符串触发选项显示时被直接 return。修复：将"显示选项"分支提前到 `nextSceneId` 有效性检查之前。
- **特殊场景点击无法推进**：`SpecialSceneShell` 内容插槽 `stopPropagation` 拦截了所有点击事件，导致外层 `onClick` 永远收不到。修复：改用 `onClickCapture` 捕获阶段处理 + 排除按钮等交互元素。

### ✅ P1B 特殊场景内容接入与数据闭环（2026-06-19）

#### FreeLayout 补齐
- `note_creative_opening`（创作说明页）：`freeLayout` + 档案式排版 elements，使用 `bg_creative_note.webp`
- `note_time_structure`（时间说明页）：`freeLayout` + 四季排版 elements，使用 `bg_time_note_four_seasons.webp`
- `journey_review`（旅程回顾）：补齐 4 个 text elements（标题/分隔/正文/提示）
- `thank_you`（致谢页）：补齐 4 个 text elements
- 原 `freeLayout` 2 场景 → 现在 4 场景均有 elements，不再走安全降级

#### Letter 接入（3 封家书）
- `letter_1931_winter_family`：序章·时光流转后，1931 冬家书（2 页，兰英红梅附笔）
- `letter_1936_autumn_family`：第三日·秋家书应对后，1936 秋家书（2 页，父亲收入减少/兰英学费）
- `letter_1937_winter_family`：第八日·风雪车站最后准备后，1937 冬最终家书（3 页，告别与托付）

#### HistoricalEvent 接入（1 个）
- `event_1937_lugouqiao`：卢沟桥事变历史事件页，第六日·消息确认后、关键选择前，含报纸图/史实说明/玩法提示/来源标注

#### SeasonJournal 接入（8 个）
- `journal_day01_spring_1936` ~ `journal_day08_winter_1937`，每季结束后插入
- 每篇含沈怀远第一人称札记（80-160 字）+ keepsakes（1-3 项）+ visibleSummary
- 只显示显性状态（学识/身心/行动准备），不显示隐藏数值

#### 数据闭环确认
- `ending_electric_wave` / `ending_foreign_lamp` → `journey_review` → `thank_you` → 标题页，链条完整
- `startSceneId` 改为 `note_creative_opening`，新游戏流程：创作说明 → 时间说明 → 序章
- 所有新增场景 ID 唯一，nextSceneId 全部可达
- 选择数量不变（关键选择场景仍为 8 个核心场景）
- 结局条件、数值效果、标记均未修改

#### Viewport 缩放修复
- `GameViewport` 改用 `translate(offsetX, offsetY) scale()` 实现窗口缩放时内容始终居中完整展示
- `TitlePage` 背景图 `cover` → `100% 100%` 拉伸适配，修复烟雾/灯光 Canvas 与背景图偏移
- `SettingsPage` 包裹 `GameViewport`，修复设置页面不随窗口缩放问题
- 移除创作说明/时间说明/旅程回顾页中与 `SpecialSceneShell` 底部提示重复的"点击继续"
- 创作说明页字体放大（标题 42px，正文 24px）
- 标题页按钮 hover 改用 CSS `:hover` 替代 JS `onMouseEnter`，解决响应延迟，增加发光效果

#### 玩家面向文本优化（v1.1）
- 基于 `docs/snow_before_player_text_optimized_v1_1.md` 批量优化 89 处场景文本
- 叙事口吻统一：旁白改为第三人称限知视角（沈怀远 / 他）
- 家书三封文本润色，增强时代感与家庭书信克制语气
- 结局段落优化，减少过度直白词汇
- 选项确认提示优化，部分锁定提示更叙事化
- 标题页按钮："继续游戏"→"继续旅程"，副标题更新，确认弹窗文案优化
- 设置页底部："阶段 1 · 项目骨架"→"雪落之前 · 设置"
- 对话面板："点击跳过"→"点击显示全文"

#### UI 素材全面接入（2026-06-19）
- **Panel 素材**：DialoguePanel/HistoryPanel/StatusBar/SeasonJournalScene/HistoricalEventScene 全部接入对应 `_transparent.png` 素材替代纯色背景
- **按钮素材**：TitlePage 按钮接入 `ui_button_primary/secondary_transparent.png`，ChoicePanel 选项按钮接入 `ui_choice_normal/critical/locked_transparent.png`，hover 改为 `filter: brightness()` 效果
- **Icon 素材**：履历按钮接入 `ui_icon_history.png`，设置按钮接入 `ui_icon_settings.png`
- **角色立绘**：全部 `.webp` 路径替换为 `_transparent.png` RGBA 透明版本
- 执行 `remove_fake_transparency.py` 处理 37 个素材文件（25 UI + 12 角色立绘）
- 严格遵循 `docs/UI_ASSET_MAPPING.md` / `LAYOUT_SYSTEM.md` / `COMPONENT_SYSTEM.md` 规范

### ✅ P1C 全流程路线验收与运行稳定性清理（2026-06-19）

#### Bug 修复
- **角色立绘路径全部损坏**：P1B 阶段批量替换时正则捕获组丢失，19 处路径变为 `/assets/characters/.png`，修复脚本逐个还原
- **`bg_day03_autumn_dorm.webp` 不存在**：4 个场景改用已有 `bg_day03_autumn_library.webp`
- **标题 BGM 误播**：切标签页回来误播，增加 `wasPlayingBeforeHidden` 追踪 + `destroyTitleBgm`

#### 全流程数据审计（+19 测试）
- 场景 ID 唯一、nextSceneId 可达、死胡同 0 个、特殊场景无 choices
- 家书/事件/札记完整性、elements 坐标范围、template 匹配

#### 资源引用检查（+7 测试）
- 所有图片引用验证存在，音频允许缺失并记录清单

#### 路线模拟器（+7 测试）
- 6 条路线全可达合法结局，无死循环/死胡同

#### 空占位类清理
- 删除 5 个未引用空文件，构建测试全过

#### 测试统计
- 13 文件 / 121 测试通过（+3 文件 / +33 测试）

### ✅ P2A 无配音版音频底层系统（2026-06-19）

#### AudioManager 实现
- 统一单例 `AudioManager`（`src/audio/AudioManager.ts`）
- BGM / ambience / SFX 三通道独立管理
- BGM 淡入淡出（`crossfadeBgm`）、同 ID 不重复启动
- 环境音循环、场景切换自动更新
- SFX 可重叠播放、缺失素材安全跳过
- 全局静音 + 分轨音量（master/bgm/ambience/sfx）clamp 0-1
- 首次交互解锁播放、页面 visibility 暂停/恢复
- 旧 `src/engine/audioManager.ts` 改为兼容层，内部转发到新 AudioManager

#### audioManifest
- 24 条音频定义（9 BGM + 6 Ambience + 8 SFX + 1 预留）
- 仅 `bgm.title` 拥有真实 src（`/assets/audio/bgm/bgm_00_title.ogg`）
- 其余 23 条 `src: null` + `optional: true`，安全跳过
- 未新增任何音频文件

#### audioSceneMap
- 按场景 ID / 章节前缀映射到逻辑音频 ID
- 覆盖标题页、序章、8 日、家书、札记、历史事件、结局、旅程回顾

#### 页面迁移
- **TitlePage**：移除旧 `ensureTitleBgm/getTitleBgm`，改用 `audioManager.crossfadeBgm("bgm.title")`
- **SettingsPage**：音量控制接入 `audioManager.setMasterVolume/setBgmVolume/setSfxVolume/setMuted`
- **GamePage**：集成 `useSceneAudio` hook，场景切换自动更新音频；`destroyTitleBgm` → `audioManager.stopBgm()`

#### 测试
- `audioManifest.test.ts`：10 测试（真实素材数/optional/null 资产/ID 唯一性/通道分类）
- `AudioManager.test.ts`：14 测试（所有方法不抛错、缺失资产安全跳过、clamp）
- `useSceneAudio.test.ts`：12 测试（12 种场景映射正确性）
- 累计 16 文件 / 157 测试通过（+3 文件 / +36 测试）

#### 未接入配音
- voice 通道类型已预留，本阶段不接入、不要求素材

## 待实现
  - letter/historicalEvent/seasonJournal/freeLayout 数量验证
  - 场景 ID 唯一性
  - nextSceneId 可达性（BFS 遍历）
  - 特殊场景 choices/effects 约束
  - 关键选择场景存在性
  - 选择场景完整性
  - 家书/历史事件/札记内容完整性
- 累计 10 个测试文件，88 个测试全部通过

## 待实现

### ✅ 特殊场景模板渲染组件
- ✅ 七种模板组件全部实现，穷尽分发 + 安全降级 + 防双击推进 + 历史记录 + 30 个新增测试

### ⬜ 音频系统
- ✅ `bgm_00_title.ogg` 就绪
- ⬜ BGM 01-08、环境音、音效 SFX、关键句配音

### ✅ UI 装饰素材（全部就绪）
- ✅ 12 张 UI + 19 张角色立绘 + 假透明修复

### ⬜ 编辑器（/editor）
- 可视化编辑器整体未实现

---

## 文件结构

```
src/
├── app/
│   ├── router.tsx
│   └── stores/
│       ├── gameStore.ts              # Zustand 状态管理 + commitChoice + 回滚
│       ├── settingsStore.ts          # 用户设置（音量/文字速度）
│       └── __tests__/
│           ├── gameStore.choiceTransaction.test.ts
│           └── gameStore.rollback.test.ts
├── components/
│   ├── common/GameViewport.tsx
│   ├── game/
│   │   ├── StatusBar.tsx
│   │   ├── SceneArea.tsx
│   │   ├── DialoguePanel.tsx         # 打字机（接入 settingsStore）
│   │   ├── ChoicePanel.tsx           # 三态选项渲染
│   │   └── HistoryPanel.tsx          # 精确回滚 + 边界提示
│   └── scenes/
│       ├── SceneRenderer.tsx         # 穷尽分发器
│       ├── StandardDialogueScene.tsx  # 普通对话场景
│       ├── SpecialSceneShell.tsx      # 全屏外壳 + 防双击 + 键盘推进
│       ├── ChapterIntroScene.tsx      # 章节介绍
│       ├── LetterScene.tsx            # 家书（1-3 页翻页）
│       ├── HistoricalEventScene.tsx   # 历史事件
│       ├── SeasonJournalScene.tsx     # 季节札记
│       ├── EndingScene.tsx            # 结局展示
│       ├── FreeLayoutScene.tsx        # 自由排版
│       ├── SceneFallback.tsx          # 安全降级
│       ├── sceneRendererTypes.ts      # 统一 Props 类型
│       ├── useAdvanceGuard.ts         # 防双击 hook
│       └── __tests__/ (3 个测试文件)
├── engine/
│   ├── gameEngine.ts                 # 数据访问 + 条件评估 + getResolvedChoices
│   ├── saveManager.ts                # 版本化存档 + Zod 校验 + 旧存档迁移
│   ├── sceneHistory.ts               # 特殊场景历史记录生成
│   ├── conditionEvaluator.ts         # ⚠️ 空占位类
│   ├── effectApplier.ts              # ⚠️ 空占位类
│   ├── historyManager.ts             # ⚠️ 空占位类
│   ├── endingResolver.ts             # ⚠️ 空占位类
│   ├── assetResolver.ts              # ⚠️ 空占位类
│   └── __tests__/
│       ├── saveManager.test.ts
│       ├── gameEngine.choices.test.ts
│       └── sceneHistory.test.ts
├── pages/
│   ├── TitlePage.tsx                 # 三按钮标题页
│   ├── GamePage.tsx                  # 启动意图判断 + commitChoice
│   └── ...
├── schemas/
│   ├── types.ts                      # +ResolvedChoice/ChoiceAvailability
│   └── gameSchema.ts                 # export gameStateSchema
├── content/game-data.json
├── test/setup.ts
└── styles/
    ├── tokens.css
    └── global.css
public/
└── assets/
    ├── backgrounds/ (19 张) ✅
    ├── characters/ (19 张) ✅
    ├── audio/bgm/ (1 首) ✅
    ├── props/ (8 张) ✅
    ├── ui/ (12 张) ✅
    └── references/ (2 张) ✅
docs/ (9 个 .md)
```

---

## 技术要点

- **数据驱动**：所有剧情 JSON 驱动，Zod 严格校验
- **状态管理**：Zustand store，structuredClone 防 mutation
- **原子事务**：commitChoice 单次 set() 完成全部操作
- **版本化存档**：SaveEnvelope 封装，Zod 校验，旧存档自动迁移
- **精确回滚**：entry.rollbackSnapshotId + 截断未来 + 关键选择边界
- **三态选项**：available / locked / hidden，choiceGroupId 去重
- **固定比例**：864 + 216 = 1080px 不可变
- **打字机**：接入 settingsStore，速度受 gameData.textSpeeds 控制
- **像素特效**：Canvas 雪花/烟雾/灯光
- **自动测试**：Vitest 35 测试，4 文件，`npm run check` 通过
