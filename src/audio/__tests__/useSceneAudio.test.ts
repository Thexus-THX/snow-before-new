/**
 * useSceneAudio.test.ts — 场景音频映射测试
 */
import { describe, it, expect } from "vitest";
import { getSceneAudio } from "../audioSceneMap";

describe("audioSceneMap", () => {
  it("标题页返回 bgm.title", () => {
    expect(getSceneAudio("__title__").bgm).toBe("bgm.title");
  });

  it("创作说明返回 bgm.title", () => {
    expect(getSceneAudio("note_creative_opening").bgm).toBe("bgm.title");
  });

  it("序章返回 bgm.first_station", () => {
    const config = getSceneAudio("prologue_train");
    expect(config.bgm).toBe("bgm.first_station");
    expect(config.ambience).toContain("amb.station_winter");
  });

  it("Day01 返回 bgm.lab_spring", () => {
    expect(getSceneAudio("d1_lab_intro").bgm).toBe("bgm.lab_spring");
  });

  it("Day02 返回 bgm.factory", () => {
    const config = getSceneAudio("d2_factory_intro");
    expect(config.bgm).toBe("bgm.factory");
  });

  it("Day03 返回 bgm.autumn_letter", () => {
    expect(getSceneAudio("d3_location_choice").bgm).toBe("bgm.autumn_letter");
  });

  it("Day04 返回 bgm.winter_field", () => {
    expect(getSceneAudio("d4_field_intro").bgm).toBe("bgm.winter_field");
  });

  it("Day06 返回 bgm.lugouqiao_tension", () => {
    expect(getSceneAudio("d6_news_intro").bgm).toBe("bgm.lugouqiao_tension");
  });

  it("ending_electric_wave 返回 bgm.ending_return", () => {
    expect(getSceneAudio("ending_electric_wave").bgm).toBe("bgm.ending_return");
  });

  it("ending_foreign_lamp 返回 bgm.ending_lamp", () => {
    expect(getSceneAudio("ending_foreign_lamp").bgm).toBe("bgm.ending_lamp");
  });

  it("家书场景返回 bgm.autumn_letter", () => {
    expect(getSceneAudio("letter_1931_winter_family").bgm).toBe("bgm.autumn_letter");
  });

  it("札记春天返回 bgm.lab_spring", () => {
    expect(getSceneAudio("journal_day01_spring_1936").bgm).toBe("bgm.lab_spring");
  });

  it("札记冬天返回 bgm.winter_field", () => {
    expect(getSceneAudio("journal_day04_winter_1936").bgm).toBe("bgm.winter_field");
  });

  it("journey_review 无 BGM", () => {
    expect(getSceneAudio("journey_review").bgm).toBeUndefined();
  });

  it("未知场景返回空配置", () => {
    const config = getSceneAudio("unknown_scene");
    expect(config.bgm).toBeUndefined();
    expect(config.ambience).toBeUndefined();
  });
});
