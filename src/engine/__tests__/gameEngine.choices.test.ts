/**
 * GameEngine 选项解析测试
 *
 * 必测用例：
 * 12. visibleWhenLocked=true 的不满足选项以锁定状态返回
 * 13. 普通不满足选项保持隐藏
 * 14. 同一 choiceGroupId 最终只返回一个版本
 */
import { describe, it, expect } from "vitest";
import { GameEngine } from "@/engine/gameEngine";
import type { GameData, GameState } from "@/schemas/types";

// ============================================================
// 测试辅助
// ============================================================

function makeTestGameData(): GameData {
  return {
    meta: {
      id: "snow-before-v1",
      title: "雪落之前",
      version: "1.0.0",
      startSceneId: "test_scene",
      continueEnabled: true,
      logicalWidth: 1920,
      logicalHeight: 1080,
      sceneHeight: 864,
      dialogueHeight: 216,
      topStatusHeight: 72,
    },
    characters: {},
    initialState: makeTestState(),
    chapters: [
      {
        id: "ch_test",
        title: "测试章",
        year: 1950,
        season: "prologue",
        location: "测试",
        introSceneId: "test_scene",
      },
    ],
    scenes: {
      test_scene: {
        id: "test_scene",
        name: "测试场景",
        chapterId: "ch_test",
        template: "standardDialogue",
        choices: [
          // 可用选项（无条件）
          {
            id: "choice_available",
            text: "始终可用",
            isCritical: false,
            nextSceneId: "test_scene",
          },
          // 锁定可见选项（条件不满足 + visibleWhenLocked）
          {
            id: "choice_locked_visible",
            text: "条件不满足但可见",
            isCritical: false,
            nextSceneId: "test_scene",
            conditions: {
              all: [{ type: "statMin", key: "knowledge", value: 10 }],
            },
            visibleWhenLocked: true,
            lockedHint: "需要更高的学识",
          },
          // 隐藏选项（条件不满足 + 无 visibleWhenLocked）
          {
            id: "choice_hidden",
            text: "隐藏选项",
            isCritical: false,
            nextSceneId: "test_scene",
            conditions: {
              all: [{ type: "statMin", key: "wellbeing", value: 10 }],
            },
          },
          // choiceGroupId 组：高条件版本（满足）
          {
            id: "choice_group_high",
            text: "高学识版本",
            isCritical: false,
            nextSceneId: "test_scene",
            conditions: {
              all: [{ type: "statMin", key: "knowledge", value: 5 }],
            },
            choiceGroupId: "group_knowledge",
          },
          // choiceGroupId 组：低条件版本（也满足）
          {
            id: "choice_group_low",
            text: "低学识版本",
            isCritical: false,
            nextSceneId: "test_scene",
            conditions: {
              all: [{ type: "statMin", key: "knowledge", value: 3 }],
            },
            choiceGroupId: "group_knowledge",
          },
          // choiceGroupId 组：锁定可见版本
          {
            id: "choice_group_locked",
            text: "锁定组版本",
            isCritical: false,
            nextSceneId: "test_scene",
            conditions: {
              all: [{ type: "statMin", key: "wellbeing", value: 10 }],
            },
            choiceGroupId: "group_locked_only",
            visibleWhenLocked: true,
            lockedHint: "需要更好的身心状态",
          },
        ],
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

function makeTestState(overrides?: Partial<GameState>): GameState {
  return {
    currentSceneId: "test_scene",
    chapterId: "ch_test",
    stats: { knowledge: 5, wellbeing: 5, responsibility: 5, homesickness: 5 },
    preparationItems: {
      route: 0, documents: 0, funds: 0, technicalMaterials: 0, contact: 0,
    },
    trust: { chen: 5, nadya: 5, belov: 5, ivan: 5 },
    cooperationModifier: 0,
    returnTendency: 0,
    stayTendency: 0,
    flags: [],
    lockedCriticalChoiceIds: [],
    history: [],
    visitedSceneIds: ["test_scene"],
    ...overrides,
  };
}

// ============================================================
// 测试
// ============================================================

describe("GameEngine 选项解析", () => {
  const gd = makeTestGameData();
  const engine = new GameEngine(gd);

  // ---- 用例 12: visibleWhenLocked=true 的不满足选项以锁定状态返回 ----
  describe("锁定可见选项 (用例 12)", () => {
    it("条件不满足且 visibleWhenLocked=true 时返回 locked 状态", () => {
      const state = makeTestState();
      const resolved = engine.getResolvedChoices("test_scene", state);

      const locked = resolved.find(
        (r) => r.choice.id === "choice_locked_visible",
      );
      expect(locked).toBeDefined();
      expect(locked!.availability).toBe("locked");
      expect(locked!.lockedHint).toBe("需要更高的学识");
    });
  });

  // ---- 用例 13: 普通不满足选项保持隐藏 ----
  describe("隐藏选项 (用例 13)", () => {
    it("条件不满足且无 visibleWhenLocked 时不返回", () => {
      const state = makeTestState();
      const resolved = engine.getResolvedChoices("test_scene", state);

      const hidden = resolved.find((r) => r.choice.id === "choice_hidden");
      expect(hidden).toBeUndefined();
    });
  });

  // ---- 用例 14: 同一 choiceGroupId 最终只返回一个版本 ----
  describe("choiceGroupId 去重 (用例 14)", () => {
    it("同组多个满足版本只返回一个", () => {
      const state = makeTestState();
      const resolved = engine.getResolvedChoices("test_scene", state);

      const groupChoices = resolved.filter(
        (r) => r.choice.choiceGroupId === "group_knowledge",
      );
      expect(groupChoices.length).toBe(1);
    });

    it("同组无满足版本但有 locked 版本时返回一个 locked", () => {
      const state = makeTestState({
        stats: { knowledge: 0, wellbeing: 0, responsibility: 5, homesickness: 5 },
      });
      const resolved = engine.getResolvedChoices("test_scene", state);

      const lockedGroup = resolved.find(
        (r) => r.choice.id === "choice_group_locked",
      );
      expect(lockedGroup).toBeDefined();
      expect(lockedGroup!.availability).toBe("locked");
    });

    it("getVisibleChoices 只返回 available 选项", () => {
      const state = makeTestState();
      const visible = engine.getVisibleChoices("test_scene", state);

      // 不应包含 locked 或 hidden 选项
      const lockedInVisible = visible.find(
        (c) => c.id === "choice_locked_visible",
      );
      expect(lockedInVisible).toBeUndefined();

      const hiddenInVisible = visible.find((c) => c.id === "choice_hidden");
      expect(hiddenInVisible).toBeUndefined();
    });
  });

  // ---- 附加: 结果排序稳定性 ----
  describe("结果稳定性", () => {
    it("多次调用返回相同顺序", () => {
      const state = makeTestState();
      const r1 = engine.getResolvedChoices("test_scene", state);
      const r2 = engine.getResolvedChoices("test_scene", state);

      expect(r1.map((r) => r.choice.id)).toEqual(r2.map((r) => r.choice.id));
    });
  });
});
