/**
 * audioTypes.ts — 音频系统类型定义
 *
 * P2A：BGM / ambience / SFX 三通道
 * voice 通道预留，本阶段不接入
 */

/** 音频通道类型 */
export type AudioChannel = "bgm" | "ambience" | "sfx" | "voice";

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
  // BGM
  playBgm(id: string): void;
  stopBgm(): void;
  crossfadeBgm(id: string): void;
  // Ambience
  playAmbience(ids: string[]): void;
  stopAmbience(): void;
  // SFX
  playSfx(id: string): void;
  // Voice（预留，缺失时 no-op）
  playVoice(id: string): void;
  stopVoice(): void;
  // 全局
  stopAll(): void;
  pauseAll(): void;
  resumeAll(): void;
  // 音量
  setMasterVolume(value: number): void;
  setBgmVolume(value: number): void;
  setAmbienceVolume(value: number): void;
  setSfxVolume(value: number): void;
  setVoiceVolume(value: number): void;
  setMuted(muted: boolean): void;
  getMasterVolume(): number;
  getBgmVolume(): number;
  getAmbienceVolume(): number;
  getSfxVolume(): number;
  getVoiceVolume(): number;
  isMuted(): boolean;
  // 状态
  unlock(): void;
  getCurrentBgmId(): string | null;
  getCurrentAmbienceIds(): string[];
  getBgmState(): BgmState;
  isPaused(): boolean;
}
