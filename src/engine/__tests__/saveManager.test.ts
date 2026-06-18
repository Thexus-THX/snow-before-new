import { describe, it, expect, beforeEach } from "vitest";
import {
  hasValidSave, loadSave, writeSave, clearSave, buildSaveEnvelope,
  STORAGE_KEY, type SaveEnvelope,
} from "@/engine/saveManager";
import type { GameState, GameData } from "@/schemas/types";

// ============================================================
// 辅助
// ============================================================

function makeGameData(version = "1.0.0"): GameData {
  return {
    meta: { id: "snow-before-v1", title: "雪落之前", version, startSceneId: "s1", continueEnabled: true, logicalWidth: 1920, logicalHeight: 1080, sceneHeight: 864, dialogueHeight: 216, topStatusHeight: 72 },
    characters: {},
    initialState: makeState("s1"),
    chapters: [{ id: "ch1", title: "序章", year: 1950, season: "prologue", location: "", introSceneId: "s1" }],
    scenes: { s1: { id: "s1", name: "场景1", chapterId: "ch1", template: "standardDialogue", autoSavePoint: "chapterStart" }, s2: { id: "s2", name: "场景2", chapterId: "ch1", template: "standardDialogue" } },
    endings: {},
    settings: { textSpeeds: { slow: 80, normal: 40, fast: 24 }, audioDefaults: { bgmVolume: 0.7, ambienceVolume: 0.6, sfxVolume: 0.8, voiceVolume: 0.9, masterVolume: 0.8 } },
  };
}

function makeState(sceneId: string): GameState {
  return { currentSceneId: sceneId, chapterId: "ch1", stats: { knowledge: 5, wellbeing: 5, responsibility: 5, homesickness: 5 }, preparationItems: { route: 0, documents: 0, funds: 0, technicalMaterials: 0, contact: 0 }, trust: { chen: 5, nadya: 5, belov: 5, ivan: 5 }, cooperationModifier: 0, returnTendency: 0, stayTendency: 0, flags: [], lockedCriticalChoiceIds: [], history: [], visitedSceneIds: [sceneId] };
}

function makeEnvelope(gd: GameData, overrides?: Partial<GameState>): SaveEnvelope {
  const state = makeState("s1");
  if (overrides) Object.assign(state, overrides);
  return { schemaVersion: 1, gameId: "snow-before-v1", gameDataVersion: gd.meta.version, savedAt: Date.now(), state, snapshots: {} };
}

// ============================================================
// 测试
// ============================================================

describe("saveManager", () => {
  beforeEach(() => { try { localStorage.clear(); } catch {} });

  // ---- 存档格式 ----
  describe("存档格式", () => {
    it("writeSave 写入的是 SaveEnvelope（非裸 GameState）", () => {
      const gd = makeGameData();
      const envelope = makeEnvelope(gd);
      writeSave(envelope);
      const raw = localStorage.getItem(STORAGE_KEY)!;
      const parsed = JSON.parse(raw);
      expect(parsed.schemaVersion).toBe(1);
      expect(parsed.gameId).toBe("snow-before-v1");
      expect(parsed.gameDataVersion).toBeDefined();
      expect(parsed.savedAt).toBeDefined();
      expect(parsed.state).toBeDefined();
      expect(parsed.snapshots).toBeDefined();
    });

    it("loadSave 加载 SaveEnvelope 返回 ok", () => {
      const gd = makeGameData();
      writeSave(makeEnvelope(gd));
      const result = loadSave(gd);
      expect(result.status).toBe("ok");
    });
  });

  // ---- 新游戏覆盖 ----
  describe("新游戏覆盖", () => {
    it("clearSave 清除后 hasValidSave 返回 false", () => {
      const gd = makeGameData();
      writeSave(makeEnvelope(gd));
      expect(hasValidSave(gd)).toBe(true);
      clearSave();
      expect(hasValidSave(gd)).toBe(false);
    });

    it("新游戏清除后旧存档不再可用", () => {
      const gd = makeGameData();
      writeSave(makeEnvelope(gd));
      clearSave();
      const result = loadSave(gd);
      expect(result.status).toBe("not-found");
    });
  });

  // ---- 旧存档迁移 ----
  describe("旧存档迁移", () => {
    it("旧裸 GameState 可迁移为 SaveEnvelope", () => {
      const gd = makeGameData();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(makeState("s1")));
      const result = loadSave(gd);
      expect(result.status).toBe("migrated");
      if (result.status === "migrated") expect(result.save.schemaVersion).toBe(1);
      const raw = JSON.parse(localStorage.getItem(STORAGE_KEY)!);
      expect(raw.schemaVersion).toBe(1);
    });
  });

  // ---- 损坏数据处理 ----
  describe("损坏数据", () => {
    it("损坏 JSON 返回 corrupt", () => {
      const gd = makeGameData();
      localStorage.setItem(STORAGE_KEY, "not json {");
      expect(loadSave(gd).status).toBe("corrupt");
    });
    it("不存在的场景 ID 返回 incompatible", () => {
      const gd = makeGameData();
      writeSave(makeEnvelope(gd, { currentSceneId: "nonexistent" }));
      expect(loadSave(gd).status).toBe("incompatible");
    });
  });

  // ---- 快照保留 ----
  describe("快照保留", () => {
    it("SaveEnvelope 中的 snapshots 完整保存和恢复", () => {
      const gd = makeGameData();
      const state = makeState("s1");
      const snapshots = {
        snap1: { id: "snap1", sceneId: "s1", state: structuredClone(state), createdAt: Date.now() },
      };
      const envelope: SaveEnvelope = { schemaVersion: 1, gameId: "snow-before-v1", gameDataVersion: gd.meta.version, savedAt: Date.now(), state, snapshots };
      writeSave(envelope);
      const result = loadSave(gd);
      expect(result.status).toBe("ok");
      if (result.status === "ok") {
        expect(Object.keys(result.save.snapshots)).toHaveLength(1);
        expect(result.save.snapshots.snap1).toBeDefined();
      }
    });

    it("buildSaveEnvelope 保留传入的 snapshots", () => {
      const state = makeState("s1");
      const snaps = { s1: { id: "s1", sceneId: "s1", state: structuredClone(state), createdAt: 1000 } };
      const envelope = buildSaveEnvelope(state, snaps, "1.0.0");
      expect(envelope.snapshots.s1).toBeDefined();
    });
  });

  // ---- 存储异常降级 ----
  describe("存储异常降级", () => {
    it("writeSave 传入无效数据不抛异常", () => {
      expect(() => writeSave({ schemaVersion: 999 } as any)).not.toThrow();
    });
  });
});
