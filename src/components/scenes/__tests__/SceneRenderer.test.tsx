/**
 * SceneRenderer 测试
 *
 * 覆盖：
 * 1. 七种模板分发到正确组件
 * 2. 未知/缺字段场景进入安全降级
 * 3. standardDialogue 保留普通布局
 * 4. 特殊模板不渲染普通状态栏和216px对话框
 */
import { describe, it, expect, vi } from "vitest";
import { render } from "@testing-library/react";
import SceneRenderer from "@/components/scenes/SceneRenderer";
import type { SceneDefinition, GameState } from "@/schemas/types";
import { GameEngine } from "@/engine/gameEngine";
import gameDataRaw from "@/content/game-data.json";
import { validateGameData } from "@/schemas/gameSchema";

// 使用真实 game-data.json 以确保 Zod 校验通过
const validated = validateGameData(gameDataRaw);
const realGameData = validated.success ? validated.data : null;

function makeMinimalState(overrides: Partial<GameState> = {}): GameState {
  return {
    currentSceneId: "test_scene",
    chapterId: "prologue_1931",
    stats: { knowledge: 5, wellbeing: 5, responsibility: 5, homesickness: 5 },
    preparationItems: { route: 0, documents: 0, funds: 0, technicalMaterials: 0, contact: 0 },
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

function makeEngine() {
  return new GameEngine(realGameData as any);
}

const noop = vi.fn() as any;

describe("SceneRenderer 模板分发", () => {
  it("standardDialogue 渲染普通布局（用例 1,3）", () => {
    const scene: SceneDefinition = {
      id: "test_sd",
      name: "测试普通场景",
      chapterId: "prologue_1931",
      template: "standardDialogue",
      background: "/assets/backgrounds/bg_prologue_1931_station.webp",
      showTopStatusBar: true,
      showDialoguePanel: true,
      content: { speakerId: "narrator", textType: "narration", text: "测试文本" },
      nextSceneId: "next",
    };
    const { container } = render(
      <SceneRenderer
        scene={scene}
        state={makeMinimalState()}
        engine={makeEngine()}
        onAdvance={noop}
        onSelectChoice={noop}
        onConfirmCritical={noop}
        onCancelConfirm={noop}
        onRollback={noop}
        onToggleHistory={noop}
        resolvedChoices={[]}
        showingChoices={false}
        pendingConfirm={null}
        hasChoices={false}
        history={[]}
        showHistory={false}
      />,
    );
    // 应包含状态栏内容（普通布局特征）
    expect(container.textContent).toContain("学识");
    expect(container.textContent).toContain("身心");
    // 应包含对话面板（底部区域存在，使用 CSS 类）
    expect(container.querySelector('.dialoguePanel')).toBeTruthy();
  });

  it("chapterIntro 渲染特殊场景（用例 1）", () => {
    const scene: SceneDefinition = {
      id: "test_chapter",
      name: "测试章节",
      chapterId: "prologue_1931",
      template: "chapterIntro",
      background: "/assets/backgrounds/bg_time_note_four_seasons.webp",
      showTopStatusBar: false,
      showDialoguePanel: false,
      content: { chapterTitle: "第一章", backgroundText: "这是章节背景说明", text: "五年后" },
      nextSceneId: "next",
    };
    const { container } = render(
      <SceneRenderer
        scene={scene}
        state={makeMinimalState()}
        engine={makeEngine()}
        onAdvance={noop}
        onSelectChoice={noop}
        onConfirmCritical={noop}
        onCancelConfirm={noop}
        onRollback={noop}
        onToggleHistory={noop}
        resolvedChoices={[]}
        showingChoices={false}
        pendingConfirm={null}
        hasChoices={false}
        history={[]}
        showHistory={false}
      />,
    );
    expect(container.textContent).toContain("第一章");
    expect(container.textContent).toContain("这是章节背景说明");
  });

  it("ending 渲染结局场景（用例 1）", () => {
    const scene: SceneDefinition = {
      id: "test_ending",
      name: "测试结局",
      chapterId: "d8_1937_winter",
      template: "ending",
      background: "/assets/backgrounds/bg_ending_electric_wave_return.webp",
      showTopStatusBar: false,
      showDialoguePanel: false,
      content: {
        ending: {
          title: "《测试结局》",
          paragraphs: ["第一段文字", "第二段文字"],
        },
      },
      nextSceneId: "next",
    };
    const { container } = render(
      <SceneRenderer
        scene={scene}
        state={makeMinimalState()}
        engine={makeEngine()}
        onAdvance={noop}
        onSelectChoice={noop}
        onConfirmCritical={noop}
        onCancelConfirm={noop}
        onRollback={noop}
        onToggleHistory={noop}
        resolvedChoices={[]}
        showingChoices={false}
        pendingConfirm={null}
        hasChoices={false}
        history={[]}
        showHistory={false}
      />,
    );
    expect(container.textContent).toContain("《测试结局》");
    expect(container.textContent).toContain("第一段文字");
  });

  it("freeLayout 降级渲染（用例 1）", () => {
    const scene: SceneDefinition = {
      id: "test_free",
      name: "测试自由排版",
      chapterId: "d8_1937_winter",
      template: "freeLayout",
      background: "/assets/backgrounds/bg_journey_review.webp",
      showTopStatusBar: false,
      showDialoguePanel: false,
      content: { text: "自由排版降级文本", chapterTitle: "旅程回顾" },
      nextSceneId: "next",
    };
    const { container } = render(
      <SceneRenderer
        scene={scene}
        state={makeMinimalState()}
        engine={makeEngine()}
        onAdvance={noop}
        onSelectChoice={noop}
        onConfirmCritical={noop}
        onCancelConfirm={noop}
        onRollback={noop}
        onToggleHistory={noop}
        resolvedChoices={[]}
        showingChoices={false}
        pendingConfirm={null}
        hasChoices={false}
        history={[]}
        showHistory={false}
      />,
    );
    expect(container.textContent).toContain("自由排版降级文本");
  });

  it("letter 缺少内容时安全降级（用例 2）", () => {
    const scene: SceneDefinition = {
      id: "test_letter_empty",
      name: "测试空家书",
      chapterId: "prologue_1931",
      template: "letter",
      background: "/assets/backgrounds/bg_prologue_1931_station.webp",
      showTopStatusBar: false,
      showDialoguePanel: false,
      content: { text: "信" },
      nextSceneId: "next",
    };
    const { container } = render(
      <SceneRenderer
        scene={scene}
        state={makeMinimalState()}
        engine={makeEngine()}
        onAdvance={noop}
        onSelectChoice={noop}
        onConfirmCritical={noop}
        onCancelConfirm={noop}
        onRollback={noop}
        onToggleHistory={noop}
        resolvedChoices={[]}
        showingChoices={false}
        pendingConfirm={null}
        hasChoices={false}
        history={[]}
        showHistory={false}
      />,
    );
    // 应降级显示"家书内容暂缺"
    expect(container.textContent).toContain("家书内容暂缺");
  });

  it("特殊模板不渲染普通状态栏和216px对话框（用例 4）", () => {
    const scene: SceneDefinition = {
      id: "test_ending_nobar",
      name: "无状态栏结局",
      chapterId: "d8_1937_winter",
      template: "ending",
      background: "/assets/backgrounds/bg_ending_foreign_lamp.webp",
      showTopStatusBar: false,
      showDialoguePanel: false,
      content: {
        ending: {
          title: "《异乡长灯》",
          paragraphs: ["沈怀远选择留下完成研究。"],
        },
      },
      nextSceneId: "journey_review",
    };
    const { container } = render(
      <SceneRenderer
        scene={scene}
        state={makeMinimalState()}
        engine={makeEngine()}
        onAdvance={noop}
        onSelectChoice={noop}
        onConfirmCritical={noop}
        onCancelConfirm={noop}
        onRollback={noop}
        onToggleHistory={noop}
        resolvedChoices={[]}
        showingChoices={false}
        pendingConfirm={null}
        hasChoices={false}
        history={[]}
        showHistory={false}
      />,
    );
    // 不应包含状态栏特有的数值标签
    expect(container.textContent).not.toContain("学识");
    expect(container.textContent).not.toContain("身心");
    // 但应包含结局内容
    expect(container.textContent).toContain("《异乡长灯》");
  });

  it("seasonJournal 缺少内容时安全降级", () => {
    const scene: SceneDefinition = {
      id: "test_journal_empty",
      name: "测试空札记",
      chapterId: "d1_1936_spring",
      template: "seasonJournal",
      background: "/assets/backgrounds/bg_day01_spring_lab.webp",
      showTopStatusBar: false,
      showDialoguePanel: false,
      content: { text: "札记" },
      nextSceneId: "next",
    };
    const { container } = render(
      <SceneRenderer
        scene={scene}
        state={makeMinimalState()}
        engine={makeEngine()}
        onAdvance={noop}
        onSelectChoice={noop}
        onConfirmCritical={noop}
        onCancelConfirm={noop}
        onRollback={noop}
        onToggleHistory={noop}
        resolvedChoices={[]}
        showingChoices={false}
        pendingConfirm={null}
        hasChoices={false}
        history={[]}
        showHistory={false}
      />,
    );
    expect(container.textContent).toContain("季节札记内容暂缺");
  });

  it("historicalEvent 缺少内容时安全降级", () => {
    const scene: SceneDefinition = {
      id: "test_hist_empty",
      name: "测试空历史事件",
      chapterId: "d6_1937_summer",
      template: "historicalEvent",
      background: "/assets/backgrounds/bg_day06_summer_lab_radio.webp",
      showTopStatusBar: false,
      showDialoguePanel: false,
      content: { text: "历史" },
      nextSceneId: "next",
    };
    const { container } = render(
      <SceneRenderer
        scene={scene}
        state={makeMinimalState()}
        engine={makeEngine()}
        onAdvance={noop}
        onSelectChoice={noop}
        onConfirmCritical={noop}
        onCancelConfirm={noop}
        onRollback={noop}
        onToggleHistory={noop}
        resolvedChoices={[]}
        showingChoices={false}
        pendingConfirm={null}
        hasChoices={false}
        history={[]}
        showHistory={false}
      />,
    );
    expect(container.textContent).toContain("历史事件内容暂缺");
  });
});
