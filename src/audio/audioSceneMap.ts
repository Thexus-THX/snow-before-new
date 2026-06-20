/**
 * audioSceneMap.ts — 场景到音频逻辑 ID 的映射
 *
 * 序章使用 bgm.first_station（bgm_09），不使用 bgm.title 的同文件。
 * BGM ID 与 audioCatalog 中 BGM_CATALOG 的 id 一一对应。
 */
import type { SceneAudioConfig } from "./audioTypes";

export function getSceneAudio(sceneId: string): SceneAudioConfig {
  // 标题页 / 创作说明 / 时间说明 → bgm.title（singleFullTrack）
  if (
    sceneId === "__title__" ||
    sceneId.startsWith("note_")
  ) {
    return { bgm: "bgm.title" };
  }

  // 序章 → bgm.first_station（introLoop, bgm_09）
  if (sceneId.startsWith("prologue_")) {
    // 序章第一个车站场景：播放远处火车汽笛
    if (sceneId === "prologue_train") {
      return { bgm: "bgm.first_station", ambience: ["amb.station_winter"], enterSfx: "sfx.train_whistle_distant" };
    }
    return { bgm: "bgm.first_station", ambience: ["amb.station_winter"] };
  }

  // 家书 → bgm.autumn_letter
  if (sceneId.startsWith("letter_")) {
    return { bgm: "bgm.autumn_letter", ambience: ["amb.dorm_quiet"] };
  }

  // 季节札记
  if (sceneId.startsWith("journal_")) {
    if (sceneId.includes("spring")) return { bgm: "bgm.lab_spring" };
    if (sceneId.includes("summer") && sceneId.includes("1937")) return { bgm: "bgm.lugouqiao_tension" };
    if (sceneId.includes("summer")) return { bgm: "bgm.factory" };
    if (sceneId.includes("autumn")) return { bgm: "bgm.autumn_letter" };
    if (sceneId.includes("winter")) return { bgm: "bgm.winter_field" };
    return {};
  }

  // 历史事件 → bgm.lugouqiao_tension
  if (sceneId.startsWith("event_")) {
    return { bgm: "bgm.lugouqiao_tension" };
  }

  // 结局
  if (sceneId === "ending_electric_wave") return { bgm: "bgm.ending_return" };
  if (sceneId === "ending_foreign_lamp") return { bgm: "bgm.ending_lamp" };

  // 旅程回顾 / 致谢 → 无 BGM
  if (sceneId === "journey_review" || sceneId === "thank_you") return {};

  // Day01 / Day05（春）→ bgm.lab_spring
  if (sceneId.startsWith("d1_") || sceneId.startsWith("d5_")) {
    return { bgm: "bgm.lab_spring", ambience: ["amb.lab_radio"] };
  }
  // Day02（夏·工厂）→ bgm.factory
  if (sceneId.startsWith("d2_")) {
    return { bgm: "bgm.factory", ambience: ["amb.factory_machines"] };
  }
  // Day03（秋）→ bgm.autumn_letter
  if (sceneId.startsWith("d3_")) {
    return { bgm: "bgm.autumn_letter", ambience: ["amb.dorm_quiet"] };
  }
  // Day04 / Day08（冬）→ bgm.winter_field
  if (sceneId.startsWith("d4_") || sceneId.startsWith("d8_")) {
    return { bgm: "bgm.winter_field", ambience: ["amb.snowfield_wind"] };
  }
  // Day06 / Day07（事变后）→ bgm.lugouqiao_tension
  if (sceneId.startsWith("d6_") || sceneId.startsWith("d7_")) {
    return { bgm: "bgm.lugouqiao_tension" };
  }

  return {};
}
