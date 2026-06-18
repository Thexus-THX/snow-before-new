import { create } from "zustand";
import type { GameData, GameState, SceneDefinition, HistoryEntry, StateSnapshot, ChoiceDefinition } from "@/schemas/types";
import { GameEngine } from "@/engine/gameEngine";
import { loadSave, hasValidSave, buildSaveEnvelope, writeSave, clearSave } from "@/engine/saveManager";

/** 游戏启动模式 */
export type GameLaunchMode = "new" | "continue";

/** commitChoice 返回结果 */
export type CommitChoiceResult =
  | { ok: true; nextSceneId: string; visibleEffects: string[] }
  | { ok: false; reason: "busy" | "locked" | "already-applied" | "invalid-choice" | "missing-scene" };

/**
 * gameStore — 玩家端运行时状态
 *
 * 管理思路：
 * - gameData 在加载 JSON 后设置
 * - engine 在 loadGameData 时自动创建
 * - state 为当前游戏状态的唯一真实来源
 * - snapshots 存储状态快照（用于回滚，不存 GameState 内）
 * - 禁止直接修改 state，必须通过 action 方法
 */
interface GameStore {
  // ---- 数据 ----
  gameData: GameData | null;
  engine: GameEngine | null;
  state: GameState | null;
  snapshots: Record<string, StateSnapshot>;

  // ---- 提交防重 ----
  submittingChoice: boolean;

  // ---- 启动意图 ----
  launchMode: GameLaunchMode | null;
  setLaunchMode: (mode: GameLaunchMode) => void;

  // ---- 加载 ----
  loadGameData: (data: GameData) => void;
  startNewGame: () => SceneDefinition | null;
  continueGame: () => { success: boolean; reason?: string };

  // ---- 原子选择事务 ----
  commitChoice: (choice: ChoiceDefinition) => CommitChoiceResult;

  // ---- 场景推进 ----
  getCurrentScene: () => SceneDefinition | null;
  advanceScene: (sceneId: string) => SceneDefinition | null;

  // ---- 选择应用 ----
  applyChoiceEffect: (effects: import("@/schemas/types").EffectDefinition) => string[];
  lockCriticalChoice: (choiceId: string) => void;

  // ---- 派生值 ----
  getPreparation: () => number;
  getSocialTrust: () => number;
  getTrustStage: (trustValue: number) => string;
  getReliableCount: () => number;

  // ---- 标记 ----
  hasFlag: (flag: string) => boolean;
  addFlags: (flags: string[]) => void;
  removeFlags: (flags: string[]) => void;

  // ---- 回滚支持 ----
  setStateSnapshot: (next: GameState) => void;

  // ---- 历史与快照 ----
  recordHistoryEntry: (entry: Omit<HistoryEntry, "id" | "createdAt">) => void;
  createSnapshot: (label: string) => string;
  rollback: (snapshotId: string) => boolean;
  rollbackToHistoryEntry: (entry: HistoryEntry) => { success: boolean; reason?: string };
  canRollbackEntry: (entry: HistoryEntry) => { canRollback: boolean; reason?: string };
  getHistory: () => HistoryEntry[];
  getSnapshots: () => StateSnapshot[];
  clearTemporarySnapshot: (snapshotId: string) => void;

  // ---- 重置 ----
  reset: () => void;
}

export const useGameStore = create<GameStore>((set, get) => ({
  gameData: null,
  engine: null,
  state: null,
  snapshots: {},
  submittingChoice: false,
  launchMode: null,

  setLaunchMode: (mode: GameLaunchMode) => {
    set({ launchMode: mode });
  },

  loadGameData: (data: GameData) => {
    const engine = new GameEngine(data);
    set({ gameData: data, engine, state: null });
  },

  startNewGame: () => {
    const { engine, gameData } = get();
    if (!gameData || !engine) return null;

    // P0.1: 清除旧持久化存档
    const clearResult = clearSave();
    if (clearResult.status !== "ok") {
      console.warn("[gameStore] 清除旧存档失败:", clearResult.reason, "— 新游戏将继续");
    }

    const initial = structuredClone(gameData.initialState);
    set({ state: initial, snapshots: {} });
    return engine.getScene(initial.currentSceneId);
  },

  continueGame: () => {
    const { gameData } = get();
    if (!gameData) return { success: false, reason: "游戏数据未加载" };

    const result = loadSave(gameData);
    if (result.status === "ok" || result.status === "migrated") {
      const { state, snapshots } = result.save;
      set({ state: structuredClone(state), snapshots: structuredClone(snapshots) });
      return { success: true };
    }

    if (result.status === "not-found") {
      return { success: false, reason: "未找到存档" };
    }
    if (result.status === "corrupt") {
      return { success: false, reason: `存档已损坏: ${result.reason}` };
    }
    if (result.status === "incompatible") {
      return { success: false, reason: `存档不兼容: ${result.reason}` };
    }
    return { success: false, reason: result.reason };
  },

  // ---- 原子选择事务 ----

  commitChoice: (choice: ChoiceDefinition) => {
    const { state, engine, gameData, submittingChoice } = get();

    // 防重复提交
    if (submittingChoice) {
      return { ok: false, reason: "busy" };
    }
    if (!state || !engine || !gameData) {
      return { ok: false, reason: "invalid-choice" };
    }

    // 验证当前场景包含该选项
    const currentScene = engine.getScene(state.currentSceneId);
    if (!currentScene?.choices) {
      return { ok: false, reason: "invalid-choice" };
    }
    const found = currentScene.choices.find((c) => c.id === choice.id);
    if (!found) {
      return { ok: false, reason: "invalid-choice" };
    }

    // 验证选项当前可用（满足条件）
    if (found.conditions && !engine.evaluateConditionGroup(found.conditions, state)) {
      return { ok: false, reason: "locked" };
    }
    if (currentScene.conditions && !engine.evaluateConditionGroup(currentScene.conditions, state)) {
      return { ok: false, reason: "locked" };
    }

    // 关键选择不能重复提交
    if (found.isCritical && state.lockedCriticalChoiceIds.includes(found.id)) {
      return { ok: false, reason: "already-applied" };
    }

    // 验证 nextSceneId 存在
    const nextScene = engine.getScene(found.nextSceneId);
    if (!nextScene) {
      return { ok: false, reason: "missing-scene" };
    }

    // ---- 开始原子事务 ----
    set({ submittingChoice: true });

    // 1. 普通选择：创建快照
    let snapshotId: string | undefined;
    if (!found.isCritical) {
      snapshotId = `snap_${Date.now()}`;
      const snapshot: StateSnapshot = {
        id: snapshotId,
        sceneId: state.currentSceneId,
        state: structuredClone(state),
        createdAt: Date.now(),
      };
      set((prev) => ({
        snapshots: { ...prev.snapshots, [snapshotId!]: snapshot },
      }));
    }

    // 2. 应用效果
    const next = structuredClone(state);
    const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
    const visibleEffects: string[] = [];
    const effects = found.effects;

    if (effects) {
      // 长期数值
      if (effects.stats) {
        if (effects.stats.knowledge) {
          next.stats.knowledge = clamp(next.stats.knowledge + effects.stats.knowledge, 0, 10);
          visibleEffects.push(`学识 ${effects.stats.knowledge > 0 ? "+" : ""}${effects.stats.knowledge}`);
        }
        if (effects.stats.wellbeing) {
          next.stats.wellbeing = clamp(next.stats.wellbeing + effects.stats.wellbeing, 0, 10);
          visibleEffects.push(`身心 ${effects.stats.wellbeing > 0 ? "+" : ""}${effects.stats.wellbeing}`);
        }
        if (effects.stats.responsibility)
          next.stats.responsibility = clamp(next.stats.responsibility + effects.stats.responsibility, 0, 10);
        if (effects.stats.homesickness)
          next.stats.homesickness = clamp(next.stats.homesickness + effects.stats.homesickness, 0, 10);
      }

      // 准备清单
      if (effects.preparationItems) {
        const keys = ["route", "documents", "funds", "technicalMaterials", "contact"] as const;
        const labelMap: Record<string, string> = {
          route: "路线", documents: "票证", funds: "经费",
          technicalMaterials: "技术资料", contact: "联系人",
        };
        for (const k of keys) {
          const delta = effects.preparationItems[k];
          if (delta !== undefined && delta !== 0) {
            next.preparationItems[k] = clamp(next.preparationItems[k] + delta, 0, 2);
            visibleEffects.push(`${labelMap[k]} ${delta > 0 ? "+" : ""}${delta}`);
          }
        }
      }

      // 角色信任
      if (effects.trust) {
        const tKeys = ["chen", "nadya", "belov", "ivan"] as const;
        for (const k of tKeys) {
          const delta = effects.trust[k];
          if (delta !== undefined) {
            next.trust[k] = clamp(next.trust[k] + delta, 0, 10);
          }
        }
      }

      // 合作修正
      if (effects.cooperationModifier !== undefined) {
        next.cooperationModifier = clamp(next.cooperationModifier + effects.cooperationModifier, -2, 2);
      }

      // 倾向
      if (effects.returnTendency !== undefined) {
        next.returnTendency += effects.returnTendency;
        visibleEffects.push(`归国倾向 ${effects.returnTendency > 0 ? "+" : ""}${effects.returnTendency}`);
      }
      if (effects.stayTendency !== undefined) {
        next.stayTendency += effects.stayTendency;
        visibleEffects.push(`留苏倾向 ${effects.stayTendency > 0 ? "+" : ""}${effects.stayTendency}`);
      }

      // 标记
      if (effects.addFlags) {
        for (const f of effects.addFlags) {
          if (!next.flags.includes(f)) next.flags.push(f);
        }
      }
      if (effects.removeFlags) {
        next.flags = next.flags.filter((f) => !effects.removeFlags!.includes(f));
      }
    }

    // 3. 写入选择历史（含 rollbackSnapshotId）
    const historyEntry: HistoryEntry = {
      id: `${state.currentSceneId}_choice_${Date.now()}`,
      sceneId: state.currentSceneId,
      type: "choice",
      text: found.text,
      visibleEffects,
      isCritical: found.isCritical,
      isLocked: found.isCritical,
      rollbackSnapshotId: snapshotId,
      createdAt: Date.now(),
    };
    next.history.push(historyEntry);

    // 4. 关键选择：写入 lockedCriticalChoiceIds
    if (found.isCritical) {
      if (!next.lockedCriticalChoiceIds.includes(found.id)) {
        next.lockedCriticalChoiceIds.push(found.id);
      }
    }

    // 5. 推进到下一场景
    const prevScene = engine.getScene(state.currentSceneId);
    next.currentSceneId = found.nextSceneId;
    next.chapterId = nextScene.chapterId;
    if (!next.visitedSceneIds.includes(found.nextSceneId)) {
      next.visitedSceneIds.push(found.nextSceneId);
    }

    // 6. 写入前一场景文本历史
    if (prevScene?.content?.text) {
      const textEntry: HistoryEntry = {
        id: `${found.nextSceneId}_text_${Date.now()}`,
        sceneId: prevScene.id,
        type: prevScene.content.textType === "narration" ? "system" : "text",
        speakerName: prevScene.content.speakerName,
        text: prevScene.content.text,
        createdAt: Date.now(),
      };
      next.history.push(textEntry);
    }

    // 7. 自动存档（关键选择或目标场景有存档点）
    const shouldAutoSave = found.isCritical || !!nextScene.autoSavePoint;
    if (shouldAutoSave) {
      const save = buildSaveEnvelope(next, get().snapshots, gameData.meta.version);
      writeSave(save);
    }

    // 8. 一次性提交所有状态
    set({ state: next, submittingChoice: false });

    return { ok: true, nextSceneId: found.nextSceneId, visibleEffects };
  },

  getCurrentScene: () => {
    const { engine, state } = get();
    if (!engine || !state) return null;
    return engine.getScene(state.currentSceneId);
  },

  advanceScene: (sceneId: string) => {
    const { engine, state } = get();
    if (!state || !engine) return null;

    const prevScene = engine.getScene(state.currentSceneId);
    const scene = engine.getScene(sceneId);
    if (!scene) return null;

    const next = structuredClone(state);
    next.currentSceneId = sceneId;
    next.chapterId = scene.chapterId;
    if (!next.visitedSceneIds.includes(sceneId)) {
      next.visitedSceneIds.push(sceneId);
    }
    // 记录历史（文本类）
    if (prevScene?.content?.text) {
      const historyEntry: HistoryEntry = {
        id: `${sceneId}_${Date.now()}`,
        sceneId: prevScene.id,
        type: prevScene.content.textType === "narration" ? "system" : "text",
        speakerName: prevScene.content.speakerName,
        text: prevScene.content.text,
        createdAt: Date.now(),
      };
      next.history.push(historyEntry);
    }
    // 自动存档节点 → 统一经过 saveManager（P0.1）
    if (scene.autoSavePoint) {
      const { gameData } = get();
      if (gameData) {
        const envelope = buildSaveEnvelope(next, get().snapshots, gameData.meta.version);
        writeSave(envelope);
      }
    }
    set({ state: next });
    return scene;
  },

  applyChoiceEffect: (effects) => {
    const { state } = get();
    if (!state) return;

    const next = structuredClone(state);

    const clamp = (v: number, lo: number, hi: number) =>
      Math.max(lo, Math.min(hi, v));

    const visibleEffects: string[] = [];

    // 长期数值
    if (effects.stats) {
      if (effects.stats.knowledge) {
        next.stats.knowledge = clamp(next.stats.knowledge + effects.stats.knowledge, 0, 10);
        visibleEffects.push(`学识 ${effects.stats.knowledge > 0 ? "+" : ""}${effects.stats.knowledge}`);
      }
      if (effects.stats.wellbeing) {
        next.stats.wellbeing = clamp(next.stats.wellbeing + effects.stats.wellbeing, 0, 10);
        visibleEffects.push(`身心 ${effects.stats.wellbeing > 0 ? "+" : ""}${effects.stats.wellbeing}`);
      }
      if (effects.stats.responsibility)
        next.stats.responsibility = clamp(next.stats.responsibility + effects.stats.responsibility, 0, 10);
      if (effects.stats.homesickness)
        next.stats.homesickness = clamp(next.stats.homesickness + effects.stats.homesickness, 0, 10);
    }

    // 准备清单
    if (effects.preparationItems) {
      const keys = ["route", "documents", "funds", "technicalMaterials", "contact"] as const;
      const labelMap: Record<string, string> = {
        route: "路线", documents: "票证", funds: "经费",
        technicalMaterials: "技术资料", contact: "联系人",
      };
      for (const k of keys) {
        const delta = effects.preparationItems[k];
        if (delta !== undefined) {
          next.preparationItems[k] = clamp(next.preparationItems[k] + delta, 0, 2);
          visibleEffects.push(`${labelMap[k]} ${delta > 0 ? "+" : ""}${delta}`);
        }
      }
    }

    // 角色信任
    if (effects.trust) {
      const tKeys = ["chen", "nadya", "belov", "ivan"] as const;
      for (const k of tKeys) {
        const delta = effects.trust[k];
        if (delta !== undefined) {
          next.trust[k] = clamp(next.trust[k] + delta, 0, 10);
        }
      }
    }

    // 合作修正
    if (effects.cooperationModifier !== undefined) {
      next.cooperationModifier = clamp(next.cooperationModifier + effects.cooperationModifier, -2, 2);
    }

    // 倾向
    if (effects.returnTendency !== undefined) {
      next.returnTendency += effects.returnTendency;
      visibleEffects.push(`归国倾向 ${effects.returnTendency > 0 ? "+" : ""}${effects.returnTendency}`);
    }
    if (effects.stayTendency !== undefined) {
      next.stayTendency += effects.stayTendency;
      visibleEffects.push(`留苏倾向 ${effects.stayTendency > 0 ? "+" : ""}${effects.stayTendency}`);
    }

    // 标记
    if (effects.addFlags) {
      for (const f of effects.addFlags) {
        if (!next.flags.includes(f)) next.flags.push(f);
      }
    }
    if (effects.removeFlags) {
      next.flags = next.flags.filter((f) => !effects.removeFlags!.includes(f));
    }

    set({ state: next });
    return visibleEffects;
  },

  lockCriticalChoice: (choiceId: string) => {
    const { state } = get();
    if (!state) return;
    const next = structuredClone(state);
    if (!next.lockedCriticalChoiceIds.includes(choiceId)) {
      next.lockedCriticalChoiceIds.push(choiceId);
    }
    // 关键选择确认后自动存档 → 统一经过 saveManager（P0.1）
    const { gameData } = get();
    if (gameData) {
      const envelope = buildSaveEnvelope(next, get().snapshots, gameData.meta.version);
      writeSave(envelope);
    }
    set({ state: next });
  },

  getPreparation: () => {
    const { state } = get();
    if (!state) return 0;
    const p = state.preparationItems;
    return p.route + p.documents + p.funds + p.technicalMaterials + p.contact;
  },

  getSocialTrust: () => {
    const { state } = get();
    if (!state) return 0;
    const { trust, cooperationModifier } = state;
    const base = Math.round(
      (trust.chen + trust.nadya + trust.belov + trust.ivan) / 4
    );
    return Math.max(0, Math.min(10, base + cooperationModifier));
  },

  getTrustStage: (trustValue: number) => {
    if (trustValue <= 2) return "疏离";
    if (trustValue <= 4) return "熟识";
    if (trustValue <= 6) return "信任";
    if (trustValue <= 8) return "可靠";
    return "深厚";
  },

  getReliableCount: () => {
    const { state } = get();
    if (!state) return 0;
    const { trust } = state;
    return [trust.chen, trust.nadya, trust.belov, trust.ivan].filter(
      (v) => v >= 7
    ).length;
  },

  hasFlag: (flag: string) => {
    const { state } = get();
    return state?.flags.includes(flag) ?? false;
  },

  addFlags: (flags: string[]) => {
    const { state } = get();
    if (!state) return;
    const next = structuredClone(state);
    for (const f of flags) {
      if (!next.flags.includes(f)) next.flags.push(f);
    }
    set({ state: next });
  },

  removeFlags: (flags: string[]) => {
    const { state } = get();
    if (!state) return;
    const next = structuredClone(state);
    next.flags = next.flags.filter((f) => !flags.includes(f));
    set({ state: next });
  },

  setStateSnapshot: (next: GameState) => {
    set({ state: next });
  },

  // ---- 历史记录 ----

  recordHistoryEntry: (entry) => {
    const { state } = get();
    if (!state) return;
    const next = structuredClone(state);
    const historyEntry: HistoryEntry = {
      ...entry,
      id: `${entry.sceneId}_${entry.type}_${Date.now()}`,
      createdAt: Date.now(),
    };
    next.history.push(historyEntry);
    set({ state: next });
  },

  getHistory: () => {
    const { state } = get();
    return state?.history ?? [];
  },

  // ---- 快照与回滚 ----

  createSnapshot: (label: string) => {
    const { state } = get();
    if (!state) return "";
    const id = `snap_${Date.now()}`;
    const snapshot: StateSnapshot = {
      id,
      sceneId: state.currentSceneId,
      state: structuredClone(state),
      createdAt: Date.now(),
    };
    set((prev) => ({
      snapshots: { ...prev.snapshots, [id]: snapshot },
    }));
    return id;
  },

  rollback: (snapshotId: string) => {
    const { snapshots } = get();
    const snapshot = snapshots[snapshotId];
    if (!snapshot) return false;
    set({ state: structuredClone(snapshot.state) });
    return true;
  },

  /**
   * 精确回滚到指定历史条目对应的快照
   *
   * - 使用 entry.rollbackSnapshotId（而非最新快照）
   * - 截断目标时间点之后的历史
   * - 删除目标时间点之后的临时快照
   * - 校验关键选择边界
   * - 回滚后自动存档
   */
  rollbackToHistoryEntry: (entry: HistoryEntry) => {
    const { state, snapshots, gameData } = get();
    if (!state || !gameData) {
      return { success: false, reason: "游戏状态未初始化" };
    }

    // 1. 边界校验：不能跨越关键选择
    const boundaryCheck = get().canRollbackEntry(entry);
    if (!boundaryCheck.canRollback) {
      return { success: false, reason: boundaryCheck.reason ?? "无法回退" };
    }

    // 2. 必须有 rollbackSnapshotId
    if (!entry.rollbackSnapshotId) {
      return { success: false, reason: "该条目没有关联的快照" };
    }

    // 3. 快照必须存在
    const snapshot = snapshots[entry.rollbackSnapshotId];
    if (!snapshot) {
      return { success: false, reason: "回滚快照不存在（可能已被清理）" };
    }

    // 4. 恢复快照状态
    const restoredState = structuredClone(snapshot.state);

    // 5. 截断历史：找到该 entry 在 history 中的位置
    const entryIndex = state.history.findIndex((h) => h.id === entry.id);
    if (entryIndex === -1) {
      return { success: false, reason: "历史条目不在当前记录中" };
    }

    // 保留该条目及之前的历史，删除之后的
    // 注意：entry 本身是选择记录，回退到选择发生前，所以应保留到 entry 之前
    const truncatedHistory = state.history.slice(0, entryIndex);
    restoredState.history = truncatedHistory;

    // 6. 清理目标快照之后创建的临时快照
    const targetTime = snapshot.createdAt;
    const keptSnapshots: Record<string, StateSnapshot> = {};
    for (const [id, snap] of Object.entries(snapshots)) {
      if (snap.createdAt <= targetTime) {
        keptSnapshots[id] = snap;
      }
    }

    // 7. 回退到快照对应的场景
    restoredState.currentSceneId = snapshot.sceneId;

    // 8. 自动存档
    const save = buildSaveEnvelope(restoredState, keptSnapshots, gameData.meta.version);
    writeSave(save);

    // 9. 提交状态
    set({ state: restoredState, snapshots: keptSnapshots });

    return { success: true };
  },

  /**
   * 判断某条历史条目是否可以回滚
   *
   * 规则：
   * - 必须是普通选择（type === "choice" && !isCritical && !isLocked）
   * - 必须有 rollbackSnapshotId
   * - 该条目之后没有已确认的关键选择（不可跨越边界）
   */
  canRollbackEntry: (entry: HistoryEntry) => {
    // 基本条件
    if (entry.type !== "choice") {
      return { canRollback: false, reason: "只有选择可以回退" };
    }
    if (entry.isCritical || entry.isLocked) {
      return { canRollback: false, reason: "关键选择不可回退" };
    }
    if (!entry.rollbackSnapshotId) {
      return { canRollback: false, reason: "该选择没有关联的回退点" };
    }

    // 关键选择边界：检查该条目之后是否有已确认的关键选择
    const { state } = get();
    if (!state) return { canRollback: false, reason: "状态未初始化" };

    const entryIndex = state.history.findIndex((h) => h.id === entry.id);
    if (entryIndex === -1) {
      return { canRollback: false, reason: "该条目不在当前历史中" };
    }

    // 检查该条目之后的历史中是否有已确认的关键选择
    const afterEntries = state.history.slice(entryIndex + 1);
    const hasCriticalAfter = afterEntries.some((h) => h.isCritical && h.isLocked);

    if (hasCriticalAfter) {
      return { canRollback: false, reason: "该选择位于已确认的关键决定之前，无法回退" };
    }

    return { canRollback: true };
  },

  getSnapshots: () => {
    const { snapshots } = get();
    return Object.values(snapshots).sort((a, b) => b.createdAt - a.createdAt);
  },

  clearTemporarySnapshot: (snapshotId: string) => {
    set((prev) => {
      const next = { ...prev.snapshots };
      delete next[snapshotId];
      return { snapshots: next };
    });
  },

  reset: () => {
    set({ gameData: null, engine: null, state: null, snapshots: {} });
  },
}));
