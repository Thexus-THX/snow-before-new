import { describe, it, expect, beforeEach } from "vitest";
import { useGameStore } from "@/app/stores/gameStore";
import { STORAGE_KEY } from "@/engine/saveManager";
import type { GameData } from "@/schemas/types";

// ============================================================
// 辅助
// ============================================================

function makeGameData(): GameData {
  return {
    meta: { id: "snow-before-v1", title: "雪落之前", version: "1.0.0", startSceneId: "s1", continueEnabled: true, logicalWidth: 1920, logicalHeight: 1080, sceneHeight: 864, dialogueHeight: 216, topStatusHeight: 72 },
    characters: {},
    initialState: { currentSceneId: "s1", chapterId: "ch1", stats: { knowledge: 5, wellbeing: 5, responsibility: 5, homesickness: 5 }, preparationItems: { route: 0, documents: 0, funds: 0, technicalMaterials: 0, contact: 0 }, trust: { chen: 5, nadya: 5, belov: 5, ivan: 5 }, cooperationModifier: 0, returnTendency: 0, stayTendency: 0, flags: [], lockedCriticalChoiceIds: [], history: [], visitedSceneIds: ["s1"] },
    chapters: [{ id: "ch1", title: "序章", year: 1950, season: "prologue", location: "", introSceneId: "s1" }],
    scenes: {
      s1: { id: "s1", name: "场景1", chapterId: "ch1", template: "standardDialogue", nextSceneId: "s2", choices: [{ id: "c1", text: "选择1", isCritical: false, nextSceneId: "s2" }], content: { text: "文本1", textType: "dialogue" } },
      s2: { id: "s2", name: "场景2", chapterId: "ch1", template: "standardDialogue", nextSceneId: "s3", autoSavePoint: "chapterEnd", content: { text: "文本2", textType: "dialogue" } },
      s3: { id: "s3", name: "场景3", chapterId: "ch1", template: "standardDialogue" },
    },
    endings: {},
    settings: { textSpeeds: { slow: 80, normal: 40, fast: 24 }, audioDefaults: { bgmVolume: 0.7, ambienceVolume: 0.6, sfxVolume: 0.8, voiceVolume: 0.9, masterVolume: 0.8 } },
  };
}

// ============================================================
// 测试
// ============================================================

describe("gameStore 存档一致性", () => {
  const gd = makeGameData();

  beforeEach(() => {
    useGameStore.getState().reset();
    useGameStore.getState().loadGameData(gd);
    try { localStorage.clear(); } catch {}
  });

  // ---- 新游戏覆盖 ----
  describe("新游戏覆盖", () => {
    it("开始新游戏后旧存档被清除", () => {
      // 先写入一个旧存档
      const oldState = structuredClone(gd.initialState);
      oldState.currentSceneId = "s2"; // 模拟旧进度
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ schemaVersion: 1, gameId: "snow-before-v1", gameDataVersion: "1.0.0", savedAt: Date.now(), state: oldState, snapshots: {} }));

      // 开始新游戏
      useGameStore.getState().startNewGame();

      // 旧存档应被清除
      expect(localStorage.getItem(STORAGE_KEY)).toBeNull();

      // 状态应从 initialState 开始
      const state = useGameStore.getState().state!;
      expect(state.currentSceneId).toBe("s1");
    });

    it("开始新游戏后 continueGame 返回 false", () => {
      // 写旧存档
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ schemaVersion: 1, gameId: "snow-before-v1", gameDataVersion: "1.0.0", savedAt: Date.now(), state: gd.initialState, snapshots: {} }));

      // 开始新游戏
      useGameStore.getState().startNewGame();

      // 再次尝试 continueGame 应失败
      const result = useGameStore.getState().continueGame();
      expect(result).toBe(false);
    });

    it("clearSave 失败不影响新游戏开始", () => {
      // 模拟 localStorage.removeItem 失败
      const orig = localStorage.removeItem;
      localStorage.removeItem = () => { throw new Error("denied"); };
      try {
        useGameStore.getState().startNewGame();
        const state = useGameStore.getState().state!;
        expect(state.currentSceneId).toBe("s1"); // 仍成功开始
      } finally {
        localStorage.removeItem = orig;
      }
    });
  });

  // ---- 自动存档格式 ----
  describe("自动存档格式", () => {
    it("advanceScene 进入 autoSavePoint 写入 SaveEnvelope", () => {
      useGameStore.getState().startNewGame();
      // 推进到有 autoSavePoint 的场景 s2
      useGameStore.getState().advanceScene("s2");

      const raw = localStorage.getItem(STORAGE_KEY);
      expect(raw).not.toBeNull();
      const parsed = JSON.parse(raw!);
      expect(parsed.schemaVersion).toBe(1);
      expect(parsed.gameId).toBe("snow-before-v1");
      expect(parsed.gameDataVersion).toBeDefined();
      expect(parsed.savedAt).toBeDefined();
      expect(parsed.state).toBeDefined();
      expect(parsed.snapshots).toBeDefined();
    });

    it("自动存档不是裸 GameState", () => {
      useGameStore.getState().startNewGame();
      useGameStore.getState().advanceScene("s2");

      const raw = localStorage.getItem(STORAGE_KEY)!;
      const parsed = JSON.parse(raw);
      // 裸 GameState 不会有 schemaVersion
      expect(parsed.schemaVersion).toBe(1);
    });
  });

  // ---- 快照保留 ----
  describe("快照保留", () => {
    it("普通选择创建快照后，自动存档保留快照", () => {
      useGameStore.getState().startNewGame();
      // 创建快照
      const snapId = useGameStore.getState().createSnapshot("test");
      expect(snapId).toBeTruthy();

      // 推进到 autoSavePoint
      useGameStore.getState().advanceScene("s2");

      const raw = localStorage.getItem(STORAGE_KEY)!;
      const parsed = JSON.parse(raw);
      expect(parsed.snapshots[snapId]).toBeDefined();
    });

    it("继续游戏后快照仍然可用", () => {
      useGameStore.getState().startNewGame();
      const snapId = useGameStore.getState().createSnapshot("test");
      useGameStore.getState().advanceScene("s2");

      // 模拟刷新：重新加载
      useGameStore.getState().reset();
      useGameStore.getState().loadGameData(gd);
      const ok = useGameStore.getState().continueGame();
      expect(ok).toBe(true);

      // 快照仍在
      const snaps = useGameStore.getState().getSnapshots();
      expect(snaps.find((s) => s.id === snapId)).toBeDefined();
    });
  });

  // ---- 存储失败降级 ----
  describe("存储失败降级", () => {
    it("localStorage 写入失败不影响当前会话", () => {
      useGameStore.getState().startNewGame();

      // 模拟 setItem 失败
      const orig = localStorage.setItem;
      localStorage.setItem = () => { throw new Error("QuotaExceeded"); };
      try {
        // advanceScene 触发自动存档，不应抛异常
        expect(() => useGameStore.getState().advanceScene("s2")).not.toThrow();
        const state = useGameStore.getState().state!;
        expect(state.currentSceneId).toBe("s2"); // 会话继续
      } finally {
        localStorage.setItem = orig;
      }
    });
  });
});
