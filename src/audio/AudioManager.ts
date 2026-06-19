/**
 * AudioManager.ts — 统一音频管理器（单例）
 *
 * P2A：BGM / ambience / SFX 三通道
 * - BGM：单首，淡入淡出
 * - Ambience：循环，场景切换
 * - SFX：可重叠短音效
 * - 缺失音频安全跳过
 * - 首次交互解锁播放
 */
import type { IAudioManager, BgmState } from "./audioTypes";
import { getAssetById } from "./audioManifest";
import type { AudioAssetDefinition } from "./audioTypes";

class AudioManagerImpl implements IAudioManager {
  // ---- 通道实例 ----
  private bgmElement: HTMLAudioElement | null = null;
  private ambienceElements: Map<string, HTMLAudioElement> = new Map();
  private sfxPool: HTMLAudioElement[] = [];

  // ---- 状态 ----
  private currentBgmId: string | null = null;
  private bgmState: BgmState = "stopped";
  private fadeTimer: number | null = null;
  private unlocked = false;
  private muted = false;

  // ---- 音量（0-1） ----
  private masterVolume = 0.8;
  private bgmVolume = 0.7;
  private ambienceVolume = 0.4;
  private sfxVolume = 0.8;

  // ---- 是否已注册 visibility handler ----
  private visibilityRegistered = false;
  private wasPlayingBeforeHidden = false;

  constructor() {
    this.registerVisibilityHandler();
    this.registerFirstInteraction();
  }

  // ============ 公开方法 ============

  playBgm(id: string): void {
    if (this.currentBgmId === id && this.bgmState === "playing") return;

    const asset = getAssetById(id);
    if (!asset || !asset.src) {
      if (import.meta.env.DEV && asset) {
        console.info(`[AudioManager] BGM "${id}" 素材未提供，跳过`);
      }
      return;
    }

    // 如果正在播放另一首，淡出
    if (this.currentBgmId && this.bgmState === "playing") {
      this.crossfadeBgm(id);
      return;
    }

    this.startBgm(asset);
  }

  stopBgm(): void {
    this.clearFadeTimer();
    if (this.bgmElement) {
      this.bgmElement.pause();
      this.bgmElement.currentTime = 0;
      this.bgmElement = null;
    }
    this.currentBgmId = null;
    this.bgmState = "stopped";
  }

  crossfadeBgm(id: string): void {
    const asset = getAssetById(id);
    if (!asset?.src) return;

    const old = this.bgmElement;
    const fadeOutMs = asset.fadeOutMs ?? 600;
    const fadeInMs = asset.fadeInMs ?? 800;

    // 淡出旧 BGM
    if (old) {
      this.bgmState = "fading";
      const steps = 20;
      const interval = fadeOutMs / steps;
      const startVol = this.getEffectiveBgmVolume();
      let step = 0;

      this.clearFadeTimer();
      const doFadeOut = () => {
        step++;
        const v = startVol * (1 - step / steps);
        if (old) old.volume = Math.max(0, v);
        if (step < steps) {
          this.fadeTimer = window.setTimeout(doFadeOut, interval);
        } else {
          old.pause();
          old.currentTime = 0;
          this.bgmElement = null;
          // 淡入新 BGM
          this.startBgm(asset);
        }
      };
      this.fadeTimer = window.setTimeout(doFadeOut, interval);
    } else {
      this.startBgm(asset);
    }
  }

  playAmbience(ids: string[]): void {
    // 停止不在新列表中的环境音
    const newSet = new Set(ids);
    for (const [playingId, el] of this.ambienceElements) {
      if (!newSet.has(playingId)) {
        el.pause();
        this.ambienceElements.delete(playingId);
      }
    }

    // 播放新环境音
    for (const id of ids) {
      if (this.ambienceElements.has(id)) continue;

      const asset = getAssetById(id);
      if (!asset?.src) continue; // 素材未提供，跳过

      try {
        const audio = new Audio(asset.src);
        audio.loop = true;
        audio.volume = this.getEffectiveAmbienceVolume();
        const playPromise = audio.play();
        if (playPromise) {
          playPromise.catch(() => {
            // autoplay 限制，等待解锁
          });
        }
        this.ambienceElements.set(id, audio);
      } catch {
        if (import.meta.env.DEV) {
          console.warn(`[AudioManager] 环境音 "${id}" 加载失败`);
        }
      }
    }
  }

  stopAmbience(): void {
    for (const el of this.ambienceElements.values()) {
      el.pause();
    }
    this.ambienceElements.clear();
  }

  playSfx(id: string): void {
    const asset = getAssetById(id);
    if (!asset?.src) return; // 素材未提供，静默跳过

    try {
      const audio = new Audio(asset.src);
      audio.volume = this.getEffectiveSfxVolume();
      const playPromise = audio.play();
      if (playPromise) {
        playPromise.catch(() => {
          // SFX 播放失败不影响 UI
        });
      }
      // 播放完毕后清理
      audio.addEventListener("ended", () => {
        const idx = this.sfxPool.indexOf(audio);
        if (idx >= 0) this.sfxPool.splice(idx, 1);
      });
      this.sfxPool.push(audio);
    } catch {
      // 静默失败
    }
  }

  stopAll(): void {
    this.stopBgm();
    this.stopAmbience();
    for (const sfx of this.sfxPool) {
      sfx.pause();
    }
    this.sfxPool = [];
  }

  setMasterVolume(value: number): void {
    this.masterVolume = Math.max(0, Math.min(1, value));
    this.applyVolumes();
  }

  setBgmVolume(value: number): void {
    this.bgmVolume = Math.max(0, Math.min(1, value));
    this.applyVolumes();
  }

  setAmbienceVolume(value: number): void {
    this.ambienceVolume = Math.max(0, Math.min(1, value));
    this.applyVolumes();
  }

  setSfxVolume(value: number): void {
    this.sfxVolume = Math.max(0, Math.min(1, value));
    // SFX 是瞬时的，不需要持续更新
  }

  setMuted(muted: boolean): void {
    this.muted = muted;
    this.applyVolumes();
  }

  unlock(): void {
    if (this.unlocked) return;
    this.unlocked = true;

    // 重试当前 BGM
    if (this.bgmElement && this.bgmElement.paused && this.currentBgmId) {
      this.bgmElement.play().catch(() => {});
    }

    // 重试环境音
    for (const el of this.ambienceElements.values()) {
      if (el.paused) {
        el.play().catch(() => {});
      }
    }
  }

  getCurrentBgmId(): string | null {
    return this.currentBgmId;
  }

  // ============ 内部方法 ============

  private startBgm(asset: AudioAssetDefinition): void {
    if (!asset.src) return;

    try {
      const audio = new Audio(asset.src);
      audio.loop = asset.loop ?? true;
      audio.volume = 0;

      const playPromise = audio.play();
      if (playPromise) {
        playPromise.catch(() => {
          // 浏览器阻止 autoplay，等待用户交互
        });
      }

      this.bgmElement = audio;
      this.currentBgmId = asset.id;
      this.bgmState = "playing";

      // 淡入
      this.fadeInBgm(audio, asset.fadeInMs ?? 800);
    } catch {
      if (import.meta.env.DEV) {
        console.warn(`[AudioManager] BGM "${asset.id}" 加载失败`);
      }
    }
  }

  private fadeInBgm(audio: HTMLAudioElement, durationMs: number): void {
    const targetVol = this.getEffectiveBgmVolume();
    const steps = 20;
    const interval = durationMs / steps;
    let step = 0;

    const doFade = () => {
      step++;
      audio.volume = targetVol * (step / steps);
      if (step < steps) {
        this.fadeTimer = window.setTimeout(doFade, interval);
      }
    };
    this.fadeTimer = window.setTimeout(doFade, interval);
  }

  private clearFadeTimer(): void {
    if (this.fadeTimer !== null) {
      clearTimeout(this.fadeTimer);
      this.fadeTimer = null;
    }
  }

  private getEffectiveBgmVolume(): number {
    return this.muted ? 0 : this.masterVolume * this.bgmVolume;
  }

  private getEffectiveAmbienceVolume(): number {
    return this.muted ? 0 : this.masterVolume * this.ambienceVolume;
  }

  private getEffectiveSfxVolume(): number {
    return this.muted ? 0 : this.masterVolume * this.sfxVolume;
  }

  private applyVolumes(): void {
    const bgmV = this.getEffectiveBgmVolume();
    if (this.bgmElement) {
      this.bgmElement.volume = bgmV;
    }

    const ambV = this.getEffectiveAmbienceVolume();
    for (const el of this.ambienceElements.values()) {
      el.volume = ambV;
    }
  }

  // ============ visibility 处理 ============

  private registerVisibilityHandler(): void {
    if (this.visibilityRegistered) return;
    this.visibilityRegistered = true;

    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        this.wasPlayingBeforeHidden = this.bgmState === "playing";
        if (this.bgmElement) this.bgmElement.pause();
        for (const el of this.ambienceElements.values()) el.pause();
      } else {
        if (this.wasPlayingBeforeHidden && this.bgmElement) {
          this.bgmElement.play().catch(() => {});
        }
        for (const el of this.ambienceElements.values()) {
          el.play().catch(() => {});
        }
      }
    });
  }

  // ============ 首次交互解锁 ============

  private registerFirstInteraction(): void {
    const handler = () => {
      this.unlock();
      document.removeEventListener("click", handler);
      document.removeEventListener("keydown", handler);
    };
    document.addEventListener("click", handler);
    document.addEventListener("keydown", handler);
  }
}

/** 全局单例 */
export const audioManager = new AudioManagerImpl();
