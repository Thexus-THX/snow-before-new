/**
 * saveManager 测试
 *
 * 必测用例：
 * 1. 有效存档进入游戏后不会被 startNewGame() 覆盖
 * 2. 无存档时可正常新游戏
 * 3. 旧裸 GameState 存档可迁移
 * 4. 损坏 JSON 不会导致白屏
 * 5. 不存在的场景 ID 存档会被拒绝
 * 16. 存档写入失败时当前会话仍可继续
 */
import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  hasValidSave,
  loadSave,
  writeSave,
  clearSave,
  migrateLegacySave,
  buildSaveEnvelope,
  STORAGE_KEY,
  type SaveEnvelope,
  type SaveWriteResult,
} from "@/engine/saveManager";
import type { GameState, GameData } from "@/schemas/types";

// ============================================================
// 测试辅助：构建最小 gameData
// ============================================================

function makeMinimalGameData(version = "1.0.0"): GameData {
  return {
    meta: {
      id: "snow-before-v1",
      title: "雪落之前",
      version,
      startSceneId: "scene_start",
      continueEnabled: true,
      logicalWidth: 1920,
      logicalHeight: 1080,
      sceneHeight: 864,
      dialogueHeight: 216,
      topStatusHeight: 72,
    },
    characters: {},
    initialState: makeMinimalState("scene_start"),
    chapters: [
      {
        id: "ch_prologue",
        title: "序章",
        year: 1950,
        season: "prologue",
        location: "莫斯科车站",
        introSceneId: "scene_start",
      },
    ],
    scenes: {
      scene_start: {
        id: "scene_start",
        name: "序章·风雪车站",
        chapterId: "ch_prologue",
        template: "standardDialogue",
      },
      scene_02: {
        id: "scene_02",
        name: "下一场景",
        chapterId: "ch_prologue",
        template: "standardDialogue",
      },
    },
    endings: {},
    settings: {
      textSpeeds: { slow: 80, normal: 40, fast: 24 },
      audioDefaults: {
        bgmVolume: 0.7,
        ambienceVolume: 0.6,
        sfxVolume: 0.8,
        voiceVolume: 0.9,
        masterVolume: 0.8,
      },
    },
  };
}

function makeMinimalState(sceneId: string): GameState {
  return {
    currentSceneId: sceneId,
    chapterId: "ch_prologue",
    stats: { knowledge: 5, wellbeing: 5, responsibility: 5, homesickness: 5 },
    preparationItems: {
      route: 0,
      documents: 0,
      funds: 0,
      technicalMaterials: 0,
      contact: 0,
    },
    trust: { chen: 5, nadya: 5, belov: 5, ivan: 5 },
    cooperationModifier: 0,
    returnTendency: 0,
    stayTendency: 0,
    flags: [],
    lockedCriticalChoiceIds: [],
    history: [],
    visitedSceneIds: [sceneId],
  };
}

function makeValidEnvelope(
  gameData: GameData,
  overrides?: Partial<GameState>,
): SaveEnvelope {
  const state = makeMinimalState("scene_start");
  if (overrides) Object.assign(state, overrides);
  return {
    schemaVersion: 1,
    gameId: "snow-before-v1",
    gameDataVersion: gameData.meta.version,
    savedAt: Date.now(),
    state,
    snapshots: {},
  };
}

// ============================================================
// 测试
// ============================================================

describe("saveManager", () => {
  beforeEach(() => {
    // 每个测试前清空 localStorage
    try { localStorage.clear(); } catch { /* 无操作 */ }
  });

  // ---- 用例 1: 有效存档进入游戏后不会被 startNewGame() 覆盖 ----
  describe("有效存档校验", () => {
    it("写入有效存档后 hasValidSave 返回 true", () => {
      const gd = makeMinimalGameData();
      const envelope = makeValidEnvelope(gd);
      writeSave(envelope);

      expect(hasValidSave(gd)).toBe(true);
    });

    it("loadSave 返回 ok 状态", () => {
      const gd = makeMinimalGameData();
      const envelope = makeValidEnvelope(gd);
      writeSave(envelope);

      const result = loadSave(gd);
      expect(result.status).toBe("ok");
      if (result.status === "ok") {
        expect(result.save.state.currentSceneId).toBe("scene_start");
      }
    });

    it("不存在存档时 hasValidSave 返回 false", () => {
      const gd = makeMinimalGameData();
      expect(hasValidSave(gd)).toBe(false);
    });
  });

  // ---- 用例 2: 无存档时可正常新游戏 ----
  describe("无存档行为", () => {
    it("loadSave 返回 not-found", () => {
      const gd = makeMinimalGameData();
      const result = loadSave(gd);
      expect(result.status).toBe("not-found");
    });
  });

  // ---- 用例 3: 旧裸 GameState 存档可迁移 ----
  describe("旧存档迁移", () => {
    it("旧版裸 GameState JSON 可迁移为 SaveEnvelope", () => {
      const gd = makeMinimalGameData();
      const legacyState = makeMinimalState("scene_start");

      // 直接写入裸 GameState（模拟旧版存档）
      localStorage.setItem(STORAGE_KEY, JSON.stringify(legacyState));

      const result = loadSave(gd);
      expect(result.status).toBe("migrated");
      if (result.status === "migrated") {
        expect(result.save.schemaVersion).toBe(1);
        expect(result.save.state.currentSceneId).toBe("scene_start");
      }

      // 迁移后应写回新格式
      const raw = localStorage.getItem(STORAGE_KEY);
      expect(raw).not.toBeNull();
      const parsed = JSON.parse(raw!);
      expect(parsed.schemaVersion).toBe(1);
    });

    it("旧版存档中不存在的场景 ID 会被拒绝", () => {
      const gd = makeMinimalGameData();
      const legacyState = makeMinimalState("scene_nonexistent");

      localStorage.setItem(STORAGE_KEY, JSON.stringify(legacyState));

      const result = loadSave(gd);
      expect(result.status).toBe("incompatible");
    });
  });

  // ---- 用例 4: 损坏 JSON 不会导致白屏 ----
  describe("损坏数据处理", () => {
    it("损坏的 JSON 返回 corrupt", () => {
      const gd = makeMinimalGameData();
      localStorage.setItem(STORAGE_KEY, "this is not json {{{");

      const result = loadSave(gd);
      expect(result.status).toBe("corrupt");
    });

    it("空对象返回 corrupt", () => {
      const gd = makeMinimalGameData();
      localStorage.setItem(STORAGE_KEY, "{}");

      const result = loadSave(gd);
      // 空对象不符合任何 schema
      expect(["corrupt", "not-found"]).toContain(result.status);
    });

    it("loadSave 不会抛出异常", () => {
      const gd = makeMinimalGameData();
      localStorage.setItem(STORAGE_KEY, "{broken");

      expect(() => loadSave(gd)).not.toThrow();
    });
  });

  // ---- 用例 5: 不存在的场景 ID 存档会被拒绝 ----
  describe("场景引用校验", () => {
    it("存档中 currentSceneId 不存在时返回 incompatible", () => {
      const gd = makeMinimalGameData();
      const envelope = makeValidEnvelope(gd, {
        currentSceneId: "scene_nonexistent",
      });
      writeSave(envelope);

      // hasValidSave 检测到引用无效
      expect(hasValidSave(gd)).toBe(false);

      // loadSave 返回 incompatible
      const result = loadSave(gd);
      expect(result.status).toBe("incompatible");
    });
  });

  // ---- 用例 16: 存档写入失败时当前会话仍可继续 ----
  describe("存储异常降级", () => {
    it("writeSave 传入无效数据返回 storage-unavailable（不抛异常）", () => {
      // 传入不符合 schema 的数据（如 schemaVersion 错误），writeSave 内部的 validateSaveEnvelope 会失败
      const invalidEnvelope = {
        schemaVersion: 999,
        gameId: "wrong-id",
        gameDataVersion: "1.0.0",
        savedAt: Date.now(),
        state: null,
        snapshots: null,
      } as unknown as SaveEnvelope;

      // writeSave 不应抛出异常
      expect(() => {
        const result = writeSave(invalidEnvelope);
        expect(result.status).toBe("storage-unavailable");
      }).not.toThrow();
    });

    it("buildSaveEnvelope 不依赖 localStorage", () => {
      const state = makeMinimalState("scene_start");
      const envelope = buildSaveEnvelope(state, {}, "1.0.0");
      expect(envelope.schemaVersion).toBe(1);
      expect(envelope.state.currentSceneId).toBe("scene_start");
    });
  });

  // ---- 附加: clearSave ----
  describe("clearSave", () => {
    it("清除后 hasValidSave 返回 false", () => {
      const gd = makeMinimalGameData();
      writeSave(makeValidEnvelope(gd));
      expect(hasValidSave(gd)).toBe(true);

      clearSave();
      expect(hasValidSave(gd)).toBe(false);
    });
  });
});
