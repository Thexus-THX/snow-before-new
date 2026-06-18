# 《雪落之前》V1 开发进度

> 最后更新：2026-06-18（P0 运行时底层纠错与稳定化完成）

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

---

## 待实现

### ⬜ 特殊场景模板渲染组件
- `chapterIntro` / `seasonJournal` / `letter` / `historicalEvent` / `ending` / `freeLayout`

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
│   └── game/
│       ├── StatusBar.tsx
│       ├── SceneArea.tsx
│       ├── DialoguePanel.tsx         # 打字机（接入 settingsStore）
│       ├── ChoicePanel.tsx           # 三态选项渲染
│       └── HistoryPanel.tsx          # 精确回滚 + 边界提示
├── engine/
│   ├── gameEngine.ts                 # 数据访问 + 条件评估 + getResolvedChoices
│   ├── saveManager.ts                # 版本化存档 + Zod 校验 + 旧存档迁移
│   ├── conditionEvaluator.ts         # ⚠️ 空占位类
│   ├── effectApplier.ts              # ⚠️ 空占位类
│   ├── historyManager.ts             # ⚠️ 空占位类
│   ├── endingResolver.ts             # ⚠️ 空占位类
│   ├── assetResolver.ts              # ⚠️ 空占位类
│   └── __tests__/
│       ├── saveManager.test.ts
│       └── gameEngine.choices.test.ts
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
