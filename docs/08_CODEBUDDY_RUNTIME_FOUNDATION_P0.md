# 《雪落之前》CodeBuddy 提示词：P0 运行时底层纠错与稳定化

> 适用仓库：`https://github.com/Thexus-THX/snow-before-new.git`
>
> 基线分支：`develop`
>
> 本轮只处理运行时底层正确性，不开发编辑器，不扩写剧情，不新增美术与音频。

---

## 一、开始前必须执行

1. 切换到 `develop`，拉取最新代码。
2. 从 `develop` 新建分支：

```bash
git checkout develop
git pull
git checkout -b feat/runtime-foundation-p0
```

3. 阅读以下文件，不得跳过：

```text
PROGRESS.md
docs/00_README.md
docs/01_CODEBUDDY_MASTER_PROMPT.md
docs/02_GAME_LOGIC.md
docs/03_STORY_BLUEPRINT.md
docs/04_ART_ASSET_SPEC.md
docs/05_AUDIO_ASSET_SPEC.md
docs/07_DATA_SCHEMA.md
src/pages/GamePage.tsx
src/pages/TitlePage.tsx
src/pages/SettingsPage.tsx
src/app/stores/gameStore.ts
src/app/stores/settingsStore.ts
src/engine/gameEngine.ts
src/schemas/types.ts
src/schemas/gameSchema.ts
src/components/game/ChoicePanel.tsx
src/components/game/HistoryPanel.tsx
src/components/game/DialoguePanel.tsx
src/content/game-data.json
package.json
```

4. 先执行基线检查并记录结果：

```bash
npm ci
npm run build
```

5. 在修改前，先核对下列“已观察到的问题”是否仍存在。若代码已变化，以当前仓库为准，但必须在汇报中说明差异。

---

## 二、当前仓库已观察到的P0问题

### 1. 继续游戏会被新游戏覆盖

当前 `GamePage.tsx` 在加载数据后直接调用 `startNewGame()`，没有根据用户意图调用 `continueGame()`。因此即使 localStorage 中存在存档，进入 `/game` 后也可能被初始状态覆盖。

### 2. 回滚没有回到用户点击的历史节点

当前 `handleRollback(entry)` 没有使用该历史条目的 `rollbackSnapshotId`，而是从全部快照中选择最新快照。用户点击旧选择时，可能回到错误位置。

### 3. 普通选择的历史条目没有绑定对应快照

类型中已经预留 `HistoryEntry.rollbackSnapshotId`，但当前普通选择流程没有把 `createSnapshot()` 返回的ID写入历史条目。

### 4. 选择应用不是原子事务

目前流程分别调用：

```text
createSnapshot
applyChoiceEffect
recordHistoryEntry
advanceScene
lockCriticalChoice
```

这些是多次独立Store更新。快速双击、异常中断或重复回调可能造成效果重复、场景已跳转但关键选择未锁定、存档时机不一致等问题。

### 5. 锁定选项字段已定义但未落实

`ChoiceDefinition` 已定义：

```text
visibleWhenLocked
lockedHint
choiceGroupId
```

但 `GameEngine.getVisibleChoices()` 目前直接过滤掉条件不满足的选项，没有返回“可用 / 锁定可见 / 隐藏”三种状态，也没有处理同一 `choiceGroupId` 的条件版本。

### 6. 关键选择边界后的旧普通选择仍可能显示“可回退”

`HistoryPanel` 目前只检查条目本身是否普通选择，没有判断该条目之后是否已经确认过关键选择。必须禁止跨越已确认关键选择回滚。

### 7. 设置页面存在，但打字速度没有真正接入

`SettingsPage.tsx` 和 `settingsStore.ts` 已有基本框架；但 `DialoguePanel.tsx` 仍使用组件内部硬编码的 `speedMap`，没有读取 `settingsStore.textSpeed`，也没有使用 `game-data.json.settings.textSpeeds`。

### 8. 存档没有版本封装与运行时校验

当前 localStorage 直接保存裸 `GameState`，`continueGame()` 直接 `JSON.parse` 后写入Store。缺少：

- 存档版本号；
- 保存时间；
- 游戏数据版本；
- Zod校验；
- 旧格式迁移；
- 损坏存档的结构化错误状态；
- localStorage不可用时的安全降级。

### 9. 当前项目没有测试命令

`package.json` 当前只有 `dev`、`build`、`preview`。本轮需要先建立最小纯逻辑测试体系，用测试锁定存档、选择事务和回滚行为。

---

## 三、本轮总目标

本轮只解决以下目标：

> 新游戏与继续游戏行为正确；选择提交是单次原子事务；普通选择能精确回滚；关键选择形成不可跨越边界；锁定选项按数据定义显示；存档可校验、迁移和恢复；文字速度真正受设置控制；核心逻辑具备自动测试。

不要在本轮实现特殊场景模板、完整AudioManager、编辑器、移动端适配或新剧情。

---

## 四、具体实施任务

## 任务A：建立明确的“新游戏 / 继续游戏”启动流程

### A1. 标题页

在现有标题页基础上实现：

```text
开始新游戏
继续游戏
设置
```

规则：

- 只有存在且通过校验的存档时，“继续游戏”可点击；
- 没有有效存档时，“继续游戏”置灰；
- 有存档时点击“开始新游戏”，先弹出覆盖确认；
- “设置”进入现有 `/settings`；
- 不修改现有标题页视觉风格和素材；
- 标题背景优先引用已有专用素材：
  `public/assets/backgrounds/bg_title_winter_station.webp`。

### A2. 启动意图

使用清晰、轻量的方法向 `/game` 传递启动模式：

```ts
type GameLaunchMode = "new" | "continue";
```

可使用路由state、独立session store或URL查询参数，但必须满足：

- 刷新游戏页时不能意外新开周目；
- 直接访问 `/game` 时：优先继续有效存档；没有有效存档才新建；
- `GamePage` 不得再无条件调用 `startNewGame()`；
- 游戏数据只初始化一次；
- React StrictMode开发环境下不得重复初始化或重复应用效果。

---

## 任务B：实现版本化 SaveManager

优先使用当前空置或预留的：

```text
src/engine/saveManager.ts
```

若该文件当前不存在，可创建。不要把所有存档逻辑继续堆进 `gameStore.ts`。

### B1. 存档封装

建议结构：

```ts
interface SaveEnvelope {
  schemaVersion: 1;
  gameId: "snow-before-v1";
  gameDataVersion: string;
  savedAt: number;
  state: GameState;
  snapshots: Record<string, StateSnapshot>;
}
```

保留现有localStorage键名以兼容旧版本：

```text
snow-before-v1-save
```

### B2. 校验

- 从 `gameSchema.ts` 导出可复用的 `gameStateSchema`；
- 新增 `saveEnvelopeSchema`；
- 读取存档必须经过Zod校验；
- 校验 `state.currentSceneId` 在当前 `game-data.json` 中存在；
- 校验 `state.chapterId` 存在；
- 校验历史中的 `rollbackSnapshotId` 若存在，则对应快照必须存在；
- 失败时返回结构化结果，不抛出导致白屏的未捕获异常。

建议返回：

```ts
type LoadSaveResult =
  | { status: "ok"; save: SaveEnvelope }
  | { status: "not-found" }
  | { status: "migrated"; save: SaveEnvelope }
  | { status: "corrupt"; reason: string }
  | { status: "incompatible"; reason: string }
  | { status: "storage-unavailable"; reason: string };
```

### B3. 旧存档迁移

现有旧存档是裸 `GameState`。检测到旧结构且其内容合法时：

1. 转换为 `SaveEnvelope`；
2. `schemaVersion` 设为1；
3. `snapshots` 默认为空对象；
4. 立即重新保存新格式；
5. 不丢失玩家当前进度。

### B4. 存档API

至少提供：

```ts
hasValidSave(gameData: GameData): boolean
loadSave(gameData: GameData): LoadSaveResult
writeSave(save: SaveEnvelope): SaveWriteResult
clearSave(): SaveWriteResult
migrateLegacySave(raw: unknown, gameData: GameData): LoadSaveResult
```

localStorage异常时允许继续当前会话，但应给出可控提示，不得白屏。

---

## 任务C：把选择提交改成单次原子事务

在 `gameStore` 中新增统一动作，例如：

```ts
commitChoice(choice: ChoiceDefinition): CommitChoiceResult
```

不要再由组件分别调用多个Store action来完成一次选择。

一次 `commitChoice` 必须在同一个状态计算过程中完成：

1. 验证当前场景包含该选项；
2. 验证选项当前可用；
3. 验证 `nextSceneId` 存在；
4. 防止同一选择重复提交；
5. 普通选择先创建快照；
6. 应用数值、准备、信任、倾向与标记效果；
7. 生成显性变化文本；
8. 写入选择历史；
9. 普通选择历史写入准确的 `rollbackSnapshotId`；
10. 关键选择写入 `lockedCriticalChoiceIds`；
11. 推进到下一场景；
12. 写入前一场景文本历史；
13. 根据关键选择或目标场景存档点执行自动存档；
14. 返回结果给UI。

建议结果：

```ts
type CommitChoiceResult =
  | { ok: true; nextSceneId: string; visibleEffects: string[] }
  | { ok: false; reason: "busy" | "locked" | "already-applied" | "invalid-choice" | "missing-scene" };
```

### C1. 防重复提交

- UI提交期间锁定输入；
- store层也必须幂等保护，不能只依赖按钮disabled；
- React StrictMode、双击、键盘连按均不得重复加数值；
- 已锁定关键选择再次提交必须返回 `already-applied`。

### C2. 保持数值边界

- 长期数值与角色信任：0—10；
- 五项行动准备：0—2；
- 合作修正：按现有规则限制；
- 数值变化为0时不要生成误导性的显性反馈；
- 隐藏数值与信任变化不显示具体数字。

---

## 任务D：修复回滚模型

### D1. 精确回滚

普通选择提交前创建快照，并把快照ID写入该选择对应的：

```ts
historyEntry.rollbackSnapshotId
```

用户点击历史中某一条普通选择的“回退至此”时，必须使用这条记录自己的快照，不能选择“最新快照”。

### D2. 截断未来

回滚成功后：

- 恢复目标快照中的完整状态；
- 删除目标时间点之后的历史；
- 删除目标时间点之后的临时快照；
- 回到该普通选择发生前的场景；
- 允许玩家重新选择；
- 更新自动存档，保证刷新后仍处于回滚后的状态。

### D3. 关键选择边界

已经确认的关键选择形成不可跨越边界：

- 关键选择本身不可回滚；
- 位于最近一次关键选择之前的普通选择，也不可回滚；
- `HistoryPanel` 不得只依据条目自身的 `isCritical` 判断；
- 由store或selector计算每条记录的 `canRollback` 与禁用原因；
- UI显示叙事化提示，例如：
  `该选择位于已确认的关键决定之前，无法回退。`

不要只在前端隐藏按钮，store的 `rollbackToHistoryEntry()` 也必须再次校验边界。

---

## 任务E：落实“可用 / 锁定 / 隐藏”三态选项

不要继续仅返回 `ChoiceDefinition[]`。

新增类似：

```ts
type ChoiceAvailability = "available" | "locked" | "hidden";

interface ResolvedChoice {
  choice: ChoiceDefinition;
  availability: ChoiceAvailability;
  lockedHint?: string;
}
```

在 `GameEngine` 中用一个明确方法替代或扩展 `getVisibleChoices()`：

```ts
getResolvedChoices(sceneId: string, state: GameState): ResolvedChoice[]
```

规则：

- 条件满足：`available`；
- 条件不满足且 `visibleWhenLocked === true`：`locked`；
- 条件不满足且未要求锁定可见：`hidden`，不返回给UI；
- 锁定选项不可点击，显示 `lockedHint`；
- 锁定提示不得暴露数值阈值；
- `ChoicePanel` 使用已有素材：
  `public/assets/ui/ui_choice_locked.png`；
- 普通、悬停、关键选项继续使用现有对应UI素材。

### E1. choiceGroupId

同一 `choiceGroupId` 代表同一行为的不同条件版本。

处理规则：

1. 条件满足的版本优先；
2. 同组只能最终呈现一个可点击版本；
3. 若没有满足版本，但存在 `visibleWhenLocked` 版本，只显示一个锁定版本；
4. 结果必须稳定，不受对象遍历偶然顺序影响；
5. 若数据中同组出现多个同时满足版本，开发环境给出警告，校验测试应能发现。

---

## 任务F：让文字速度设置真正生效

当前设置页面已有 `textSpeed`，不要重新设计第二套设置系统。

修改 `DialoguePanel.tsx`：

- 从 `settingsStore` 读取 `textSpeed`；
- 从已加载的 `gameData.settings.textSpeeds` 读取毫秒值；
- 统一使用慢 / 标准 / 快；
- 禁止继续使用按 `narration/dialogue/innerThought` 写死的 `speedMap`；
- 点击一次立即显示全文、再次点击推进的现有交互保留；
- 设置变化应在下一段文字立即生效；
- 不因切换速度产生多个计时器；
- 组件卸载或文本切换时必须清理计时器。

本轮只接通文字速度。完整BGM、环境音、音效、配音的统一AudioManager放到下一阶段，不要在本轮扩展。

---

## 任务G：补充最小自动测试体系

使用 Vitest。只测试纯逻辑和store，不要求本轮引入完整UI测试框架。

### G1. package.json

新增合理脚本：

```json
{
  "scripts": {
    "test": "vitest",
    "test:run": "vitest run",
    "check": "npm run test:run && npm run build"
  }
}
```

### G2. 建议测试文件

```text
src/engine/__tests__/saveManager.test.ts
src/engine/__tests__/gameEngine.choices.test.ts
src/app/stores/__tests__/gameStore.choiceTransaction.test.ts
src/app/stores/__tests__/gameStore.rollback.test.ts
```

### G3. 必测用例

1. 有效存档进入游戏后不会被 `startNewGame()` 覆盖；
2. 无存档时可正常新游戏；
3. 旧裸GameState存档可迁移；
4. 损坏JSON不会导致白屏；
5. 不存在的场景ID存档会被拒绝；
6. 普通选择效果只应用一次；
7. 关键选择双击效果只应用一次；
8. 关键选择确认后存档包含锁定ID；
9. 点击某条历史记录会回到其自己的快照，而不是最新快照；
10. 回滚会截断未来历史与快照；
11. 不允许跨越最近关键选择边界；
12. `visibleWhenLocked=true` 的不满足选项以锁定状态返回；
13. 普通不满足选项保持隐藏；
14. 同一 `choiceGroupId` 最终只返回一个版本；
15. 数值、信任、行动准备不会越界；
16. 存档写入失败时当前会话仍可继续。

测试不得依赖真实浏览器localStorage；使用可注入storage或测试替身。

---

## 五、允许修改的主要文件

可在保持现有架构的前提下修改或新增：

```text
src/pages/TitlePage.tsx
src/pages/GamePage.tsx
src/pages/SettingsPage.tsx
src/app/stores/gameStore.ts
src/app/stores/settingsStore.ts
src/engine/saveManager.ts
src/engine/gameEngine.ts
src/schemas/types.ts
src/schemas/gameSchema.ts
src/components/game/ChoicePanel.tsx
src/components/game/HistoryPanel.tsx
src/components/game/DialoguePanel.tsx
src/engine/__tests__/*
src/app/stores/__tests__/*
package.json
package-lock.json
PROGRESS.md
```

如确有必要可新增小型辅助模块，但不要进行与本轮无关的大规模目录重构。

---

## 六、禁止事项

本轮严禁：

- 开发 `/editor`；
- 开发Konva拖拽编辑器；
- 修改 `game-data.json` 的剧情文本、选项文案、数值与结局条件；
- 修改或重命名 `public/assets/` 现有素材；
- 新增角色、场景、结局或路线；
- 实现特殊页面模板；
- 实现完整AudioManager；
- 引入后端、账号、云存档或多存档槽；
- 移除现有数据驱动架构；
- 绕过Zustand直接修改运行状态；
- 为了“快速通过”而删除类型检查或降低Schema约束；
- 一次性继续执行下一阶段。

`/editor` 保持现状即可，不要删除路由和已有预留代码。

---

## 七、验收标准

以下条件必须全部满足：

- [ ] 标题页可明确选择新游戏、继续游戏、设置；
- [ ] 有效存档不会被新游戏初始化覆盖；
- [ ] 直接访问或刷新 `/game` 不会意外清空进度；
- [ ] 存档具有版本封装并通过Zod校验；
- [ ] 旧裸GameState存档可迁移；
- [ ] 一次选择只产生一次状态变化；
- [ ] 普通选择历史绑定准确快照；
- [ ] 点击历史中的指定条目会精确回滚；
- [ ] 回滚会截断未来记录；
- [ ] 无法跨越已确认关键选择；
- [ ] 锁定选项可见、不可点击并显示叙事化提示；
- [ ] `choiceGroupId` 不会显示重复版本；
- [ ] 设置页文字速度真正控制打字机；
- [ ] 损坏存档、缺失场景和storage异常不会造成白屏；
- [ ] 所有新增测试通过；
- [ ] `npm run check` 通过；
- [ ] `npm run build` 通过；
- [ ] 不修改剧情与素材；
- [ ] 不开发编辑器和下一阶段功能。

---

## 八、完成后的汇报格式

完成后必须按以下格式汇报：

```markdown
# P0运行时底层完成报告

## 1. 基线
- 开始分支与提交：
- npm ci结果：
- 修改前build结果：

## 2. 已修复问题
- 新游戏/继续游戏：
- 存档迁移与校验：
- 原子选择事务：
- 精确回滚：
- 关键选择边界：
- 锁定选项与choiceGroupId：
- 文字速度接入：

## 3. 文件变化
### 新增
### 修改
### 删除

## 4. 自动测试
- 测试文件：
- 用例数量：
- 运行结果：

## 5. 构建验证
- npm run test:run：
- npm run build：
- npm run check：

## 6. 未解决问题
只列本轮范围内确实尚未解决的内容，不要把下一阶段功能写成缺陷。

## 7. 手动验收步骤
给出从标题页开始的具体操作步骤。
```

更新 `PROGRESS.md`，记录真实完成情况，不得把尚未实现的功能写为完成。

最后使用中文提交信息：

```text
修复运行时会话、选择事务与回滚逻辑
```

提交完成后停止，不要继续特殊场景、音频系统或编辑器开发，等待下一条指令。
