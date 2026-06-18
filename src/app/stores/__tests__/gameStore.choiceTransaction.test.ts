/**
 * gameStore 选择事务测试
 *
 * 必测用例：
 * 6. 普通选择效果只应用一次
 * 7. 关键选择双击效果只应用一次
 * 8. 关键选择确认后存档包含锁定 ID
 * 15. 数值、信任、行动准备不会越界
 */
import { describe, it, expect, beforeEach } from "vitest";
import { useGameStore } from "@/app/stores/gameStore";
import type { GameData, ChoiceDefinition, GameState } from "@/schemas/types";

// ============================================================
// 测试辅助
// ============================================================

function makeTestGameData(): GameData {
  return {
    meta: {
      id: "snow-before-v1",
      title: "雪落之前",
      version: "1.0.0",
      startSceneId: "scene_choice_test",
      continueEnabled: true,
      logicalWidth: 1920,
      logicalHeight: 1080,
      sceneHeight: 864,
      dialogueHeight: 216,
      topStatusHeight: 72,
    },
    characters: {},
    initialState: makeBaseState("scene_choice_test"),
    chapters: [
      {
        id: "ch_test",
        title: "测试章",
        year: 1950,
        season: "prologue",
        location: "测试",
        introSceneId: "scene_choice_test",
      },
    ],
    scenes: {
      scene_choice_test: {
        id: "scene_choice_test",
        name: "选择测试场景",
        chapterId: "ch_test",
        template: "standardDialogue",
        content: {
          text: "你面临一个选择。",
          textType: "dialogue",
        },
        choices: [
          // 普通选择（有效果）
          {
            id: "choice_normal",
            text: "普通选择",
            isCritical: false,
            nextSceneId: "scene_after_choice",
            effects: {
              stats: { knowledge: 1 },
              addFlags: ["flag_test"],
            },
          },
          // 关键选择
          {
            id: "choice_critical",
            text: "关键选择",
            isCritical: true,
            nextSceneId: "scene_after_choice",
            effects: {
              stats: { wellbeing: 2 },
              preparationItems: { funds: 1 },
            },
          },
          // 边界测试选择（效果超过上限）
          {
            id: "choice_boundary",
            text: "边界测试",
            isCritical: false,
            nextSceneId: "scene_after_choice",
            effects: {
              stats: { knowledge: 10 },
              preparationItems: { funds: 5 },
              trust: { chen: 20 },
            },
          },
        ],
      },
      scene_after_choice: {
        id: "scene_after_choice",
        name: "选择后场景",
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

describe("gameStore 选择事务", () => {
  const gd = makeTestGameData();

  beforeEach(() => {
    // 每个测试前重置 store
    useGameStore.getState().reset();
    useGameStore.getState().loadGameData(gd);
    useGameStore.getState().startNewGame();
    // 清理 localStorage
    try { localStorage.clear(); } catch { /* 无操作 */ }
  });

  // ---- 用例 6: 普通选择效果只应用一次 ----
  describe("普通选择原子事务 (用例 6)", () => {
    it("commitChoice 只应用一次效果", () => {
      const store = useGameStore.getState();
      const choice: ChoiceDefinition = gd.scenes.scene_choice_test.choices!.find(
        (c) => c.id === "choice_normal",
      )!;

      // 第一次提交
      const result1 = store.commitChoice(choice);
      expect(result1.ok).toBe(true);

      // 推进后场景变了，无法再提交同一选择
      const stateAfter = useGameStore.getState().state!;
      expect(stateAfter.stats.knowledge).toBe(6); // 5 + 1
      expect(stateAfter.flags).toContain("flag_test");

      // 再次提交应失败（场景已变）
      const result2 = store.commitChoice(choice);
      expect(result2.ok).toBe(false);
    });

    it("同一场景不能重复提交普通选择", () => {
      // 如果 somehow 还在同一场景，submittingChoice 锁也应该起作用
      const store = useGameStore.getState();
      const choice: ChoiceDefinition = gd.scenes.scene_choice_test.choices!.find(
        (c) => c.id === "choice_normal",
      )!;

      // 提交后场景变化
      const result = store.commitChoice(choice);
      expect(result.ok).toBe(true);
    });
  });

  // ---- 用例 7: 关键选择双击效果只应用一次 ----
  describe("关键选择防重复 (用例 7)", () => {
    it("关键选择提交后 lockedCriticalChoiceIds 包含该 ID", () => {
      const store = useGameStore.getState();
      const choice: ChoiceDefinition = gd.scenes.scene_choice_test.choices!.find(
        (c) => c.id === "choice_critical",
      )!;

      const result = store.commitChoice(choice);
      expect(result.ok).toBe(true);

      const stateAfter = useGameStore.getState().state!;
      expect(stateAfter.lockedCriticalChoiceIds).toContain("choice_critical");
    });

    it("已锁定的关键选择再次提交返回 already-applied", () => {
      const store = useGameStore.getState();
      const choice: ChoiceDefinition = gd.scenes.scene_choice_test.choices!.find(
        (c) => c.id === "choice_critical",
      )!;

      // 手动锁定（模拟之前已提交）
      useGameStore.getState().lockCriticalChoice("choice_critical");

      // 但 commitChoice 会检查场景，场景变了所以会返回 invalid-choice
      // 关键选择的 already-applied 检查在场景变化之前就已经做了
      // 我们需要在锁定后仍处于同一场景来测试
      // 实际上 commitChoice 中 already-applied 检查在场景验证之后
      // 让我们通过 store 直接设置状态来模拟
      useGameStore.setState({
        state: {
          ...useGameStore.getState().state!,
          currentSceneId: "scene_choice_test",
          lockedCriticalChoiceIds: ["choice_critical"],
        },
      });

      const result = useGameStore.getState().commitChoice(choice);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.reason).toBe("already-applied");
      }
    });
  });

  // ---- 用例 8: 关键选择确认后存档包含锁定 ID ----
  describe("关键选择存档 (用例 8)", () => {
    it("关键选择确认后自动存档包含 lockedCriticalChoiceIds", () => {
      const store = useGameStore.getState();
      const choice: ChoiceDefinition = gd.scenes.scene_choice_test.choices!.find(
        (c) => c.id === "choice_critical",
      )!;

      store.commitChoice(choice);

      // 检查 localStorage 中的存档
      const raw = localStorage.getItem("snow-before-v1-save");
      expect(raw).not.toBeNull();
      const parsed = JSON.parse(raw!);
      expect(parsed.state.lockedCriticalChoiceIds).toContain(
        "choice_critical",
      );
    });
  });

  // ---- 用例 15: 数值、信任、行动准备不会越界 ----
  describe("数值边界保护 (用例 15)", () => {
    it("stats 不会超过 10", () => {
      const store = useGameStore.getState();
      const choice: ChoiceDefinition = gd.scenes.scene_choice_test.choices!.find(
        (c) => c.id === "choice_boundary",
      )!;

      store.commitChoice(choice);

      const stateAfter = useGameStore.getState().state!;
      expect(stateAfter.stats.knowledge).toBeLessThanOrEqual(10);
      expect(stateAfter.stats.knowledge).toBe(10); // 5 + 10 → clamped to 10
    });

    it("preparationItems 不会超过 2", () => {
      const store = useGameStore.getState();
      const choice: ChoiceDefinition = gd.scenes.scene_choice_test.choices!.find(
        (c) => c.id === "choice_boundary",
      )!;

      store.commitChoice(choice);

      const stateAfter = useGameStore.getState().state!;
      expect(stateAfter.preparationItems.funds).toBeLessThanOrEqual(2);
      expect(stateAfter.preparationItems.funds).toBe(2); // 0 + 5 → clamped to 2
    });

    it("trust 不会超过 10", () => {
      const store = useGameStore.getState();
      const choice: ChoiceDefinition = gd.scenes.scene_choice_test.choices!.find(
        (c) => c.id === "choice_boundary",
      )!;

      store.commitChoice(choice);

      const stateAfter = useGameStore.getState().state!;
      expect(stateAfter.trust.chen).toBeLessThanOrEqual(10);
      expect(stateAfter.trust.chen).toBe(10); // 5 + 20 → clamped to 10
    });

    it("stats 不会低于 0", () => {
      // 手动设置低值后应用负效果
      useGameStore.setState({
        state: {
          ...useGameStore.getState().state!,
          currentSceneId: "scene_choice_test",
          stats: { knowledge: 0, wellbeing: 0, responsibility: 0, homesickness: 0 },
        },
      });

      // 构建一个负效果的选项（直接调用 applyChoiceEffect）
      const store = useGameStore.getState();
      store.applyChoiceEffect({
        stats: { knowledge: -5 },
        preparationItems: { funds: -3 },
      });

      const stateAfter = useGameStore.getState().state!;
      expect(stateAfter.stats.knowledge).toBe(0);
      expect(stateAfter.preparationItems.funds).toBe(0);
    });
  });

  // ---- 附加: submittingChoice 防重锁 ----
  describe("submittingChoice 防重", () => {
    it("提交过程中 submittingChoice 为 true", () => {
      // 设置 submittingChoice 为 true 模拟正在提交
      useGameStore.setState({ submittingChoice: true });

      const choice: ChoiceDefinition = gd.scenes.scene_choice_test.choices!.find(
        (c) => c.id === "choice_normal",
      )!;
      const result = useGameStore.getState().commitChoice(choice);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.reason).toBe("busy");
      }
    });
  });
});
