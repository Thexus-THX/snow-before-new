# 《雪落之前》V1 开发进度

> 最后更新：2026-06-18

---

## 项目概况

- **项目名**：雪落之前（Snow Before）
- **类型**：数据驱动叙事视觉小说
- **技术栈**：React 18 + TypeScript + Vite + Zustand + Zod + React Router
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
- `ChoicePanel.tsx` — 普通/关键选择渲染，关键选择二次确认
- `applyChoiceEffect` — 数值/标记/信任/倾向变更 + clamp(0-10)
- `evaluateConditionGroup` — all/any/none 逻辑组合
- 锁定选项 + 叙事化提示（`lockedHint`）

### ✅ 阶段 5：自动存档 + 历史面板 + 回滚
- `HistoryPanel.tsx` — 右侧 480px 侧边面板，显示旁白/对话/选择历史
- 普通选择可回退（快照恢复），关键选择不可回退
- `autoSavePoint` 自动存档到 localStorage（支持 chapterStart/criticalChoice/chapterEnd/beforeEnding）
- 历史仅显示显性数值变化（隐藏数值不可见）

### ✅ 阶段 6：打字机文本动画
- 逐字显示动画：旁白 55ms / 对话 40ms / 内心独白 35ms 每字
- 点击中途 → 立即显示全文，点击全文 → 推进场景
- 闪烁光标 + "点击跳过"/"▸ 点击继续" 提示

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
  - 开始游戏按钮 → 跳转 /game

### ✅ 阶段 8：完整剧情数据（Days 1-8 + 结局）
- **48 个场景**，9 个章节（序章 + Days 1-8）
- **19 次有效选择**完整实现，其中 7 次标注为【关键选择】
- 两条主结局完整路径：
  - 《电波归途》— 3 种变体（完整准备/同伴协助/仓促启程）
  - 《异乡长灯》— 3 种变体（支援国内/长期研究/暂缓启程）
- 结局条件评估（prepMin/prepExact/statMin/notFlag/reliableCountMin 组合）
- 旅程回顾 + 致谢页

### ✅ 固定比例布局
- SceneArea 864px + DialoguePanel 216px = 1080px 严格固定
- StatusBar 72px 叠加浮层（不占场景高度）
- CSS 变量补单位 `px`，避免浏览器解析无效

### ✅ 章节切换
- advanceScene 自动更新 `chapterId`，状态栏实时切换章节信息

### ✅ 数值系统完整性
- 4 项长期数值（学识/身心/担当/故土牵挂），clamp(0,10)
- 4 角色独立信任值（陈绍衡/娜佳/别洛夫/伊万），clamp(0,10)
- 5 项行动准备（路线/票证/经费/技术资料/联系人），clamp(0,2)
- 派生值自动计算（行动准备 = 5 项之和，社交信任 = 平均 + 修正）
- 倾向值（归国倾向/留苏倾向）

---

## 待实现

### ⬜ 特殊场景模板渲染组件
- `chapterIntro`（章节介绍页）— 数据已有，缺专用渲染组件
- `seasonJournal`（季节札记）— 缺数据和组件
- `letter`（家书页面）— 缺数据和组件
- `historicalEvent`（历史事件页）— 缺数据和组件
- `ending`（结局页）— 数据已有，GamePage 降级为标准对话渲染
- `freeLayout`（自由排版）— 数据已有，GamePage 降级为标准对话渲染

### ⬜ 音频系统
- ✅ `bgm_00_title.ogg` 就绪（标题页）
- ⬜ BGM 01-08（序章~结局，共 8 首）
- ⬜ 环境音（10 个场景环境音）
- ⬜ 音效 SFX（15 个 UI/事件音效）
- ⬜ 关键句配音（6 句）

### ✅ UI 装饰素材（全部就绪，含假透明修复）
- ✅ 全部 12 张 UI 素材就绪
- ✅ 全部 19 张角色立绘就绪
- ✅ **假透明修复**：`scripts/remove_fake_transparency.py` 处理全部 31 张 RGB 图片
  - 棋盘格背景 → Alpha=0 真透明 RGBA PNG
  - 原文件备份为 `.bak.*`，透明版本输出为 `*_transparent.png`
  - 黑色背景预览图 `*_preview.png` 供验收
  - 边缘 flood-fill + 去白边处理，保留内部浅色 UI 本体

### ⬜ 编辑器（/editor）
- 可视化编辑器整体未实现

### ⬜ 引擎模块清理
- `src/engine/` 下有 6 个空占位类（conditionEvaluator/effectApplier/historyManager/saveManager/endingResolver/assetResolver），功能已内嵌到 gameEngine.ts 和 gameStore.ts 中，建议清理或合并

---

## 文件结构

```
src/
├── app/
│   ├── router.tsx          # React Router 路由
│   └── stores/gameStore.ts # Zustand 状态管理
├── components/
│   ├── common/GameViewport.tsx  # 等比缩放容器
│   └── game/
│       ├── StatusBar.tsx        # 顶部状态栏 (72px)
│       ├── SceneArea.tsx        # 场景背景 + 立绘 (864px)
│       ├── DialoguePanel.tsx    # 打字机对话区 (216px)
│       ├── ChoicePanel.tsx      # 选项 + 二次确认
│       └── HistoryPanel.tsx     # 历史记录面板
├── engine/
│   ├── gameEngine.ts        # 数据访问 + 条件评估（已实现）
│   ├── conditionEvaluator.ts # ⚠️ 空占位类
│   ├── effectApplier.ts     # ⚠️ 空占位类
│   ├── historyManager.ts    # ⚠️ 空占位类
│   ├── saveManager.ts       # ⚠️ 空占位类
│   ├── endingResolver.ts    # ⚠️ 空占位类
│   └── assetResolver.ts     # ⚠️ 空占位类
├── pages/
│   ├── TitlePage.tsx         # 标题页（雪花 + 烟雾 + 灯光 + BGM）
│   ├── GamePage.tsx          # 游戏运行器
│   └── ...
├── schemas/
│   ├── types.ts              # TypeScript 类型定义
│   └── gameSchema.ts         # Zod 校验 Schema
├── content/game-data.json    # 游戏数据（48 场景，序章~第八日 + 结局）
└── styles/
    ├── tokens.css            # CSS 变量体系
    └── global.css            # 全局样式 + 重置
public/
└── assets/
    ├── backgrounds/          # 19 张场景背景 (.webp) ✅
    ├── characters/           # 19 张角色立绘 (.webp) ✅
    ├── audio/bgm/            # 1 首标题 BGM (.ogg) ✅
    ├── audio/ambience/       # ⬜ 空
    ├── audio/sfx/            # ⬜ 空
    ├── audio/voice/          # ⬜ 空
    ├── props/                # 8 张道具素材 (.png) ✅
    ├── references/           # 2 张参考图 (.png) ✅
    ├── ui/                   # 12 张 UI 素材 (.png) ✅（假透明已修复）
scripts/                       # 工具脚本
    ├── remove_fake_transparency.py  # 假透明去除脚本
    ├── scan_characters.py           # 角色立绘扫描
    └── verify_results.py            # 结果验证
docs/                         # 设计文档（8 个 .md）
```

---

## 技术要点

- **数据驱动**：所有剧情 JSON 驱动，Zod 严格校验，`import` 直接导入（非 fetch）
- **状态管理**：Zustand store，structuredClone 防 mutation
- **条件系统**：9 种条件类型，all/any/none 组合
- **回滚**：`createSnapshot` → `rollback` 完整 state 快照
- **固定比例**：864 + 216 = 1080px 不可变
- **打字机**：React setInterval + useEffect，三档速度
- **像素雪花**：Canvas requestAnimationFrame，160 粒子 25° 飘落
- **像素烟雾**：Canvas 黑灰粒子脉冲式爆发，100~500ms 随机间隔
- **像素灯光**：Canvas 像素圆形光源，3 灯独立闪烁
- **结局系统**：条件驱动多分支结局，6 种具体变体，旅程回顾
