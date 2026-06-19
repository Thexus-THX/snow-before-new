/**
 * LetterScene 测试
 *
 * 覆盖：
 * 5. 家书1页直接显示完成按钮
 * 6. 家书3页按顺序翻页
 * 7. 翻页不会推进场景
 * 8. 最后一页只能推进一次
 * 9. 切换到另一封信页码重置
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, fireEvent, act } from "@testing-library/react";
import LetterScene from "@/components/scenes/LetterScene";
import type { SceneDefinition, GameState } from "@/schemas/types";
import { GameEngine } from "@/engine/gameEngine";
import gameDataRaw from "@/content/game-data.json";
import { validateGameData } from "@/schemas/gameSchema";

const validated = validateGameData(gameDataRaw);
const realGameData = validated.success ? validated.data : null;

function makeMinimalState(): GameState {
  return {
    currentSceneId: "test_letter",
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
    visitedSceneIds: ["test_letter"],
  };
}

function makeEngine() {
  return new GameEngine(realGameData as any);
}

function makeLetterScene(pages: string[], overrides: Partial<SceneDefinition> = {}): SceneDefinition {
  return {
    id: "test_letter",
    name: "测试家书",
    chapterId: "prologue_1931",
    template: "letter",
    background: "/assets/backgrounds/bg_prologue_1931_station.webp",
    showTopStatusBar: false,
    showDialoguePanel: false,
    content: {
      letter: {
        date: "1931年12月",
        salutation: "怀远吾儿：",
        pages,
        postscript: "母字",
        signature: "母 沈陈氏",
        paperAsset: "/assets/ui/ui_letter_paper.png",
        historyPlainText: "家书内容摘要",
      },
    },
    nextSceneId: "next_scene",
    ...overrides,
  };
}

describe("LetterScene 家书翻页", () => {
  it("1页家书直接显示收起信件按钮（用例 5）", () => {
    const scene = makeLetterScene(["第一页也是最后一页内容"]);
    const onAdvance = vi.fn();
    const { container } = render(
      <LetterScene scene={scene} state={makeMinimalState()} engine={makeEngine()} onAdvance={onAdvance} />,
    );
    // 页码显示 1 / 1
    expect(container.textContent).toContain("1 / 1");
    // 应显示"收起信件"按钮
    expect(container.textContent).toContain("收起信件");
    // 不应显示"后页"按钮
    expect(container.textContent).not.toContain("后页");
  });

  it("3页家书按顺序翻页（用例 6）", () => {
    const scene = makeLetterScene(["第一页内容", "第二页内容", "第三页内容"]);
    const onAdvance = vi.fn();
    const { container } = render(
      <LetterScene scene={scene} state={makeMinimalState()} engine={makeEngine()} onAdvance={onAdvance} />,
    );

    // 初始：第1页，显示"后页"按钮
    expect(container.textContent).toContain("1 / 3");
    expect(container.textContent).toContain("第一页内容");
    expect(container.textContent).toContain("后页");

    // 翻到第2页
    const nextBtn = container.querySelector("button:not(:disabled)");
    expect(nextBtn?.textContent).toContain("后页");
    fireEvent.click(nextBtn!);

    expect(container.textContent).toContain("2 / 3");
    expect(container.textContent).toContain("第二页内容");

    // 翻到第3页
    const nextBtn2 = container.querySelectorAll("button");
    const next2 = Array.from(nextBtn2).find((b) => b.textContent?.includes("后页"));
    fireEvent.click(next2!);

    expect(container.textContent).toContain("3 / 3");
    expect(container.textContent).toContain("第三页内容");
    expect(container.textContent).toContain("收起信件");
  });

  it("翻页不会推进场景（用例 7）", () => {
    const scene = makeLetterScene(["第一页", "第二页"]);
    const onAdvance = vi.fn();
    const { container } = render(
      <LetterScene scene={scene} state={makeMinimalState()} engine={makeEngine()} onAdvance={onAdvance} />,
    );

    // 点击"后页"
    const nextBtn = container.querySelector("button:not(:disabled)");
    fireEvent.click(nextBtn!);

    // onAdvance 不应被调用（翻页不是推进场景）
    expect(onAdvance).not.toHaveBeenCalled();
    expect(container.textContent).toContain("2 / 2");
  });

  it("最后一页收起信件触发场景推进（用例 8）", () => {
    const scene = makeLetterScene(["唯一一页"]);
    const onAdvance = vi.fn();
    const { container } = render(
      <LetterScene scene={scene} state={makeMinimalState()} engine={makeEngine()} onAdvance={onAdvance} />,
    );

    const closeBtn = Array.from(container.querySelectorAll("button")).find(
      (b) => b.textContent?.includes("收起信件"),
    );
    expect(closeBtn).toBeDefined();
    fireEvent.click(closeBtn!);

    expect(onAdvance).toHaveBeenCalledWith("next_scene");
    expect(onAdvance).toHaveBeenCalledTimes(1);
  });

  it("切换到另一封信页码重置（用例 9）", () => {
    const scene1 = makeLetterScene(["第一封第一页", "第一封第二页"]);
    const scene2 = makeLetterScene(["第二封内容"], { id: "test_letter_2" });

    const onAdvance = vi.fn();
    const { container, rerender } = render(
      <LetterScene scene={scene1} state={makeMinimalState()} engine={makeEngine()} onAdvance={onAdvance} />,
    );

    // 翻到第二页
    const nextBtn = container.querySelector("button:not(:disabled)");
    fireEvent.click(nextBtn!);
    expect(container.textContent).toContain("2 / 2");

    // 切换到另一封信
    rerender(
      <LetterScene scene={scene2} state={makeMinimalState()} engine={makeEngine()} onAdvance={onAdvance} />,
    );

    // 页码应重置为 1 / 1
    expect(container.textContent).toContain("1 / 1");
    expect(container.textContent).toContain("第二封内容");
  });
});
