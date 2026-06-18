import { create } from "zustand";
import type { GameData, GameState, SceneDefinition, HistoryEntry, StateSnapshot } from "@/schemas/types";
import { GameEngine } from "@/engine/gameEngine";
import { loadSave, hasValidSave, buildSaveEnvelope, writeSave, clearSave } from "@/engine/saveManager";

/**
 * gameStore — 玩家端运行时状态
 *
 * 管理思路：
 * - gameData 在加载 JSON 后设置
 * - engine 在 loadGameData 时自动创建
 * - state 为当前游戏状态的唯一真实来源
 * - snapshots 存储状态快照（用于回滚，不存 GameState 内）
 * - 禁止直接修改 state，必须通过 action 方法
 * - 所有持久化存档统一经过 persistState()
 */
interface GameStore {
  // ---- 数据 ----
  gameData: GameData | null;
  engine: GameEngine | null;
  state: GameState | null;
  snapshots: Record<string, StateSnapshot>;

  // ---- 加载 ----
  loadGameData: (data: GameData) => void;
  startNewGame: () => SceneDefinition | null;
  continueGame: () => boolean;

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

  // ============================================================
  // 内部统一持久化通道
  // ============================================================

  /**
   * 内部函数：统一持久化写入
   * 所有自动存档必须通过此通道，禁止绕过 saveManager 直接操作 localStorage
   */
  _persistState: (nextState: GameState, nextSnapshots?: Record<string, StateSnapshot>) => {
    const { gameData } = get();
    if (!gameData) return;
    const snaps = nextSnapshots ?? get().snapshots;
    const envelope = buildSaveEnvelope(nextState, snaps, gameData.meta.version);
    const result = writeSave(envelope);
    if (result.status !== "ok") {
      console.warn("[gameStore] 自动存档失败:", result.reason, "— 当前会话不受影响");
    }
  },

  loadGameData: (data: GameData) => {
    const engine = new GameEngine(data);
    set({ gameData: data, engine, state: null });
  },

  startNewGame: () => {
    const { engine, gameData } = get();
    if (!gameData || !engine) return null;

    // 1. 清除旧持久化存档
    const clearResult = clearSave();
    if (clearResult.status !== "ok") {
      console.warn("[gameStore] 清除旧存档失败:", clearResult.reason, "— 新游戏将继续");
    }

    // 2. 清空快照，从 initialState 创建全新内存状态
    const initial = structuredClone(gameData.initialState);
    set({ state: initial, snapshots: {} });

    return engine.getScene(initial.currentSceneId);
  },

  continueGame: () => {
    const { gameData } = get();
    if (!gameData) return false;

    const result = loadSave(gameData);
    if (result.status === "ok" || result.status === "migrated") {
      const { state, snapshots } = result.save;
      set({ state: structuredClone(state), snapshots: structuredClone(snapshots) });
      return true;
    }
    if (result.status === "corrupt" || result.status === "incompatible") {
      console.warn("[gameStore] 存档不可用:", result.reason);
    }
    return false;
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
    // 自动存档节点 → 统一经过 saveManager
    if (scene.autoSavePoint) {
      (get() as any)._persistState(next);
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
    // 关键选择确认后自动存档 → 统一经过 saveManager
    (get() as any)._persistState(next);
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
