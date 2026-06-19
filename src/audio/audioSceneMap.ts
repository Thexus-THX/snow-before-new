/**
 * audioSceneMap.ts — 场景到音频逻辑 ID 的映射
 *
 * P2A：仅 bgm.title 可播放，其余安全跳过。
 */
import type { SceneAudioConfig } from "./audioTypes";

/** 根据场景 ID 返回音频配置 */
export function getSceneAudio(sceneId: string): SceneAudioConfig {
  // 标题页
  if (sceneId === "__title__") {
    return { bgm: "bgm.title" };
  }

  // 创作说明 / 时间说明 / 序章
  if (
    sceneId.startsWith("note_") ||
    sceneId.startsWith("prologue_")
  ) {
    return { bgm: "bgm.prologue", ambience: ["amb.station_winter"] };
  }

  // 家书场景
  if (sceneId.startsWith("letter_")) {
    return { bgm: "bgm.autumn_letter", ambience: ["amb.dorm_quiet"] };
  }

  // 季节札记
  if (sceneId.startsWith("journal_")) {
    // 根据季节返回对应 BGM
    if (sceneId.includes("spring")) return { bgm: "bgm.spring_lab" };
    if (sceneId.includes("summer") && sceneId.includes("1937")) return { bgm: "bgm.lugouqiao_tension" };
    if (sceneId.includes("summer")) return { bgm: "bgm.factory" };
    if (sceneId.includes("autumn")) return { bgm: "bgm.autumn_letter" };
    if (sceneId.includes("winter")) return { bgm: "bgm.winter_field" };
    return {};
  }

  // 历史事件
  if (sceneId.startsWith("event_")) {
    return { bgm: "bgm.lugouqiao_tension" };
  }

  // 结局
  if (sceneId === "ending_electric_wave") {
    return { bgm: "bgm.ending_return" };
  }
  if (sceneId === "ending_foreign_lamp") {
    return { bgm: "bgm.ending_lamp" };
  }

  // 旅程回顾 / 致谢
  if (sceneId === "journey_review" || sceneId === "thank_you") {
    return {};
  }

  // 按 chapterId 前缀匹配
  // Day01 / Day05 (春)
  if (sceneId.startsWith("d1_") || sceneId.startsWith("d5_")) {
    return { bgm: "bgm.spring_lab", ambience: ["amb.lab_radio"] };
  }

  // Day02 (夏·工厂)
  if (sceneId.startsWith("d2_")) {
    return { bgm: "bgm.factory", ambience: ["amb.factory_machines"] };
  }

  // Day03 (秋)
  if (sceneId.startsWith("d3_")) {
    return { bgm: "bgm.autumn_letter", ambience: ["amb.dorm_quiet"] };
  }

  // Day04 / Day08 (冬)
  if (sceneId.startsWith("d4_") || sceneId.startsWith("d8_")) {
    return { bgm: "bgm.winter_field", ambience: ["amb.snowfield_wind"] };
  }

  // Day06 / Day07 (事变后)
  if (sceneId.startsWith("d6_") || sceneId.startsWith("d7_")) {
    return { bgm: "bgm.lugouqiao_tension" };
  }

  return {};
}
