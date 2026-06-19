import type { SceneDefinition, HistoryEntry } from "@/schemas/types";

/**
 * sceneHistory.ts — 特殊场景历史记录生成
 *
 * 纯函数，不修改 store。
 * 规则：一个场景只在真正离开时记录一次。
 */

/** 构建历史条目（不含 id 和 createdAt，由 store 补充） */
export function buildHistoryEntryFromScene(
  scene: SceneDefinition,
): Omit<HistoryEntry, "id" | "createdAt"> | null {
  const template = scene.template;
  const content = scene.content;

  switch (template) {
    case "standardDialogue": {
      // 普通对话：记录 content.text
      if (!content?.text) return null;
      return {
        sceneId: scene.id,
        type: content.textType === "narration" ? "system" : "text",
        speakerName: content.speakerName,
        text: content.text,
      };
    }

    case "letter": {
      // 家书：记录 historyPlainText，type=letter
      const letter = content?.letter;
      if (!letter?.historyPlainText) return null;
      return {
        sceneId: scene.id,
        type: "letter",
        text: letter.historyPlainText,
      };
    }

    case "historicalEvent": {
      // 历史事件：标题 + 正文摘要，type=system
      const evt = content?.historicalEvent;
      if (!evt) return null;
      const summary = evt.paragraphs.slice(0, 2).join(" ");
      const text = evt.title + (summary ? " — " + summary : "");
      return {
        sceneId: scene.id,
        type: "system",
        text: text,
      };
    }

    case "chapterIntro": {
      // 章节介绍：章节标题 + 背景说明，type=system
      const chapterTitle = content?.chapterTitle;
      const bgText = content?.backgroundText;
      if (!chapterTitle && !bgText) {
        // 降级：使用 content.text
        if (content?.text) {
          return { sceneId: scene.id, type: "system", text: content.text };
        }
        return null;
      }
      const text = chapterTitle
        ? (bgText ? `【${chapterTitle}】${bgText}` : `【${chapterTitle}】`)
        : (bgText ?? "");
      return {
        sceneId: scene.id,
        type: "system",
        text: text,
      };
    }

    case "seasonJournal": {
      // 季节札记：journalText，type=system
      const journal = content?.journal;
      if (!journal?.journalText) return null;
      return {
        sceneId: scene.id,
        type: "system",
        text: journal.journalText,
      };
    }

    case "ending": {
      // 结局：结局标题 + 正文摘要，type=system
      const ending = content?.ending;
      if (!ending) {
        if (content?.text) {
          return { sceneId: scene.id, type: "system", text: content.text };
        }
        return null;
      }
      const summary = ending.paragraphs.slice(0, 1).join(" ");
      const text = ending.title + (summary ? " — " + summary : "");
      return {
        sceneId: scene.id,
        type: "system",
        text: text,
      };
    }

    case "freeLayout": {
      // 自由排版：可读文本摘要；无文本则不记录
      if (content?.text) {
        return {
          sceneId: scene.id,
          type: "system",
          text: content.text,
        };
      }
      return null;
    }

    default:
      return null;
  }
}
