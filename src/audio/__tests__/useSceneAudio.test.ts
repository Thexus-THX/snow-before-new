/**
 * useSceneAudio.test.ts — 场景音频映射测试
 */
import { describe, it, expect } from "vitest";
import { getSceneAudio } from "../audioSceneMap";

describe("P2A audioSceneMap", () => {
  it("标题页返回 bgm.title", () => {
    const config = getSceneAudio("__title__");
    expect(config.bgm).toBe("bgm.title");
  });

  it("序章场景返回 bgm.prologue + amb.station_winter", () => {
    const config = getSceneAudio("prologue_train");
    expect(config.bgm).toBe("bgm.prologue");
    expect(config.ambience).toContain("amb.station_winter");
  });

  it("Day01 返回 bgm.spring_lab", () => {
    expect(getSceneAudio("d1_lab_intro").bgm).toBe("bgm.spring_lab");
  });

  it("Day02 返回 bgm.factory + amb.factory_machines", () => {
    const config = getSceneAudio("d2_factory_intro");
    expect(config.bgm).toBe("bgm.factory");
    expect(config.ambience).toContain("amb.factory_machines");
  });

  it("Day03 返回 bgm.autumn_letter + amb.dorm_quiet", () => {
    const config = getSceneAudio("d3_location_choice");
    expect(config.bgm).toBe("bgm.autumn_letter");
    expect(config.ambience).toContain("amb.dorm_quiet");
  });

  it("Day04 返回 bgm.winter_field + amb.snowfield_wind", () => {
    const config = getSceneAudio("d4_field_intro");
    expect(config.bgm).toBe("bgm.winter_field");
    expect(config.ambience).toContain("amb.snowfield_wind");
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

  it("札记场景按季节返回对应 BGM", () => {
    expect(getSceneAudio("journal_day01_spring_1936").bgm).toBe("bgm.spring_lab");
    expect(getSceneAudio("journal_day04_winter_1936").bgm).toBe("bgm.winter_field");
  });

  it("journey_review 不返回 BGM", () => {
    const config = getSceneAudio("journey_review");
    expect(config.bgm).toBeUndefined();
  });
});
