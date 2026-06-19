# 《雪落之前》CodeBuddy 任务：P0.1 存档一致性与新游戏覆盖修复

## 0. 仓库与分支

仓库：

```text
https://github.com/Thexus-THX/snow-before-new.git
```

基线分支：

```text
develop
```

请从最新 `develop` 创建工作分支：

```text
fix/runtime-save-consistency-p0-1
```

本任务是 P0 运行时底层完成后的补充纠错。完成本任务前，不进入特殊场景模板、编辑器或完整音频系统开发。

---

## 1. 开始前必须执行

```bash
git checkout develop
git pull origin develop
git checkout -b fix/runtime-save-consistency-p0-1
npm ci
npm run check
```

阅读并核对：

```text
src/app/stores/gameStore.ts
src/engine/saveManager.ts
src/pages/TitlePage.tsx
src/pages/GamePage.tsx
src/app/stores/__tests__/
src/engine/__tests__/
PROGRESS.md
```

以当前实际代码为准，不擅自扩大任务范围。

---

## 2. 已确认的两个 P0 遗留问题

### 问题 A：开始新游戏没有立即清除旧存档

当前标题页会提示“开始新游戏将覆盖现有进度”，随后设置 `launchMode = "new"`；但 `startNewGame()` 只初始化内存状态，没有立即删除或覆盖旧的持久化存档。

可能结果：

1. 玩家已有旧存档；
2. 选择“开始新游戏”；
3. 在抵达下一个自动存档点前关闭页面；
4. 再次点击“继续游戏”；
5. 仍然读取旧周目进度。

这与界面提示和玩家预期不一致。

### 问题 B：`advanceScene()` 仍直接写入裸 `GameState`

当前 `advanceScene()` 在目标场景包含 `autoSavePoint` 时，仍直接执行类似：

```ts
localStorage.setItem("snow-before-v1-save", JSON.stringify(next));
```

这会绕过 `saveManager.ts` 的 `SaveEnvelope`：

```text
schemaVersion
gameId
gameDataVersion
savedAt
state
snapshots
```

后果包括：

- 新格式存档被重新覆盖成旧裸格式；
- 下次加载只能再次走旧存档迁移；
- 快照集合可能丢失；
- 自动存档后的精确回滚可能失效；
- 存档引用校验和错误处理被绕过。

---

## 3. 本轮目标

建立唯一、统一的持久化写入通道：

> 任何运行时存档写入，都必须经过 `saveManager.ts`，禁止在页面、组件或 Store 中直接读写 `snow-before-v1-save`。

同时确保：

> 玩家确认开始新游戏后，旧周目持久化存档立即失效，不会在关闭页面后重新出现。

---

## 4. 具体实现要求

### 4.1 修复开始新游戏流程

调整 `startNewGame()` 或新增明确的新游戏入口，使“开始新游戏”执行以下原子顺序：

1. 清除旧持久化存档；
2. 清空旧快照；
3. 从 `gameData.initialState` 创建全新内存状态；
4. 清除旧 `launchMode` 或将其消费后重置；
5. 返回起始场景。

要求：

- 使用 `saveManager.clearSave()`，禁止直接 `localStorage.removeItem()`；
- 即使 localStorage 不可用，新游戏当前会话仍可正常开始；
- 若清除失败，允许游戏继续，但要留下可诊断的警告信息；
- 不得修改剧情数据和初始数值。

可以选择以下任一清晰方案：

```ts
startNewGame({ clearPersistedSave: true })
```

或：

```ts
beginNewGame()
```

但不要保留语义模糊、容易误用的重复入口。

### 4.2 统一所有自动存档写入

在 `gameStore.ts` 中建立单一内部持久化函数，例如：

```ts
persistState(nextState, nextSnapshots)
```

它必须：

1. 使用 `buildSaveEnvelope()`；
2. 使用 `writeSave()`；
3. 写入当前 `gameData.meta.version`；
4. 同时保存 `state` 与 `snapshots`；
5. 返回明确结果，不抛出未处理异常。

以下路径全部改用该函数：

- `commitChoice()` 中的关键选择存档；
- `commitChoice()` 进入 `autoSavePoint` 时的存档；
- `advanceScene()` 进入 `autoSavePoint` 时的存档；
- 仍保留的 `lockCriticalChoice()` 存档路径；
- 回滚后的自动存档；
- 其他任何搜索到的运行时存档写入。

执行全仓搜索：

```bash
rg 'snow-before-v1-save|localStorage\.setItem|localStorage\.removeItem' src
```

允许 `saveManager.ts` 和设置 Store 管理各自独立键；游戏进度键不得在 `saveManager.ts` 以外直接操作。

### 4.3 保证快照不会在普通场景推进后丢失

必须验证以下流程：

1. 玩家完成普通选择；
2. 创建可回滚快照；
3. 继续经过若干无选择的文本场景；
4. 进入 `autoSavePoint`；
5. 刷新页面并继续游戏；
6. 对应普通选择仍可按照规则精确回滚。

若当前设计不允许刷新后保留回滚能力，请不要默默放弃快照；应以现有 P0 设计“SaveEnvelope 保存 snapshots”为准实现。

### 4.4 清理或封装遗留存档 API

当前 Store 中仍有旧式公开方法，例如：

```text
applyChoiceEffect
lockCriticalChoice
createSnapshot
rollback
recordHistoryEntry
```

本轮不要求大规模重构，但必须做到：

- 玩家正常运行路径只使用 `commitChoice()`；
- 旧方法不得继续绕过统一存档通道；
- 若某方法已无外部引用，可安全删除；
- 若测试或未来接口仍需保留，应标记为内部/兼容方法并保证行为正确；
- 不要同时维护两套互相矛盾的存档实现。

### 4.5 启动意图消费

`launchMode` 是一次性导航意图。完成初始化后应重置为 `null`，避免之后直接访问 `/game` 时继承上一次的 `new` 或 `continue` 意图。

要求补充测试：

- `new` 被消费后重置；
- `continue` 被消费后重置；
- 无意图直接进入 `/game` 时，仍按“有效存档优先，否则新游戏”处理。

---

## 5. 必须新增或补充的测试

至少覆盖以下用例：

### 新游戏覆盖

1. 先写入有效旧存档；
2. 执行开始新游戏；
3. 旧存档立即被清除或被全新状态覆盖；
4. 在任何后续自动存档前模拟刷新；
5. 不得恢复旧周目。

### 自动存档格式

1. `advanceScene()` 进入 `autoSavePoint`；
2. 读取存储内容；
3. 必须包含：

```text
schemaVersion = 1
gameId = snow-before-v1
gameDataVersion
savedAt
state
snapshots
```

4. 不得是裸 `GameState`。

### 快照保留

1. 普通选择创建快照；
2. 推进到自动存档点；
3. 重新加载存档；
4. `snapshots` 仍存在；
5. `rollbackSnapshotId` 引用有效；
6. 回滚成功。

### 存储失败降级

模拟 localStorage 写入失败：

- 当前会话仍然继续；
- 不抛出导致白屏的异常；
- 可从返回值或 Store 状态诊断保存失败。

### 启动意图

- `launchMode` 初始化后被消费并清空；
- 不会污染下一次进入游戏。

测试文件可在现有测试基础上扩展，例如：

```text
src/app/stores/__tests__/gameStore.saveConsistency.test.ts
src/engine/__tests__/saveManager.test.ts
```

---

## 6. 验收标准

以下条件全部满足才算完成：

- [ ] 开始新游戏后，旧存档立即失效；
- [ ] `advanceScene()` 不再直接写裸 `GameState`；
- [ ] 所有游戏进度写入统一经过 `saveManager.ts`；
- [ ] 所有自动存档均为 `SaveEnvelope`；
- [ ] 自动存档完整保留 snapshots；
- [ ] 刷新并继续后，允许回滚的普通选择仍可精确回滚；
- [ ] localStorage 故障不会导致白屏；
- [ ] `launchMode` 使用后重置；
- [ ] 新增测试通过；
- [ ] 现有测试全部通过；
- [ ] `npm run check` 通过；
- [ ] `npm run build` 通过。

---

## 7. 禁止事项

本轮不要：

- 开发编辑器；
- 开发特殊场景模板；
- 扩展完整音频系统；
- 修改 `game-data.json` 剧情、选项或数值；
- 修改美术和音频素材；
- 新增角色或结局；
- 重构整个 Zustand 架构；
- 引入后端、账号或云存档；
- 顺手做无关 UI 美化。

---

## 8. 完成后的输出

完成后执行：

```bash
npm run check
npm run build
```

更新：

```text
PROGRESS.md
```

报告中必须列出：

1. 修改和新增文件；
2. 两个遗留问题分别如何修复；
3. 是否仍存在直接操作游戏进度 localStorage 的代码；
4. 新增测试用例数量与结果；
5. `npm run check` 和 `npm run build` 结果；
6. 仍存在的风险。

使用中文 Git 提交：

```text
修复新游戏覆盖与自动存档格式一致性
```

提交后停止，不进入 P1。
