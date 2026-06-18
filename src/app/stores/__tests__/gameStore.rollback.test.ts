/**
 * gameStore 回滚测试
 *
 * 必测用例：
 * 9. 点击某条历史记录会回到其自己的快照，而不是最新快照
 * 10. 回滚会截断未来历史与快照
 * 11. 不允许跨越最近关键选择边界
 */
import { describe, it, expect, beforeEach } from "vitest";
import { useGameStore } from "@/app/stores/gameStore";
import type { GameData, GameState, HistoryEntry, ChoiceDefinition } from "@/schemas/types";

// ============================================================
// 测试辅助
// ============================================================

function makeTestGameData(): GameData {
  return {
    meta: {
      id: "snow-before-v1",
      title: "雪落之前",
      version: "1.0.0",
      startSceneId: "scene_rollback_test",
      continueEnabled: true,
      logicalWidth: 1920,
      logicalHeight: 1080,
      sceneHeight: 864,
      dialogueHeight: 216,
      topStatusHeight: 72,
    },
    characters: {},
    initialState: makeBaseState("scene_rollback_test"),
    chapters: [
      {
        id: "ch_test",
        title: "测试章",
        year: 1950,
        season: "prologue",
        location: "测试",
        introSceneId: "scene_rollback_test",
      },
    ],
    scenes: {
      scene_rollback_test: {
        id: "scene_rollback_test",
        name: "回滚测试场景",
        chapterId: "ch_test",
        template: "standardDialogue",
        content: { text: "测试文本", textType: "dialogue" },
        choices: [
          {
            id: "choice_first",
            text: "第一个普通选择",
            isCritical: false,
            nextSceneId: "scene_second",
            effects: { stats: { knowledge: 1 } },
          },
          {
            id: "choice_second",
            text: "第二个普通选择",
            isCritical: false,
            nextSceneId: "scene_third",
            effects: { stats: { wellbeing: 1 } },
          },
          {
            id: "choice_critical",
            text: "关键选择",
            isCritical: true,
            nextSceneId: "scene_final",
            effects: { stats: { knowledge: 5 } },
          },
        ],
      },
      scene_second: {
        id: "scene_second",
        name: "第二场景",
        chapterId: "ch_test",
        template: "standardDialogue",
        content: { text: "第二场景文本", textType: "dialogue" },
        choices: [
          {
            id: "choice_second",
            text: "第二个普通选择",
            isCritical: false,
            nextSceneId: "scene_third",
            effects: { stats: { wellbeing: 1 } },
          },
        ],
      },
      scene_third: {
        id: "scene_third",
        name: "第三场景",
        chapterId: "ch_test",
        template: "standardDialogue",
        content: { text: "第三场景文本", textType: "dialogue" },
        choices: [
          {
            id: "choice_critical",
            text: "关键选择",
            isCritical: true,
            nextSceneId: "scene_final",
            effects: { stats: { knowledge: 5 } },
          },
        ],
      },
      scene_final: {
        id: "scene_final",
        name: "最终场景",
        chapterId: "ch_test",
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

function makeBaseState(sceneId: string): GameState {
  return {
    currentSceneId: sceneId,
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
    visitedSceneIds: [sceneId],
  };
}

// ============================================================
// 测试
// ============================================================

describe("gameStore 回滚", () => {
  const gd = makeTestGameData();

  beforeEach(() => {
    useGameStore.getState().reset();
    useGameStore.getState().loadGameData(gd);
    useGameStore.getState().startNewGame();
    try { localStorage.clear(); } catch { /* 无操作 */ }
  });

  // ---- 用例 9: 点击某条历史记录会回到其自己的快照 ----
  describe("精确回滚 (用例 9)", () => {
    it("回滚使用 entry.rollbackSnapshotId 对应的快照", () => {
      const store = useGameStore.getState();
      const choice1: ChoiceDefinition = gd.scenes.scene_rollback_test.choices!.find(
        (c) => c.id === "choice_first",
      )!;

      // 提交第一个选择（创建快照）
      store.commitChoice(choice1);

      // 现在状态在 scene_second，knowledge = 6
      const stateBeforeRollback = useGameStore.getState().state!;
      expect(stateBeforeRollback.currentSceneId).toBe("scene_second");
      expect(stateBeforeRollback.stats.knowledge).toBe(6);

      // 获取历史中的选择条目
      const history = useGameStore.getState().getHistory();
      const choiceEntry = history.find((h) => h.type === "choice");
      expect(choiceEntry).toBeDefined();
      expect(choiceEntry!.rollbackSnapshotId).toBeDefined();

      // 回滚
      const result = useGameStore.getState().rollbackToHistoryEntry(choiceEntry!);
      expect(result.success).toBe(true);

      // 应该回到选择前的状态（knowledge = 5）
      const stateAfterRollback = useGameStore.getState().state!;
      expect(stateAfterRollback.stats.knowledge).toBe(5);
      expect(stateAfterRollback.currentSceneId).toBe("scene_rollback_test");
    });
  });

  // ---- 用例 10: 回滚会截断未来历史与快照 ----
  describe("截断未来 (用例 10)", () => {
    it("回滚后历史被截断", () => {
      const store = useGameStore.getState();

      // 提交第一个选择
      const choice1: ChoiceDefinition = gd.scenes.scene_rollback_test.choices!.find(
        (c) => c.id === "choice_first",
      )!;
      store.commitChoice(choice1);

      // 现在在 scene_second，再提交第二个选择
      const stateNow = useGameStore.getState().state!;
      // 需要手动设置到 scene_second 并提交
      useGameStore.setState({
        state: {
          ...stateNow,
          currentSceneId: "scene_second",
        },
      });
      const choice2: ChoiceDefinition = gd.scenes.scene_second.choices!.find(
        (c) => c.id === "choice_second",
      )!;
      useGameStore.getState().commitChoice(choice2);

      // 现在应该在 scene_third，历史应该有 2 个 choice 条目
      let history = useGameStore.getState().getHistory();
      const choiceEntries = history.filter((h) => h.type === "choice");
      expect(choiceEntries.length).toBeGreaterThanOrEqual(2);

      // 回滚到第一个选择
      const firstChoice = choiceEntries[0];
      useGameStore.getState().rollbackToHistoryEntry(firstChoice);

      // 回滚后历史应该被截断（只有第一个 choice 之前的记录）
      history = useGameStore.getState().getHistory();
      const afterRollbackChoices = history.filter((h) => h.type === "choice");
      expect(afterRollbackChoices.length).toBe(0); // 截断到第一个选择之前
    });
  });

  // ---- 用例 11: 不允许跨越最近关键选择边界 ----
  describe("关键选择边界 (用例 11)", () => {
    it("关键选择之后不能回滚到之前的普通选择", () => {
      const store = useGameStore.getState();

      // 提交第一个普通选择
      const choice1: ChoiceDefinition = gd.scenes.scene_rollback_test.choices!.find(
        (c) => c.id === "choice_first",
      )!;
      store.commitChoice(choice1);

      // 手动设置到 scene_third 并提交关键选择
      const stateAfterFirst = useGameStore.getState().state!;
      useGameStore.setState({
        state: {
          ...stateAfterFirst,
          currentSceneId: "scene_third",
        },
      });
      const criticalChoice: ChoiceDefinition = gd.scenes.scene_third.choices!.find(
        (c) => c.id === "choice_critical",
      )!;
      useGameStore.getState().commitChoice(criticalChoice);

      // 现在 history 中第一个普通选择在关键选择之前
      const history = useGameStore.getState().getHistory();
      // 用 text 匹配而非 id（id 包含动态时间戳）
      const firstChoiceEntry = history.find(
        (h) => h.type === "choice" && h.text === "第一个普通选择",
      );
      expect(firstChoiceEntry).toBeDefined();

      // canRollbackEntry 应返回 false
      const canRoll = useGameStore.getState().canRollbackEntry(firstChoiceEntry!);
      expect(canRoll.canRollback).toBe(false);
      expect(canRoll.reason).toContain("关键决定");

      // rollbackToHistoryEntry 也应拒绝
      const result = useGameStore.getState().rollbackToHistoryEntry(firstChoiceEntry!);
      expect(result.success).toBe(false);
    });

    it("关键选择本身不可回滚", () => {
      const store = useGameStore.getState();
      const criticalChoice: ChoiceDefinition = gd.scenes.scene_rollback_test.choices!.find(
        (c) => c.id === "choice_critical",
      )!;

      store.commitChoice(criticalChoice);

      const history = useGameStore.getState().getHistory();
      // 用 text 匹配（id 含动态时间戳）
      const critEntry = history.find(
        (h) => h.type === "choice" && h.isCritical && h.text === "关键选择",
      );
      expect(critEntry).toBeDefined();

      const canRoll = useGameStore.getState().canRollbackEntry(critEntry!);
      expect(canRoll.canRollback).toBe(false);
    });
  });

  // ---- 附加: 回滚到无快照的条目 ----
  describe("边界情况", () => {
    it("没有 rollbackSnapshotId 的条目无法回滚", () => {
      const entry: HistoryEntry = {
        id: "test_entry",
        sceneId: "scene_rollback_test",
        type: "choice",
        text: "无快照的选择",
        isCritical: false,
        isLocked: false,
        createdAt: Date.now(),
      };

      const canRoll = useGameStore.getState().canRollbackEntry(entry);
      expect(canRoll.canRollback).toBe(false);
      expect(canRoll.reason).toContain("回退点");
    });

    it("text 类型的条目无法回滚", () => {
      const entry: HistoryEntry = {
        id: "text_entry",
        sceneId: "scene_rollback_test",
        type: "text",
        text: "一段对话",
        createdAt: Date.now(),
      };

      const canRoll = useGameStore.getState().canRollbackEntry(entry);
      expect(canRoll.canRollback).toBe(false);
      expect(canRoll.reason).toContain("只有选择");
    });
  });
});
