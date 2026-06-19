/**
 * sceneHistory 测试
 *
 * 覆盖：
 * 13. sceneHistory 对每种模板生成正确且不泄露隐藏值的记录
 * 14. P0/P0.1 原有测试全部继续通过（由 npm run check 保证）
 */
import { describe, it, expect } from "vitest";
import { buildHistoryEntryFromScene } from "@/engine/sceneHistory";
import type { SceneDefinition } from "@/schemas/types";

describe("sceneHistory 历史记录生成", () => {
  it("standardDialogue 记录 content.text", () => {
    const scene: SceneDefinition = {
      id: "s1",
      name: "普通场景",
      chapterId: "ch1",
      template: "standardDialogue",
      content: { speakerId: "narrator", textType: "narration", text: "旁白文本" },
    };
    const entry = buildHistoryEntryFromScene(scene);
    expect(entry).toBeTruthy();
    expect(entry!.type).toBe("system");
    expect(entry!.text).toBe("旁白文本");
    expect(entry!.sceneId).toBe("s1");
  });

  it("standardDialogue 对话类型记录为 text", () => {
    const scene: SceneDefinition = {
      id: "s1b",
      name: "对话场景",
      chapterId: "ch1",
      template: "standardDialogue",
      content: { speakerId: "nadya", speakerName: "娜佳", textType: "dialogue", text: "你好" },
    };
    const entry = buildHistoryEntryFromScene(scene);
    expect(entry!.type).toBe("text");
    expect(entry!.speakerName).toBe("娜佳");
  });

  it("standardDialogue 无文本时返回 null", () => {
    const scene: SceneDefinition = {
      id: "s2",
      name: "空场景",
      chapterId: "ch1",
      template: "standardDialogue",
    };
    expect(buildHistoryEntryFromScene(scene)).toBeNull();
  });

  it("letter 记录 historyPlainText，type=letter", () => {
    const scene: SceneDefinition = {
      id: "l1",
      name: "家书",
      chapterId: "ch1",
      template: "letter",
      content: {
        letter: {
          pages: ["内容"],
          paperAsset: "/assets/ui/ui_letter_paper.png",
          historyPlainText: "家书摘要文本",
        },
      },
    };
    const entry = buildHistoryEntryFromScene(scene);
    expect(entry).toBeTruthy();
    expect(entry!.type).toBe("letter");
    expect(entry!.text).toBe("家书摘要文本");
  });

  it("letter 无 historyPlainText 返回 null", () => {
    const scene: SceneDefinition = {
      id: "l2",
      name: "无摘要家书",
      chapterId: "ch1",
      template: "letter",
    };
    expect(buildHistoryEntryFromScene(scene)).toBeNull();
  });

  it("historicalEvent 记录标题+摘要，type=system", () => {
    const scene: SceneDefinition = {
      id: "h1",
      name: "历史事件",
      chapterId: "ch1",
      template: "historicalEvent",
      content: {
        historicalEvent: {
          date: "1937-07-07",
          title: "卢沟桥事变",
          imageAsset: "/assets/props/prop_newspaper_lugouqiao_1937.png",
          paragraphs: ["第一段描述", "第二段描述", "第三段描述"],
        },
      },
    };
    const entry = buildHistoryEntryFromScene(scene);
    expect(entry).toBeTruthy();
    expect(entry!.type).toBe("system");
    expect(entry!.text).toContain("卢沟桥事变");
    expect(entry!.text).toContain("第一段描述");
  });

  it("chapterIntro 记录章节标题+背景说明，type=system", () => {
    const scene: SceneDefinition = {
      id: "c1",
      name: "章节介绍",
      chapterId: "ch1",
      template: "chapterIntro",
      content: {
        chapterTitle: "第一章",
        backgroundText: "这是背景说明文字。",
      },
    };
    const entry = buildHistoryEntryFromScene(scene);
    expect(entry).toBeTruthy();
    expect(entry!.type).toBe("system");
    expect(entry!.text).toContain("第一章");
    expect(entry!.text).toContain("背景说明");
  });

  it("chapterIntro 无标题但有 text 时降级使用 text", () => {
    const scene: SceneDefinition = {
      id: "c2",
      name: "降级章节",
      chapterId: "ch1",
      template: "chapterIntro",
      content: { text: "五年后" },
    };
    const entry = buildHistoryEntryFromScene(scene);
    expect(entry).toBeTruthy();
    expect(entry!.text).toBe("五年后");
  });

  it("seasonJournal 记录 journalText，type=system", () => {
    const scene: SceneDefinition = {
      id: "j1",
      name: "札记",
      chapterId: "ch1",
      template: "seasonJournal",
      content: {
        journal: {
          visibleSummary: {
            knowledgeLabel: "博学",
            wellbeingLabel: "良好",
            preparationLabel: "充分",
          },
          journalText: "第一人称札记文本。",
          keepsakes: ["一本笔记"],
        },
      },
    };
    const entry = buildHistoryEntryFromScene(scene);
    expect(entry).toBeTruthy();
    expect(entry!.type).toBe("system");
    expect(entry!.text).toBe("第一人称札记文本。");
    // 不应包含隐藏数值
    expect(entry!.text).not.toContain("博学");
  });

  it("ending 记录标题+摘要，type=system", () => {
    const scene: SceneDefinition = {
      id: "e1",
      name: "结局",
      chapterId: "ch1",
      template: "ending",
      content: {
        ending: {
          title: "《电波归途》",
          paragraphs: ["第一段结局文字", "第二段"],
        },
      },
    };
    const entry = buildHistoryEntryFromScene(scene);
    expect(entry).toBeTruthy();
    expect(entry!.type).toBe("system");
    expect(entry!.text).toContain("《电波归途》");
    expect(entry!.text).toContain("第一段结局文字");
  });

  it("ending 无内容但 text 存在时降级", () => {
    const scene: SceneDefinition = {
      id: "e2",
      name: "降级结局",
      chapterId: "ch1",
      template: "ending",
      content: { text: "结局降级文本" },
    };
    const entry = buildHistoryEntryFromScene(scene);
    expect(entry).toBeTruthy();
    expect(entry!.text).toBe("结局降级文本");
  });

  it("freeLayout 记录 content.text", () => {
    const scene: SceneDefinition = {
      id: "f1",
      name: "自由排版",
      chapterId: "ch1",
      template: "freeLayout",
      content: { text: "自由排版文本" },
    };
    const entry = buildHistoryEntryFromScene(scene);
    expect(entry).toBeTruthy();
    expect(entry!.type).toBe("system");
    expect(entry!.text).toBe("自由排版文本");
  });

  it("freeLayout 无文本时返回 null", () => {
    const scene: SceneDefinition = {
      id: "f2",
      name: "空自由排版",
      chapterId: "ch1",
      template: "freeLayout",
    };
    expect(buildHistoryEntryFromScene(scene)).toBeNull();
  });

  it("seasonJournal 不泄露隐藏数值（用例 13）", () => {
    const scene: SceneDefinition = {
      id: "j2",
      name: "防泄露札记",
      chapterId: "ch1",
      template: "seasonJournal",
      content: {
        journal: {
          visibleSummary: {
            knowledgeLabel: "学识渊博",
            wellbeingLabel: "身心疲惫",
            preparationLabel: "准备不足",
          },
          journalText: "札记正文内容。",
          keepsakes: [],
        },
      },
    };
    const entry = buildHistoryEntryFromScene(scene);
    expect(entry).toBeTruthy();
    // 不应泄露显性标签内容
    expect(entry!.text).not.toContain("学识渊博");
    expect(entry!.text).not.toContain("身心疲惫");
    // 只应包含 journalText
    expect(entry!.text).toBe("札记正文内容。");
  });
});
