/**
 * audioCatalog.ts — 音频资源清单
 *
 * 只登记项目中真实存在的音频文件。
 * BGM 文件来源：public/assets/audio/bgmused/
 *
 * BGM 模式：
 * - singleFullTrack：单文件完整播放（开始页 bgm_01）
 * - introLoop：intro 播一次后自动切换到 loop（剧情场景 bgm_02~09）
 *
 * 不要重命名任何音频文件。不要新增临时音频文件。
 */
import type { AudioChannel } from "./audioTypes";

// ============================================================
// 类型
// ============================================================

export type AudioTrackType = "bgm" | "ambience" | "sfx" | "voice";

/** BGM 播放模式 */
export type BgmMode = "singleFullTrack" | "introLoop";

/** BGM 定义（扩展 AudioTrack，支持 intro + loop） */
export interface BgmDefinition {
  id: string;
  type: "bgm";
  mode: BgmMode;
  /** singleFullTrack：完整曲路径；introLoop：intro 路径 */
  path: string | null;
  /** introLoop：loop 路径 */
  loopPath?: string | null;
  loop: boolean;
  /** 默认音量（独立于 master/bgmVolume，曲目自身音量系数） */
  defaultVolume: number;
  fadeInMs: number;
  fadeOutMs: number;
  enabled: boolean;
  missing: boolean;
  description?: string;
}

/** 非 BGM 轨道（ambience / sfx / voice） */
export interface AudioTrack {
  id: string;
  type: "ambience" | "sfx" | "voice";
  path: string | null;
  loop: boolean;
  defaultVolume: number;
  enabled: boolean;
  missing: boolean;
  description?: string;
}

/** 任意轨道 */
export type AnyTrack = BgmDefinition | AudioTrack;

// ============================================================
// BGM 配置（用户处理好的文件在 bgmused/）
// ============================================================

const BGM_BASE = "/assets/audio/bgmused";

export const BGM_CATALOG: BgmDefinition[] = [
  // ---- A. 开始页：singleFullTrack ----
  {
    id: "bgm.title",
    type: "bgm",
    mode: "singleFullTrack",
    path: `${BGM_BASE}/bgm_01_prologue_station.ogg`,
    loop: true,
    defaultVolume: 0.48,
    fadeInMs: 2500,  // 开始页专用 2.5s
    fadeOutMs: 1500,
    enabled: true,
    missing: false,
    description: "标题页 / 创作说明 / 时间说明",
  },

  // ---- B. 剧情场景：introLoop ----
  {
    id: "bgm.first_station",
    type: "bgm",
    mode: "introLoop",
    path: `${BGM_BASE}/bgm_09_first_station_intro.ogg`,
    loopPath: `${BGM_BASE}/bgm_09_first_station_loop.ogg`,
    loop: true,
    defaultVolume: 0.42,
    fadeInMs: 2000,
    fadeOutMs: 1500,
    enabled: true,
    missing: false,
    description: "序章车站",
  },
  {
    id: "bgm.lab_spring",
    type: "bgm",
    mode: "introLoop",
    path: `${BGM_BASE}/bgm_02_lab_spring_intro.ogg`,
    loopPath: `${BGM_BASE}/bgm_02_lab_spring_loop.ogg`,
    loop: true,
    defaultVolume: 0.36,
    fadeInMs: 2000,
    fadeOutMs: 1500,
    enabled: true,
    missing: false,
    description: "第一日实验室 / 第五日成果展示",
  },
  {
    id: "bgm.factory",
    type: "bgm",
    mode: "introLoop",
    path: `${BGM_BASE}/bgm_03_factory_summer_intro.ogg`,
    loopPath: `${BGM_BASE}/bgm_03_factory_summer_loop.ogg`,
    loop: true,
    defaultVolume: 0.38,
    fadeInMs: 2000,
    fadeOutMs: 1500,
    enabled: true,
    missing: false,
    description: "第二日工厂",
  },
  {
    id: "bgm.autumn_letter",
    type: "bgm",
    mode: "introLoop",
    path: `${BGM_BASE}/bgm_04_autumn_letter_intro.ogg`,
    loopPath: `${BGM_BASE}/bgm_04_autumn_letter_loop.ogg`,
    loop: true,
    defaultVolume: 0.40,
    fadeInMs: 2000,
    fadeOutMs: 1500,
    enabled: true,
    missing: false,
    description: "第三日秋 / 家书 / 思乡",
  },
  {
    id: "bgm.winter_field",
    type: "bgm",
    mode: "introLoop",
    path: `${BGM_BASE}/bgm_05_winter_field_intro.ogg`,
    loopPath: `${BGM_BASE}/bgm_05_winter_field_loop.ogg`,
    loop: true,
    defaultVolume: 0.45,
    fadeInMs: 2000,
    fadeOutMs: 1500,
    enabled: true,
    missing: false,
    description: "第四日雪地 / 第八日风雪",
  },
  {
    id: "bgm.lugouqiao_tension",
    type: "bgm",
    mode: "introLoop",
    path: `${BGM_BASE}/bgm_06_lugouqiao_tension_intro.ogg`,
    loopPath: `${BGM_BASE}/bgm_06_lugouqiao_tension_loop.ogg`,
    loop: true,
    defaultVolume: 0.44,
    fadeInMs: 2000,
    fadeOutMs: 1500,
    enabled: true,
    missing: false,
    description: "第六日卢沟桥 / 第七日筹备",
  },
  {
    id: "bgm.ending_return",
    type: "bgm",
    mode: "introLoop",
    path: `${BGM_BASE}/bgm_07_ending_return_intro.ogg`,
    loopPath: `${BGM_BASE}/bgm_07_ending_return_loop.ogg`,
    loop: false, // 不强制无限循环
    defaultVolume: 0.46,
    fadeInMs: 2000,
    fadeOutMs: 1500,
    enabled: true,
    missing: false,
    description: "结局《电波归途》",
  },
  {
    id: "bgm.ending_lamp",
    type: "bgm",
    mode: "introLoop",
    path: `${BGM_BASE}/bgm_08_ending_foreign_lamp_intro.ogg`,
    loopPath: `${BGM_BASE}/bgm_08_ending_foreign_lamp_loop.ogg`,
    loop: false, // 不强制无限循环
    defaultVolume: 0.46,
    fadeInMs: 2000,
    fadeOutMs: 1500,
    enabled: true,
    missing: false,
    description: "结局《异乡长灯》",
  },
];

// ============================================================
// Ambience / SFX / Voice（均未提供）
// ============================================================

export const OTHER_CATALOG: AudioTrack[] = [
  // Ambience
  { id: "amb.station_winter", type: "ambience", path: null, loop: true, defaultVolume: 0.35, enabled: false, missing: true, description: "冬日车站环境音（待提供）" },
  { id: "amb.lab_radio", type: "ambience", path: null, loop: true, defaultVolume: 0.35, enabled: false, missing: true, description: "实验室无线电环境音（待提供）" },
  { id: "amb.factory_machines", type: "ambience", path: null, loop: true, defaultVolume: 0.35, enabled: false, missing: true, description: "工厂机器环境音（待提供）" },
  { id: "amb.snowfield_wind", type: "ambience", path: null, loop: true, defaultVolume: 0.35, enabled: false, missing: true, description: "雪地风声环境音（待提供）" },
  { id: "amb.dorm_quiet", type: "ambience", path: null, loop: true, defaultVolume: 0.30, enabled: false, missing: true, description: "宿舍安静环境音（待提供）" },
  { id: "amb.archive_room", type: "ambience", path: null, loop: true, defaultVolume: 0.30, enabled: false, missing: true, description: "档案室环境音（待提供）" },
  // SFX
  { id: "sfx.ui_click", type: "sfx", path: null, loop: false, defaultVolume: 0.60, enabled: false, missing: true, description: "UI 点击音效（待提供）" },
  { id: "sfx.choice_confirm", type: "sfx", path: null, loop: false, defaultVolume: 0.60, enabled: false, missing: true, description: "关键选择确认音效（待提供）" },
  { id: "sfx.choice_locked", type: "sfx", path: null, loop: false, defaultVolume: 0.60, enabled: false, missing: true, description: "锁定选项音效（待提供）" },
  { id: "sfx.letter_open", type: "sfx", path: null, loop: false, defaultVolume: 0.60, enabled: false, missing: true, description: "拆信音效（待提供）" },
  { id: "sfx.page_turn", type: "sfx", path: null, loop: false, defaultVolume: 0.60, enabled: false, missing: true, description: "翻页音效（待提供）" },
  { id: "sfx.radio_static_short", type: "sfx", path: null, loop: false, defaultVolume: 0.50, enabled: false, missing: true, description: "短无线电静电音效（待提供）" },
  { id: "sfx.train_whistle_distant", type: "sfx", path: null, loop: false, defaultVolume: 0.60, enabled: false, missing: true, description: "远处火车汽笛（待提供）" },
  { id: "sfx.stamp_paper", type: "sfx", path: null, loop: false, defaultVolume: 0.60, enabled: false, missing: true, description: "盖章音效（待提供）" },
  // Voice
  { id: "voice.prologue_narration", type: "voice", path: null, loop: false, defaultVolume: 0.80, enabled: false, missing: true, description: "序章旁白配音（预留）" },
];

// ============================================================
// 联合清单 + 查询
// ============================================================

export const AUDIO_CATALOG: AnyTrack[] = [...BGM_CATALOG, ...OTHER_CATALOG];

/** 按 ID 查找 BGM 定义 */
export function getBgmById(id: string): BgmDefinition | undefined {
  return BGM_CATALOG.find((t) => t.id === id);
}

/** 按 ID 查找任意轨道 */
export function getTrackById(id: string): AnyTrack | undefined {
  return AUDIO_CATALOG.find((t) => t.id === id);
}

/** 获取所有已启用的轨道 */
export function getEnabledTracks(): AnyTrack[] {
  return AUDIO_CATALOG.filter((t) => t.enabled && !t.missing);
}

/** 获取所有缺失的轨道 */
export function getMissingTracks(): AnyTrack[] {
  return AUDIO_CATALOG.filter((t) => t.missing);
}

/** 按类型统计 */
export function getTrackCountByType(): Record<AudioTrackType, { total: number; enabled: number; missing: number }> {
  const types: AudioTrackType[] = ["bgm", "ambience", "sfx", "voice"];
  const result = {} as Record<AudioTrackType, { total: number; enabled: number; missing: number }>;
  for (const t of types) {
    const tracks = AUDIO_CATALOG.filter((tr) => tr.type === t);
    result[t] = {
      total: tracks.length,
      enabled: tracks.filter((tr) => tr.enabled && !tr.missing).length,
      missing: tracks.filter((tr) => tr.missing).length,
    };
  }
  return result;
}
