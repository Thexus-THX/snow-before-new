/**
 * FreeLayoutScene 测试
 *
 * 覆盖：
 * 10. historicalEvent 显示日期、标题、段落和提示（已移入 SceneRenderer 测试）
 * 11. seasonJournal 不显示隐藏数值（已移入 SceneRenderer 测试）
 * 12. freeLayout 按坐标和 zIndex 渲染图片与文字
 */
import { describe, it, expect, vi } from "vitest";
import { render } from "@testing-library/react";
import FreeLayoutScene from "@/components/scenes/FreeLayoutScene";
import type { SceneDefinition, GameState } from "@/schemas/types";
import { GameEngine } from "@/engine/gameEngine";
import gameDataRaw from "@/content/game-data.json";
import { validateGameData } from "@/schemas/gameSchema";

const validated = validateGameData(gameDataRaw);
const realGameData = validated.success ? validated.data : null;

function makeMinimalState(): GameState {
  return {
    currentSceneId: "test_free",
    chapterId: "d8_1937_winter",
    stats: { knowledge: 5, wellbeing: 5, responsibility: 5, homesickness: 5 },
    preparationItems: { route: 0, documents: 0, funds: 0, technicalMaterials: 0, contact: 0 },
    trust: { chen: 5, nadya: 5, belov: 5, ivan: 5 },
    cooperationModifier: 0,
    returnTendency: 0,
    stayTendency: 0,
    flags: [],
    lockedCriticalChoiceIds: [],
    history: [],
    visitedSceneIds: ["test_free"],
  };
}

function makeEngine() {
  return new GameEngine(realGameData as any);
}

describe("FreeLayoutScene 自由排版", () => {
  it("按坐标和 zIndex 渲染图片与文字（用例 12）", () => {
    const scene: SceneDefinition = {
      id: "test_free_elements",
      name: "测试自由排版",
      chapterId: "d8_1937_winter",
      template: "freeLayout",
      background: "/assets/backgrounds/bg_journey_review.webp",
      showTopStatusBar: false,
      showDialoguePanel: false,
      elements: [
        {
          id: "el_bg",
          type: "image",
          x: 0,
          y: 0,
          width: 1920,
          height: 1080,
          opacity: 0.5,
          zIndex: 0,
          asset: "/assets/ui/ui_journey_review_panel.png",
          fit: "cover",
        },
        {
          id: "el_title",
          type: "text",
          x: 100,
          y: 80,
          width: 400,
          height: 60,
          opacity: 1,
          zIndex: 2,
          text: "旅程回顾",
          fontFamily: "serif",
          fontSize: 48,
          lineHeight: 1.2,
          align: "center",
          color: "#e8dfcf",
        },
        {
          id: "el_body",
          type: "text",
          x: 100,
          y: 200,
          width: 600,
          height: 400,
          opacity: 0.9,
          zIndex: 1,
          text: "正文内容",
          fontFamily: "serif",
          fontSize: 24,
          lineHeight: 1.8,
          align: "left",
          color: "#b8a88c",
          backgroundColor: "rgba(0,0,0,0.3)",
        },
      ],
      nextSceneId: "next",
    };
    const onAdvance = vi.fn();
    const { container } = render(
      <FreeLayoutScene scene={scene} state={makeMinimalState()} engine={makeEngine()} onAdvance={onAdvance} />,
    );

    // 应渲染文字
    expect(container.textContent).toContain("旅程回顾");
    expect(container.textContent).toContain("正文内容");

    // 应有图片元素
    const imgs = container.querySelectorAll("img");
    expect(imgs.length).toBe(1);

    // 应有文字 div（按绝对定位）
    const textDivs = container.querySelectorAll('[style*="position: absolute"]');
    expect(textDivs.length).toBeGreaterThanOrEqual(2); // 至少 img + 2 个 text div
  });

  it("无 elements 时安全降级显示 content.text", () => {
    const scene: SceneDefinition = {
      id: "test_free_noelem",
      name: "无元素自由排版",
      chapterId: "d8_1937_winter",
      template: "freeLayout",
      background: "/assets/backgrounds/bg_journey_review.webp",
      showTopStatusBar: false,
      showDialoguePanel: false,
      content: { text: "降级文本", chapterTitle: "回顾" },
      nextSceneId: "next",
    };
    const onAdvance = vi.fn();
    const { container } = render(
      <FreeLayoutScene scene={scene} state={makeMinimalState()} engine={makeEngine()} onAdvance={onAdvance} />,
    );

    expect(container.textContent).toContain("降级文本");
    expect(container.textContent).toContain("回顾");
  });

  it("图片加载失败时不白屏", () => {
    const scene: SceneDefinition = {
      id: "test_free_badimg",
      name: "坏图自由排版",
      chapterId: "d8_1937_winter",
      template: "freeLayout",
      background: "/assets/backgrounds/bg_journey_review.webp",
      showTopStatusBar: false,
      showDialoguePanel: false,
      elements: [
        {
          id: "bad_img",
          type: "image",
          x: 0,
          y: 0,
          width: 100,
          height: 100,
          opacity: 1,
          zIndex: 0,
          asset: "/assets/nonexistent.png",
          fit: "contain",
        },
        {
          id: "good_text",
          type: "text",
          x: 0,
          y: 0,
          width: 200,
          height: 50,
          opacity: 1,
          zIndex: 1,
          text: "文字仍在",
          fontFamily: "serif",
          fontSize: 20,
          lineHeight: 1.5,
          align: "left",
          color: "#fff",
        },
      ],
      nextSceneId: "next",
    };
    const onAdvance = vi.fn();
    const { container } = render(
      <FreeLayoutScene scene={scene} state={makeMinimalState()} engine={makeEngine()} onAdvance={onAdvance} />,
    );

    // 文字应该还在
    expect(container.textContent).toContain("文字仍在");
    // 页面不应该崩溃
    expect(container.querySelector(".special-scene-shell")).toBeTruthy();
  });
});
