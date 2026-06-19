/**
 * audioManifest.ts — 音频清单
 *
 * P2A：唯一真实文件为 bgm_00_title.ogg。
 * 其余 BGM / ambience / SFX 仅登记逻辑 ID，src: null 表示待用户提供。
 */
import type { AudioAssetDefinition } from "./audioTypes";

export const AUDIO_MANIFEST: AudioAssetDefinition[] = [
  // ===== BGM =====
  {
    id: "bgm.title",
    channel: "bgm",
    src: "/assets/audio/bgm/bgm_00_title.ogg",
    loop: true,
    optional: false,
    defaultVolume: 0.8,
    fadeInMs: 800,
    fadeOutMs: 600,
    description: "标题页 BGM（已有）",
  },
  {
    id: "bgm.prologue",
    channel: "bgm",
    src: null,
    loop: true,
    optional: true,
    defaultVolume: 0.7,
    description: "待用户提供：序章车站 BGM",
  },
  {
    id: "bgm.spring_lab",
    channel: "bgm",
    src: null,
    loop: true,
    optional: true,
    defaultVolume: 0.7,
    description: "待用户提供：春日实验室 BGM",
  },
  {
    id: "bgm.factory",
    channel: "bgm",
    src: null,
    loop: true,
    optional: true,
    defaultVolume: 0.7,
    description: "待用户提供：工厂 BGM",
  },
  {
    id: "bgm.autumn_letter",
    channel: "bgm",
    src: null,
    loop: true,
    optional: true,
    defaultVolume: 0.7,
    description: "待用户提供：秋日家书 BGM",
  },
  {
    id: "bgm.winter_field",
    channel: "bgm",
    src: null,
    loop: true,
    optional: true,
    defaultVolume: 0.7,
    description: "待用户提供：冬野测试站 BGM",
  },
  {
    id: "bgm.lugouqiao_tension",
    channel: "bgm",
    src: null,
    loop: true,
    optional: true,
    defaultVolume: 0.7,
    description: "待用户提供：卢沟桥事变后紧张 BGM",
  },
  {
    id: "bgm.ending_return",
    channel: "bgm",
    src: null,
    loop: true,
    optional: true,
    defaultVolume: 0.7,
    description: "待用户提供：电波归途结局 BGM",
  },
  {
    id: "bgm.ending_lamp",
    channel: "bgm",
    src: null,
    loop: true,
    optional: true,
    defaultVolume: 0.7,
    description: "待用户提供：异乡长灯结局 BGM",
  },

  // ===== Ambience（环境音）=====
  {
    id: "amb.station_winter",
    channel: "ambience",
    src: null,
    loop: true,
    optional: true,
    defaultVolume: 0.4,
    description: "待用户提供：冬日车站环境音",
  },
  {
    id: "amb.lab_radio",
    channel: "ambience",
    src: null,
    loop: true,
    optional: true,
    defaultVolume: 0.35,
    description: "待用户提供：实验室无线电环境音",
  },
  {
    id: "amb.factory_machines",
    channel: "ambience",
    src: null,
    loop: true,
    optional: true,
    defaultVolume: 0.4,
    description: "待用户提供：工厂机器环境音",
  },
  {
    id: "amb.snowfield_wind",
    channel: "ambience",
    src: null,
    loop: true,
    optional: true,
    defaultVolume: 0.45,
    description: "待用户提供：雪地风声环境音",
  },
  {
    id: "amb.dorm_quiet",
    channel: "ambience",
    src: null,
    loop: true,
    optional: true,
    defaultVolume: 0.3,
    description: "待用户提供：宿舍安静环境音",
  },
  {
    id: "amb.archive_room",
    channel: "ambience",
    src: null,
    loop: true,
    optional: true,
    defaultVolume: 0.3,
    description: "待用户提供：档案室环境音",
  },

  // ===== SFX（音效）=====
  {
    id: "sfx.ui_click",
    channel: "sfx",
    src: null,
    loop: false,
    optional: true,
    defaultVolume: 0.8,
    description: "待用户提供：UI 点击音效",
  },
  {
    id: "sfx.choice_confirm",
    channel: "sfx",
    src: null,
    loop: false,
    optional: true,
    defaultVolume: 0.85,
    description: "待用户提供：关键选择确认音效",
  },
  {
    id: "sfx.choice_locked",
    channel: "sfx",
    src: null,
    loop: false,
    optional: true,
    defaultVolume: 0.6,
    description: "待用户提供：锁定选项音效",
  },
  {
    id: "sfx.letter_open",
    channel: "sfx",
    src: null,
    loop: false,
    optional: true,
    defaultVolume: 0.7,
    description: "待用户提供：拆信音效",
  },
  {
    id: "sfx.page_turn",
    channel: "sfx",
    src: null,
    loop: false,
    optional: true,
    defaultVolume: 0.6,
    description: "待用户提供：翻页音效",
  },
  {
    id: "sfx.radio_static_short",
    channel: "sfx",
    src: null,
    loop: false,
    optional: true,
    defaultVolume: 0.5,
    description: "待用户提供：短无线电静电音效",
  },
  {
    id: "sfx.train_whistle_distant",
    channel: "sfx",
    src: null,
    loop: false,
    optional: true,
    defaultVolume: 0.6,
    description: "待用户提供：远处火车汽笛",
  },
  {
    id: "sfx.stamp_paper",
    channel: "sfx",
    src: null,
    loop: false,
    optional: true,
    defaultVolume: 0.65,
    description: "待用户提供：盖章音效",
  },
];

/** 按 ID 查找清单条目 */
export function getAssetById(id: string): AudioAssetDefinition | undefined {
  return AUDIO_MANIFEST.find((a) => a.id === id);
}

/** 统计真实素材数量 */
export function getRealAssetCount(): number {
  return AUDIO_MANIFEST.filter((a) => a.src !== null).length;
}

/** 统计待提供素材数量 */
export function getPlannedAssetCount(): number {
  return AUDIO_MANIFEST.filter((a) => a.src === null).length;
}
