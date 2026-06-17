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
- `src/content/game-data.json` — 8 个场景（序章 + 第一日 1936 春）
- Zod 校验自动拦截不合法数据
- gameStore 集成引擎，fetch JSON → 校验 → 注入 store

### ✅ 阶段 3：状态栏 + 场景区 + 对话区
- `StatusBar.tsx`（72px）— 章节信息 + 数值（学识/身心/行动准备）
- `SceneArea.tsx`（864px）— 场景背景 + 角色立绘
- `DialoguePanel.tsx`（216px）— 对话/旁白/内心独白文本
- 三栏布局 72 + 864 + 216 = 1080 固定比例

### ✅ 阶段 4：选择系统 + 数值 + 条件
- 条件评估引擎 — 9 种条件类型（statMin/Max, prepMin/Exact, trustMin, flag/notFlag, tendencyMin, reliableCountMin）
- `ChoicePanel.tsx` — 普通/关键选择渲染，关键选择二次确认
- `applyChoiceEffect` — 数值/标记/信任/倾向变更 + clamp
- `evaluateConditionGroup` — all/any/none 逻辑组合

### ✅ 阶段 5：自动存档 + 历史面板 + 回滚
- `HistoryPanel.tsx` — 右侧 480px 侧边面板，显示旁白/对话/选择历史
- 普通选择可回退（快照恢复），关键选择不可回退
- `autoSavePoint` 自动存档到 localStorage
- 历史仅显示显性数值变化（隐藏数值不可见）

### ✅ 阶段 6：打字机文本动画
- 逐字显示动画：旁白 55ms / 对话 40ms / 内心独白 35ms 每字
- 点击中途 → 立即显示全文，点击全文 → 推进场景
- 闪烁光标 + "点击跳过"/"▸ 点击继续" 提示

### ✅ 阶段 7：素材接入
- **场景背景**：19 张 `.webp` 全部就绪（序章~第八日 + 结局 + 标题）
- **角色立绘**：5 角色 × 多状态（沈怀远/陈绍衡/娜佳/别洛夫/伊万），共 19 张
- SceneArea 显示真实背景图 + content.portraitAsset 驱动角色立绘
- 渐变遮罩融合场景与 UI

### ✅ 固定比例布局
- SceneArea 864px + DialoguePanel 216px = 1080px 严格固定
- StatusBar 72px 叠加浮层（不占场景高度）
- CSS 变量补单位 `px`，避免浏览器解析无效

### ✅ 标题页
- 背景：`bg_day08_winter_station.webp` 风雪车站全屏
- BGM：`bgm_00_title.ogg` 自动循环播放
- Canvas 像素雪花动画：160 粒子，右上/上边缘→左下方 25° 飘落
- 开始游戏按钮 → 跳转 /game

### ✅ 章节切换
- advanceScene 自动更新 `chapterId`，状态栏实时切换章节信息

---

## 待实现

### ⬜ 其他场景模板
- `chapterIntro`（章节介绍页，已有 prologue_end 雏形）
- `seasonJournal`（季节札记，含数值总结 + 第一人称文本）
- `letter`（家书页面，翻页交互）
- `historicalEvent`（历史事件页，报纸框架）
- `ending`（结局页 + 旅程回顾）

### ⬜ Days 2-8 场景内容
- 所有背景图已就绪，需补充对应 JSON 场景数据
- 参考 `docs/02_GAME_LOGIC.md` 中的 19 次选择完整设计

### ⬜ 音频系统
- 仅 `bgm_00_title.ogg` 就绪
- 缺：BGM（01-08）、环境音、音效 SFX、关键句配音

### ⬜ UI 装饰素材
- 18 个 UI 素材文件全部缺失（面板背景、按钮、图标等）

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
├── engine/gameEngine.ts    # 数据访问 + 条件评估
├── pages/
│   ├── TitlePage.tsx        # 标题页（雪花 + BGM）
│   ├── GamePage.tsx         # 游戏运行器
│   └── ...
├── schemas/
│   ├── types.ts             # TypeScript 类型定义
│   └── gameSchema.ts        # Zod 校验 Schema
├── content/game-data.json   # 游戏数据（序章 + 第一日）
└── styles/
    ├── tokens.css           # CSS 变量体系
    └── global.css           # 全局样式 + 重置
public/
└── assets/
    ├── backgrounds/         # 19 张场景背景 (.webp) ✅
    ├── characters/          # 19 张角色立绘 (.webp) ✅
    └── audio/bgm/           # 1 首标题 BGM (.ogg) ✅
docs/                       # 设计文档（7 个 .md）
```

---

## 技术要点

- **数据驱动**：所有剧情 JSON 驱动，Zod 严格校验
- **状态管理**：Zustand store，structuredClone 防 mutation
- **条件系统**：9 种条件类型，all/any/none 组合
- **回滚**：`createSnapshot` → `rollback` 完整 state 快照
- **固定比例**：864 + 216 = 1080px 不可变
- **打字机**：React setInterval + useEffect，三档速度
- **像素雪花**：Canvas requestAnimationFrame，160 粒子 25° 飘落
