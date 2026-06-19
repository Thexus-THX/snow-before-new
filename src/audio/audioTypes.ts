/**
 * audioTypes.ts — 音频系统类型定义
 *
 * P2A：BGM / ambience / SFX 三通道
 * voice 通道预留，本阶段不接入
 */

/** 音频通道类型 */
export type AudioChannel = "bgm" | "ambience" | "sfx";

/** 预留通道 */
export type FutureAudioChannel = "voice";

/** 清单中的单条音频定义 */
export interface AudioAssetDefinition {
  id: string;
  channel: AudioChannel;
  /** 真实文件路径，null 表示待用户提供 */
  src: string | null;
  loop?: boolean;
  optional?: boolean;
  defaultVolume?: number;
  fadeInMs?: number;
  fadeOutMs?: number;
  description?: string;
}

/** 场景音频配置 */
export interface SceneAudioConfig {
  bgm?: string | null;
  ambience?: string[];
  enterSfx?: string | null;
}

/** 音频播放状态 */
export type BgmState = "stopped" | "playing" | "fading";

/** AudioManager 公开接口 */
export interface IAudioManager {
  playBgm(id: string): void;
  stopBgm(): void;
  crossfadeBgm(id: string): void;
  playAmbience(ids: string[]): void;
  stopAmbience(): void;
  playSfx(id: string): void;
  stopAll(): void;
  setMasterVolume(value: number): void;
  setBgmVolume(value: number): void;
  setAmbienceVolume(value: number): void;
  setSfxVolume(value: number): void;
  setMuted(muted: boolean): void;
  /** 首次交互解锁（浏览器 autoplay 限制） */
  unlock(): void;
  /** 获取当前播放的 BGM ID */
  getCurrentBgmId(): string | null;
}
