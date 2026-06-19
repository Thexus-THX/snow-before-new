---
name: P0-runtime-foundation
overview: 实现《雪落之前》P0运行时底层纠错：新游戏/继续游戏流程、版本化存档、原子选择事务、精确回滚、关键选择边界、锁定选项三态、文字速度接入、自动测试体系
todos:
  - id: install-vitest
    content: 安装 vitest 并配置 package.json 测试脚本
    status: pending
  - id: implement-save-manager
    content: 实现 src/engine/saveManager.ts：SaveEnvelope、Zod校验、旧存档迁移、LoadSaveResult
    status: pending
  - id: implement-launch-flow
    content: 实现标题页三按钮（新游戏/继续/设置）和 GamePage 启动意图判断
    status: pending
    dependencies:
      - implement-save-manager
  - id: implement-commit-choice
    content: 在 gameStore 中实现 commitChoice 原子事务方法，替代 GamePage 中分散的 Store 调用
    status: pending
  - id: implement-rollback-boundary
    content: 修复精确回滚（使用 entry.rollbackSnapshotId）并实现关键选择不可跨越边界
    status: pending
    dependencies:
      - implement-commit-choice
  - id: implement-resolved-choices
    content: 实现 ResolvedChoice 三态和 choiceGroupId 去重，更新 ChoicePanel 渲染锁定选项
    status: pending
  - id: fix-text-speed
    content: 修改 DialoguePanel 从 settingsStore 读取文字速度，移除硬编码 speedMap
    status: pending
  - id: write-tests
    content: 编写 4 个 Vitest 测试文件覆盖 16 个必测用例
    status: pending
    dependencies:
      - install-vitest
      - implement-save-manager
      - implement-commit-choice
      - implement-rollback-boundary
      - implement-resolved-choices
  - id: verify-and-commit
    content: 运行 npm run check，更新 PROGRESS.md，中文 Git 提交
    status: pending
    dependencies:
      - write-tests
      - fix-text-speed
---

## P0 运行时底层纠错与稳定化

严格按照 `docs/08_CODEBUDDY_RUNTIME_FOUNDATION_P0.md` 执行，修复当前仓库中已确认的 9 个运行时缺陷。

### 任务 A：新游戏 / 继续游戏启动流程

**A1. 标题页按钮**
在 `TitlePage.tsx` 中将单个"开始游戏"按钮改为三个按钮：

- **开始新游戏**：点击后若存在有效存档，弹出覆盖确认；无存档则直接进入
- **继续游戏**：仅在有有效存档时可点击，无存档时置灰
- **设置**：跳转 `/settings`

**A2. 启动意图传递**
使用路由 state 传递 `GameLaunchMode`（`"new" | "continue"`）：

- 刷新 `/game` 时不能意外新开周目
- 直接访问 `/game` 时：优先继续有效存档，无存档才新建
- `GamePage` 不再无条件调用 `startNewGame()`

### 任务 B：版本化 SaveManager

在 `src/engine/saveManager.ts` 中实现完整存档管理器：

- **SaveEnvelope** 封装：schemaVersion、gameId、gameDataVersion、savedAt、state、snapshots
- **Zod 校验**：复用 `gameSchema.ts` 中的 `gameStateSchema`，新增 `saveEnvelopeSchema`
- **旧存档迁移**：检测裸 GameState 自动转换为 SaveEnvelope
- **LoadSaveResult** 联合类型：ok / not-found / migrated / corrupt / incompatible / storage-unavailable
- **API**：`hasValidSave()`、`loadSave()`、`writeSave()`、`clearSave()`、`migrateLegacySave()`
- localStorage 键名保持 `snow-before-v1-save` 以兼容旧版本
- localStorage 不可用时安全降级，不白屏

### 任务 C：原子选择事务

在 `gameStore` 中新增 `commitChoice(choice)` 方法，一次调用完成：

1. 验证选项属于当前场景且可用
2. 防重复提交（store 层幂等保护）
3. 普通选择先创建快照并写入 `rollbackSnapshotId`
4. 应用数值、准备、信任、倾向、标记效果
5. 生成显性变化文本
6. 写入选择历史（含快照 ID）
7. 关键选择写入 `lockedCriticalChoiceIds`
8. 推进到下一场景
9. 自动存档
10. 返回 `CommitChoiceResult`

### 任务 D：精确回滚与关键选择边界

**D1. 精确回滚**：`handleRollback` 使用 `entry.rollbackSnapshotId` 而非最新快照
**D2. 截断未来**：回滚后删除目标时间点之后的历史和临时快照
**D3. 关键选择边界**：

- 关键选择本身不可回滚
- 位于最近一次关键选择之前的普通选择也不可回滚
- 由 store 计算每条记录的 `canRollback`
- HistoryPanel 显示叙事化提示

### 任务 E：锁定选项三态

- 新增 `ChoiceAvailability` 类型：`"available" | "locked" | "hidden"`
- 新增 `ResolvedChoice` 接口
- `GameEngine.getResolvedChoices()` 替代 `getVisibleChoices()`
- 处理 `visibleWhenLocked`：条件不满足但锁定可见时返回 `locked` 状态
- 处理 `choiceGroupId`：同组只返回一个版本（优先满足条件的）
- ChoicePanel 渲染锁定选项：不可点击，显示 `lockedHint`

### 任务 F：文字速度接入设置

- `DialoguePanel.tsx` 从 `settingsStore` 读取 `textSpeed`
- 从 `gameData.settings.textSpeeds` 读取毫秒值
- 移除硬编码 `speedMap`
- 设置变化在下一段文字立即生效
- 组件卸载时清理计时器

### 任务 G：Vitest 自动测试体系

- 安装 vitest
- 新增 `test`、`test:run`、`check` 脚本
- 创建 4 个测试文件覆盖：存档、选择事务、回滚、选项三态
- 16 个必测用例

## 技术方案

### 实现策略

本轮在现有 Zustand + React + TypeScript 架构基础上进行运行时修正，不引入新架构模式。核心原则：**所有状态修改必须通过 Zustand store 的 action 方法**，组件层不再直接编排多步操作。

### 关键技术决策

1. **启动模式传递**：使用 React Router 的 `useLocation().state` 传递 `GameLaunchMode`，配合 `useEffect` 判断启动意图。刷新时 state 丢失则回退到"优先继续有效存档"逻辑。

2. **SaveManager 独立模块**：将存档逻辑从 `gameStore.ts` 抽离到 `src/engine/saveManager.ts`，提供纯函数式 API。`gameStore.continueGame()` 调用 `SaveManager.loadSave()` 并处理结果。

3. **原子事务**：在 `gameStore` 中新增 `commitChoice` 方法，使用 Zustand 的 `set()` 在一次状态计算中完成所有操作。通过 `committingRef`（useRef 模式）防止重复提交。

4. **ResolvedChoice 类型**：在 `types.ts` 中新增类型定义，`GameEngine.getResolvedChoices()` 返回带可用性状态的选项列表。`choiceGroupId` 去重逻辑使用 Map 保证稳定性。

5. **回滚边界计算**：在 store 中新增 `getLastCriticalChoiceIndex()` selector，返回最近关键选择在历史中的索引。`canRollback` 判断该索引之前的历史条目。

### 性能考虑

- 所有 Zod 校验仅在存档加载时执行一次，不在每帧运行
- `getResolvedChoices` 结果可缓存（场景切换时失效）
- localStorage 写入使用现有频率（仅存档节点和关键选择时写入）
- 测试使用 vitest 的 `vi.fn()` mock localStorage，不依赖真实浏览器 API

### 文件变更范围

仅修改文档允许的文件列表，不触及 `game-data.json`、`public/assets/`、`/editor` 路由。