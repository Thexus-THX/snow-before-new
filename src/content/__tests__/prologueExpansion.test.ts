/**
 * P5A-Day0: 序章扩写测试
 */
import { describe, it, expect } from "vitest";
import gameDataRaw from "../game-data.json";
import type { GameData, GameState } from "@/schemas/types";

const gd = gameDataRaw as unknown as GameData;
const scenes = gd.scenes;

describe("P5A 序章扩写", () => {
  it("新增序章节点 scene.id 唯一", () => {
    const ids = Object.keys(scenes);
    expect(ids.length).toBe(new Set(ids).size);
  });

  it("新增序章节点全部存在", () => {
    const expected = [
      "prologue_platform_language",
      "prologue_customs_and_registration",
      "prologue_nadya_first_help",
      "prologue_first_radio_room",
    ];
    for (const id of expected) {
      expect(scenes[id], `Missing: ${id}`).toBeDefined();
    }
  });

  it("新增序章节点可从 startSceneId 到达", () => {
    const startId = gd.meta.startSceneId;
    const reachable = new Set<string>();
    const queue = [startId];
    while (queue.length > 0) {
      const currentId = queue.shift()!;
      if (reachable.has(currentId)) continue;
      const scene = scenes[currentId];
      if (!scene) continue;
      reachable.add(currentId);
      if (scene.nextSceneId && !reachable.has(scene.nextSceneId)) {
        queue.push(scene.nextSceneId);
      }
      if (scene.choices) {
        for (const ch of scene.choices) {
          if (!reachable.has(ch.nextSceneId)) queue.push(ch.nextSceneId);
        }
      }
    }
    const expected = [
      "prologue_platform_language",
      "prologue_customs_and_registration",
      "prologue_nadya_first_help",
      "prologue_first_radio_room",
    ];
    for (const id of expected) {
      expect(reachable.has(id), `${id} not reachable`).toBe(true);
    }
  });

  it("三个 prologue_choice 分支汇入主线", () => {
    // letter/radio → prologue_meet_nadya → prologue_nadya_first_help
    expect(scenes["prologue_letter_result"].nextSceneId).toBe("prologue_meet_nadya");
    expect(scenes["prologue_radio_result"].nextSceneId).toBe("prologue_meet_nadya");
    expect(scenes["prologue_meet_nadya"].nextSceneId).toBe("prologue_nadya_first_help");
    // people 已有娜佳认识，直接汇入
    expect(scenes["prologue_people_result"].nextSceneId).toBe("prologue_nadya_first_help");
  });

  it("prologue_choice 原有效果仍保留", () => {
    const pc = scenes["prologue_choice"];
    expect(pc.choices).toBeDefined();
    expect(pc.choices!.length).toBe(3);
    // Check effects preserved
    const letter = pc.choices!.find(c => c.id === "P0_LETTER");
    expect(letter!.effects!.stats!.homesickness).toBe(1);
    const radio = pc.choices!.find(c => c.id === "P0_RADIO");
    expect(radio!.effects!.stats!.knowledge).toBe(1);
    const people = pc.choices!.find(c => c.id === "P0_PEOPLE");
    expect(people!.effects!.trust!.nadya).toBe(1);
  });

  it("prologue_choice 新增 flags 存在", () => {
    const pc = scenes["prologue_choice"];
    const flags: Record<string, string> = {};
    for (const ch of pc.choices!) {
      for (const f of ch.effects!.addFlags || []) {
        if (f.startsWith("flag_prologue_first_")) {
          flags[ch.id] = f;
        }
      }
    }
    expect(flags["P0_LETTER"]).toBe("flag_prologue_first_letter");
    expect(flags["P0_RADIO"]).toBe("flag_prologue_first_radio");
    expect(flags["P0_PEOPLE"]).toBe("flag_prologue_first_people");
  });

  it("序章最终能进入 Day1", () => {
    // prologue_study_montage_1931_1936 -> prologue_time_skip -> letter_1931_winter_family -> d1_spring_arrival
    expect(scenes["prologue_study_montage_1931_1936"].nextSceneId).toBe("prologue_time_skip");
    expect(scenes["prologue_time_skip"].nextSceneId).toBe("letter_1931_winter_family");
    expect(scenes["letter_1931_winter_family"].nextSceneId).toBe("d1_spring_arrival");
  });

  it("不新增有效选择", () => {
    const newIds = [
      "prologue_platform_language",
      "prologue_customs_and_registration",
      "prologue_nadya_first_help",
      "prologue_first_radio_room",
    ];
    for (const id of newIds) {
      const scene = scenes[id];
      expect(scene.choices).toBeUndefined();
    }
  });

  it("不新增关键选择", () => {
    // prologue_choice 仍然是唯一的序章选择且非关键
    const pc = scenes["prologue_choice"];
    for (const ch of pc.choices!) {
      expect(ch.isCritical).toBeFalsy();
    }
  });

  it("新增背景文件路径存在", () => {
    // 验证引用路径格式正确
    expect(scenes["prologue_customs_and_registration"].background).toBe(
      "/assets/backgrounds/bg_prologue_registration_station.webp"
    );
    expect(scenes["prologue_first_radio_room"].background).toBe(
      "/assets/backgrounds/bg_prologue_radio_room_1931.webp"
    );
    expect(scenes["prologue_dorm_first_night"].background).toBe(
      "/assets/backgrounds/bg_prologue_dorm_first_night.webp"
    );
  });
});
