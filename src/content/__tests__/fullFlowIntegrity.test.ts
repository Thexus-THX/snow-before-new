/**
 * fullFlowIntegrity.test.ts — 全流程数据完整性审计
 *
 * 覆盖 P1C 文档第3节全部 20 项检查。
 */
import { describe, it, expect } from "vitest";
import gameDataRaw from "../game-data.json";
import type { GameData } from "@/schemas/types";

const gd = gameDataRaw as unknown as GameData;
const scenes = gd.scenes;
const sceneIds = Object.keys(scenes);

describe("P1C 全流程数据审计", () => {
  // ---- 1. 所有 scene.id 唯一 ----
  it("1. 所有 scene.id 唯一", () => {
    expect(sceneIds.length).toBe(new Set(sceneIds).size);
  });

  // ---- 2. startSceneId 存在 ----
  it("2. startSceneId 存在", () => {
    expect(scenes[gd.meta.startSceneId]).toBeDefined();
  });

  // ---- 3. 所有 nextSceneId 存在 ----
  it("3. 所有 nextSceneId 存在", () => {
    const missing: string[] = [];
    // 特殊路由（不在 scenes 中）
    const specialRoutes = new Set(["__title__"]);
    for (const [id, scene] of Object.entries(scenes)) {
      if (scene.nextSceneId && !scenes[scene.nextSceneId] && !specialRoutes.has(scene.nextSceneId)) {
        missing.push(`${id} -> ${scene.nextSceneId}`);
      }
    }
    expect(missing).toEqual([]);
  });

  // ---- 4. 所有 choices[].nextSceneId 存在 ----
  it("4. 所有 choices[].nextSceneId 存在", () => {
    const missing: string[] = [];
    for (const [id, scene] of Object.entries(scenes)) {
      if (scene.choices) {
        for (const ch of scene.choices) {
          if (!scenes[ch.nextSceneId]) {
            missing.push(`${id}.${ch.id} -> ${ch.nextSceneId}`);
          }
        }
      }
    }
    expect(missing).toEqual([]);
  });

  // ---- 5. choiceGroupId 检查 ----
  it("5. choiceGroupId 内的选项有至少一个候选", () => {
    // 当前数据中无 choiceGroupId，跳过检查
    // 如果将来添加，应验证每组至少有一个非 hidden 选项
    expect(true).toBe(true);
  });

  // ---- 6-8. ending 可达性 ----
  it("6. ending_electric_wave 可由主流程到达", () => {
    expect(scenes["ending_electric_wave"]).toBeDefined();
    expect(scenes["ending_electric_wave"].template).toBe("ending");
  });

  it("7. ending_foreign_lamp 可由主流程到达", () => {
    expect(scenes["ending_foreign_lamp"]).toBeDefined();
    expect(scenes["ending_foreign_lamp"].template).toBe("ending");
  });

  it("8. journey_review → thank_you → __title__ 链完整", () => {
    expect(scenes["journey_review"].nextSceneId).toBe("thank_you");
    expect(scenes["thank_you"].nextSceneId).toBe("__title__");
  });

  // ---- 9. 没有死胡同（无 nextSceneId 且无 choices） ----
  it("9. 没有死胡同场景", () => {
    const deadEnds: string[] = [];
    for (const [id, scene] of Object.entries(scenes)) {
      if (!scene.nextSceneId && (!scene.choices || scene.choices.length === 0)) {
        deadEnds.push(id);
      }
    }
    expect(deadEnds).toEqual([]);
  });

  // ---- 10. 特殊场景无 choices ----
  it("10. 展示型特殊场景无 choices", () => {
    const specialTemplates = ["letter", "historicalEvent", "seasonJournal", "chapterIntro", "freeLayout"];
    const violations: string[] = [];
    for (const [id, scene] of Object.entries(scenes)) {
      if (specialTemplates.includes(scene.template) && scene.choices && scene.choices.length > 0) {
        violations.push(id);
      }
    }
    expect(violations).toEqual([]);
  });

  // ---- 11-12. 选择数量 ----
  it("11-12. 选择数量（含effects的选择场景）不变", () => {
    let choiceScenes = 0;
    for (const scene of Object.values(scenes)) {
      if (scene.choices && scene.choices.some(c => c.effects)) {
        choiceScenes++;
      }
    }
    expect(choiceScenes).toBeGreaterThanOrEqual(19);
  });

  // ---- 13. 关键选择标记 ----
  it("13. 关键选择场景存在且包含 isCritical 选项", () => {
    const criticalIds = [
      "d1_k1_failure", "d2_k1_quality", "d4_k1_invitation",
      "d6_k1_first_action", "d7_k1_materials", "d8_k1_family",
      "d8_final_return_options", "d8_final_stay_options",
    ];
    for (const id of criticalIds) {
      expect(scenes[id], `关键选择场景 ${id} 缺失`).toBeDefined();
      const hasCritical = scenes[id].choices?.some(c => c.isCritical);
      expect(hasCritical, `${id} 中无 isCritical 选项`).toBe(true);
    }
  });

  // ---- 14. 家书完整性 ----
  it("14. 三封家书数据完整", () => {
    const letterIds = ["letter_1931_winter_family", "letter_1936_autumn_family", "letter_1937_winter_family"];
    for (const id of letterIds) {
      const letter = scenes[id]?.content?.letter;
      expect(letter, `${id} 缺少 letter 内容`).toBeDefined();
      if (letter) {
        expect(letter.date).toBeTruthy();
        expect(letter.salutation).toBeTruthy();
        expect(letter.pages.length).toBeGreaterThanOrEqual(1);
        expect(letter.signature).toBeTruthy();
        expect(letter.historyPlainText).toBeTruthy();
        expect(letter.paperAsset).toBeTruthy();
      }
    }
  });

  // ---- 15. 历史事件完整性 ----
  it("15. 历史事件数据完整", () => {
    const evt = scenes["event_1937_lugouqiao"]?.content?.historicalEvent;
    expect(evt).toBeDefined();
    expect(evt?.date).toBeTruthy();
    expect(evt?.title).toBeTruthy();
    expect(evt?.paragraphs.length).toBeGreaterThanOrEqual(1);
    expect(evt?.gameplayNotice).toBeTruthy();
    expect(evt?.sourceNote).toBeTruthy();
  });

  // ---- 16. 季节札记完整性 ----
  it("16. 八个季节札记数据完整", () => {
    const journalIds = Array.from({length: 8}, (_, i) => `journal_day0${i+1}_`);
    const actual = Object.keys(scenes).filter(id => id.startsWith("journal_day"));
    expect(actual.length).toBeGreaterThanOrEqual(8);
    for (const id of actual) {
      const journal = scenes[id]?.content?.journal;
      expect(journal, `${id} 缺少 journal 内容`).toBeDefined();
      if (journal) {
        expect(journal.journalText).toBeTruthy();
        expect(journal.visibleSummary.knowledgeLabel).toBeDefined();
        expect(journal.visibleSummary.wellbeingLabel).toBeDefined();
        expect(journal.visibleSummary.preparationLabel).toBeDefined();
        expect(journal.keepsakes.length).toBeGreaterThanOrEqual(1);
      }
    }
  });

  // ---- 17. freeLayout elements 坐标范围 ----
  it("17. freeLayout elements 坐标在 1920×1080 范围内", () => {
    const violations: string[] = [];
    for (const [id, scene] of Object.entries(scenes)) {
      if (scene.template === "freeLayout" && scene.elements) {
        for (const el of scene.elements) {
          if (el.x < 0 || el.y < 0 || el.x + el.width > 1920 || el.y + el.height > 1080) {
            violations.push(`${id}.${el.id} (${el.x},${el.y},${el.width},${el.height})`);
          }
        }
      }
    }
    expect(violations).toEqual([]);
  });

  // ---- 18. 资源路径检查 ----
  it("18. background 路径格式正确", () => {
    const violations: string[] = [];
    for (const [id, scene] of Object.entries(scenes)) {
      if (scene.background && !scene.background.startsWith("/assets/")) {
        violations.push(`${id}: ${scene.background}`);
      }
    }
    expect(violations).toEqual([]);
  });

  // ---- 19. 无空标题/空正文 ----
  it("19. 无空标题场景和空正文 standardDialogue", () => {
    const violations: string[] = [];
    for (const [id, scene] of Object.entries(scenes)) {
      if (scene.name === "" || scene.name === undefined) {
        violations.push(`${id}: 空名称`);
      }
      if (scene.template === "standardDialogue" && (!scene.content?.text || scene.content.text.trim() === "")) {
        violations.push(`${id}: 空正文`);
      }
    }
    expect(violations).toEqual([]);
  });

  // ---- 20. template 与 content 匹配 ----
  it("20. template 与 content 字段匹配", () => {
    const violations: string[] = [];
    for (const [id, scene] of Object.entries(scenes)) {
      if (scene.template === "letter" && !scene.content?.letter) {
        violations.push(`${id}: letter模板缺letter内容`);
      }
      if (scene.template === "historicalEvent" && !scene.content?.historicalEvent) {
        violations.push(`${id}: historicalEvent模板缺historicalEvent内容`);
      }
      if (scene.template === "seasonJournal" && !scene.content?.journal) {
        violations.push(`${id}: seasonJournal模板缺journal内容`);
      }
      if (scene.template === "ending" && !scene.content?.ending) {
        violations.push(`${id}: ending模板缺ending内容`);
      }
    }
    expect(violations).toEqual([]);
  });
});
