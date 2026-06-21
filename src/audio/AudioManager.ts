/**
 * AudioManager.ts — 统一音频管理器（单例）
 *
 * BGM 模式：
 * - singleFullTrack：单文件完整播放（开始页）
 * - introLoop：intro 播放一次后自动切换到 loop（剧情场景）
 *
 * 通道：BGM / ambience / SFX / voice（预留）
 * 缺失音频安全跳过，不报错。
 */
import type { IAudioManager, BgmState } from "./audioTypes";
import { getBgmById, getTrackById, preferredSrc } from "./audioCatalog";
import type { BgmDefinition } from "./audioCatalog";

const DEBUG = import.meta.env.DEV;

function debugLog(...args: unknown[]): void {
  if (DEBUG) console.info("[AudioManager]", ...args);
}

class AudioManagerImpl implements IAudioManager {
  // ---- BGM 通道 ----
  private bgmElement: HTMLAudioElement | null = null;
  /** introLoop 模式下的 loop 元素（在 intro 结束后创建） */
  private bgmLoopElement: HTMLAudioElement | null = null;
  private currentBgmId: string | null = null;
  private bgmState: BgmState = "stopped";
  private fadeTimer: number | null = null;

  // ---- 其他通道 ----
  private ambienceElements: Map<string, HTMLAudioElement> = new Map();
  private sfxPool: HTMLAudioElement[] = [];
  private voiceElement: HTMLAudioElement | null = null;

  // ---- 状态 ----
  private currentAmbienceIds: Set<string> = new Set();
  private unlocked = false;
  private muted = false;
  private paused = false;
  /** 标记 BGM 是否因自动播放限制而未启动（需在 unlock 后重试） */
  private bgmPendingUnlock = false;

  // ---- 音量 ----
  private masterVolume = 0.8;
  private bgmVolume = 0.45;
  private ambienceVolume = 0.35;
  private sfxVolume = 0.6;
  private voiceVolume = 0.8;

  // ---- visibility ----
  private visibilityRegistered = false;
  private wasPlayingBeforeHidden = false;

  constructor() {
    this.registerVisibilityHandler();
    this.registerFirstInteraction();
  }

  // ========================================================================
  // BGM 通道（支持 singleFullTrack + introLoop）
  // ========================================================================

  playBgm(id: string): void {
    if (this.currentBgmId === id && this.bgmState === "playing") {
      debugLog(`BGM "${id}" 已在播放，跳过`);
      return;
    }

    const def = getBgmById(id);
    if (!def || !def.enabled || def.missing || !def.path) {
      debugLog(`BGM "${id}" 素材未提供，跳过`);
      return;
    }

    // 已在播放另一首 → crossfade
    if (this.currentBgmId && this.currentBgmId !== id && this.bgmState === "playing") {
      this.crossfadeBgm(id);
      return;
    }

    this.startBgm(def);
  }

  stopBgm(): void {
    this.clearFadeTimer();
    this.cleanupBgmElements();
    this.currentBgmId = null;
    this.bgmState = "stopped";
  }

  crossfadeBgm(id: string): void {
    // 同一首 BGM 已在播放，不重播
    if (this.currentBgmId === id && this.bgmState === "playing") {
      debugLog(`crossfadeBgm "${id}" 已在播放，跳过`);
      return;
    }

    const def = getBgmById(id);
    if (!def?.enabled || def.missing || !def.path) {
      debugLog(`crossfadeBgm "${id}" 素材未提供，跳过`);
      return;
    }

    this.bgmPendingUnlock = false;
    const old = this.bgmElement;
    const oldLoop = this.bgmLoopElement;

    // 先立即停止旧 BGM，再开始新 BGM
    if (old) {
      old.pause();
      old.currentTime = 0;
      this.bgmElement = null;
    }
    if (oldLoop) {
      oldLoop.pause();
      oldLoop.currentTime = 0;
      this.bgmLoopElement = null;
    }
    this.clearFadeTimer();

    this.startBgm(def);
  }

  // ========================================================================
  // Ambience 通道
  // ========================================================================

  playAmbience(ids: string[]): void {
    const newSet = new Set(ids);
    for (const [playingId, el] of this.ambienceElements) {
      if (!newSet.has(playingId)) {
        el.pause();
        this.ambienceElements.delete(playingId);
      }
    }
    for (const id of ids) {
      if (this.ambienceElements.has(id)) continue;
      const track = getTrackById(id);
      if (!track || track.type === "bgm" || !track.enabled || track.missing || !track.path) continue;
      try {
        const ambSrc = preferredSrc(track.path, track.fallbackPath ?? undefined);
        const audio = new Audio(ambSrc);
        audio.loop = true;
        audio.volume = this.paused ? 0 : this.getEffectiveAmbienceVolume();
        audio.play().catch(() => {});
        this.ambienceElements.set(id, audio);
      } catch {
        debugLog(`环境音 "${id}" 加载失败`);
      }
    }
    this.currentAmbienceIds = newSet;
  }

  stopAmbience(): void {
    for (const el of this.ambienceElements.values()) el.pause();
    this.ambienceElements.clear();
    this.currentAmbienceIds.clear();
  }

  // ========================================================================
  // SFX 通道
  // ========================================================================

  playSfx(id: string): void {
    const track = getTrackById(id);
    if (!track || track.type === "bgm" || !track.enabled || track.missing || !track.path) return;
    if (this.paused || this.muted) return;
    try {
      // 限制 SFX 实例数，防止快速点击堆积
      if (this.sfxPool.length > 12) {
        const oldest = this.sfxPool.shift();
        if (oldest) { oldest.pause(); oldest.currentTime = 0; }
      }
      const sfxSrc = preferredSrc(track.path, track.fallbackPath ?? undefined);
      const audio = new Audio(sfxSrc);
      audio.volume = this.getEffectiveSfxVolume();
      audio.play().catch(() => {});
      audio.addEventListener("ended", () => {
        const idx = this.sfxPool.indexOf(audio);
        if (idx >= 0) this.sfxPool.splice(idx, 1);
      });
      this.sfxPool.push(audio);
    } catch { /* noop */ }
  }

  // ========================================================================
  // Voice 通道（预留，安全降级）
  // ========================================================================

  playVoice(id: string): void {
    const track = getTrackById(id);
    if (!track || track.type === "bgm" || !track.enabled || track.missing || !track.path) return;
    this.stopVoice();
    try {
      const voiceSrc = preferredSrc(track.path, track.fallbackPath ?? undefined);
      const audio = new Audio(voiceSrc);
      audio.loop = false;
      audio.volume = this.paused ? 0 : this.getEffectiveVoiceVolume();
      audio.play().catch(() => {});
      audio.addEventListener("ended", () => { this.voiceElement = null; });
      this.voiceElement = audio;
    } catch { /* noop */ }
  }

  stopVoice(): void {
    if (this.voiceElement) {
      this.voiceElement.pause();
      this.voiceElement.currentTime = 0;
      this.voiceElement = null;
    }
  }

  // ========================================================================
  // 全局控制
  // ========================================================================

  stopAll(): void {
    this.stopBgm();
    this.stopAmbience();
    this.stopVoice();
    for (const sfx of this.sfxPool) sfx.pause();
    this.sfxPool = [];
  }

  pauseAll(): void {
    if (this.paused) return;
    this.paused = true;
    if (this.bgmElement) this.bgmElement.pause();
    if (this.bgmLoopElement) this.bgmLoopElement.pause();
    for (const el of this.ambienceElements.values()) el.pause();
    if (this.voiceElement) this.voiceElement.pause();
    for (const sfx of this.sfxPool) sfx.pause();
  }

  resumeAll(): void {
    if (!this.paused) return;
    this.paused = false;
    if (this.bgmElement && this.bgmState === "playing") this.bgmElement.play().catch(() => {});
    if (this.bgmLoopElement && this.bgmState === "playing") this.bgmLoopElement.play().catch(() => {});
    for (const el of this.ambienceElements.values()) el.play().catch(() => {});
    if (this.voiceElement) this.voiceElement.play().catch(() => {});
  }

  // ========================================================================
  // 音量
  // ========================================================================

  setMasterVolume(v: number): void { this.masterVolume = Math.max(0, Math.min(1, v)); this.applyVolumes(); }
  setBgmVolume(v: number): void { this.bgmVolume = Math.max(0, Math.min(1, v)); this.applyVolumes(); }
  setAmbienceVolume(v: number): void { this.ambienceVolume = Math.max(0, Math.min(1, v)); this.applyVolumes(); }
  setSfxVolume(v: number): void { this.sfxVolume = Math.max(0, Math.min(1, v)); }
  setVoiceVolume(v: number): void { this.voiceVolume = Math.max(0, Math.min(1, v)); if (this.voiceElement) this.voiceElement.volume = this.getEffectiveVoiceVolume(); }
  setMuted(m: boolean): void { this.muted = m; this.applyVolumes(); }

  getMasterVolume(): number { return this.masterVolume; }
  getBgmVolume(): number { return this.bgmVolume; }
  getAmbienceVolume(): number { return this.ambienceVolume; }
  getSfxVolume(): number { return this.sfxVolume; }
  getVoiceVolume(): number { return this.voiceVolume; }
  isMuted(): boolean { return this.muted; }

  unlock(): void {
    if (this.unlocked) return;
    this.unlocked = true;

    // 1. 尝试通过 Web Audio API 解锁（移动端最可靠）
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      if (ctx.state === "suspended") {
        ctx.resume().catch(() => {});
      }
      // 播放极短静音脉冲，确保音频上下文被激活
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      gain.gain.value = 0.001;
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(0);
      osc.stop(ctx.currentTime + 0.01);
    } catch { /* AudioContext 不可用，回退到 HTMLAudioElement 方式 */ }

    // 2. 重试被自动播放限制阻止的 BGM
    if (this.bgmPendingUnlock && this.bgmElement && this.currentBgmId) {
      this.bgmElement.play().catch(() => {});
      this.bgmPendingUnlock = false;
      debugLog(`BGM "${this.currentBgmId}" unlock 后重试`);
    }

    // 3. 恢复其他已暂停的 BGM 和环境音
    if (this.bgmElement?.paused && this.currentBgmId && !this.bgmPendingUnlock) {
      this.bgmElement.play().catch(() => {});
    }
    for (const el of this.ambienceElements.values()) {
      if (el.paused) el.play().catch(() => {});
    }
  }

  getCurrentBgmId(): string | null { return this.currentBgmId; }
  getCurrentAmbienceIds(): string[] { return Array.from(this.currentAmbienceIds); }
  getBgmState(): BgmState { return this.bgmState; }
  isPaused(): boolean { return this.paused; }

  // ========================================================================
  // 内部：启动 BGM
  // ========================================================================

  private startBgm(def: BgmDefinition): void {
    if (!def.path) return;

    try {
      const src = preferredSrc(def.path, def.fallbackPath ?? undefined);
      const audio = new Audio(src);
      audio.volume = 0;

      if (def.mode === "singleFullTrack") {
        audio.loop = def.loop;
      } else {
        audio.loop = false;
        this.setupIntroToLoop(audio, def);
      }

      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            this.bgmPendingUnlock = false;
          })
          .catch(() => {
            // 自动播放被阻止（移动端）：标记等待 unlock 重试
            this.bgmPendingUnlock = true;
            debugLog(`BGM "${def.id}" 自动播放被阻止，等待用户交互后重试`);
          });
      }

      this.bgmElement = audio;
      this.currentBgmId = def.id;
      this.bgmState = "playing";

      if (!this.paused) {
        this.fadeInBgm(audio, def);
      }
    } catch {
      debugLog(`BGM "${def.id}" 加载失败`);
    }
  }

  /** intro 播放结束后自动切换到 loop */
  private setupIntroToLoop(intro: HTMLAudioElement, def: BgmDefinition): void {
    if (!def.loopPath) return;

    const onIntroEnd = () => {
      intro.removeEventListener("ended", onIntroEnd);

      // 检查是否已被新的 BGM 替换
      if (this.currentBgmId !== def.id || this.bgmElement !== intro) return;

      try {
        const loopSrc = preferredSrc(def.loopPath!, def.fallbackLoopPath ?? undefined);
        const loopAudio = new Audio(loopSrc);
        loopAudio.loop = def.loop;
        loopAudio.volume = 0;

        const targetVol = this.getEffectiveBgmVolume() * def.defaultVolume;
        loopAudio.play().catch(() => {});
        this.bgmLoopElement = loopAudio;

        // 淡入 loop（用默认 fadeIn 时长）
        const fadeMs = 1500;
        const steps = 20;
        const interval = fadeMs / steps;
        let step = 0;
        const doFade = () => {
          step++;
          loopAudio.volume = targetVol * (step / steps);
          if (step < steps) {
            this.fadeTimer = window.setTimeout(doFade, interval);
          }
        };
        this.fadeTimer = window.setTimeout(doFade, interval);

        debugLog(`BGM "${def.id}" intro 结束 → loop`);
      } catch {
        debugLog(`BGM "${def.id}" loop 加载失败`);
      }
    };

    intro.addEventListener("ended", onIntroEnd);
  }

  /** 淡入（使用曲目自身 defaultVolume 作为系数） */
  private fadeInBgm(audio: HTMLAudioElement, def: BgmDefinition): void {
    const targetVol = this.getEffectiveBgmVolume() * def.defaultVolume;
    const durationMs = def.fadeInMs;
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

  private cleanupBgmElements(): void {
    if (this.bgmElement) {
      this.bgmElement.pause();
      this.bgmElement.currentTime = 0;
      this.bgmElement = null;
    }
    if (this.bgmLoopElement) {
      this.bgmLoopElement.pause();
      this.bgmLoopElement.currentTime = 0;
      this.bgmLoopElement = null;
    }
  }

  private clearFadeTimer(): void {
    if (this.fadeTimer !== null) {
      clearTimeout(this.fadeTimer);
      this.fadeTimer = null;
    }
  }

  /** 获取当前 BGM 的 defaultVolume（音量系数），用于 fadeOut 计算 */
  private getCurrentBgmDefaultVolume(): number | null {
    if (!this.currentBgmId) return null;
    const def = getBgmById(this.currentBgmId);
    return def?.defaultVolume ?? null;
  }

  // ========================================================================
  // 音量计算
  // ========================================================================

  private getEffectiveBgmVolume(): number {
    return this.muted ? 0 : this.masterVolume * this.bgmVolume;
  }
  private getEffectiveAmbienceVolume(): number {
    return this.muted ? 0 : this.masterVolume * this.ambienceVolume;
  }
  private getEffectiveSfxVolume(): number {
    return this.muted ? 0 : this.masterVolume * this.sfxVolume;
  }
  private getEffectiveVoiceVolume(): number {
    return this.muted ? 0 : this.masterVolume * this.voiceVolume;
  }

  private applyVolumes(): void {
    const bgmV = this.getEffectiveBgmVolume();
    const currentDef = this.currentBgmId ? getBgmById(this.currentBgmId) : null;
    const coeff = currentDef?.defaultVolume ?? 1;

    if (this.bgmElement) this.bgmElement.volume = bgmV * coeff;
    if (this.bgmLoopElement) this.bgmLoopElement.volume = bgmV * coeff;

    const ambV = this.getEffectiveAmbienceVolume();
    for (const el of this.ambienceElements.values()) el.volume = ambV;

    if (this.voiceElement) this.voiceElement.volume = this.getEffectiveVoiceVolume();
  }

  // ========================================================================
  // visibility / first interaction
  // ========================================================================

  private registerVisibilityHandler(): void {
    if (this.visibilityRegistered) return;
    this.visibilityRegistered = true;
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        this.wasPlayingBeforeHidden = this.bgmState === "playing";
        if (this.bgmElement) this.bgmElement.pause();
        if (this.bgmLoopElement) this.bgmLoopElement.pause();
        for (const el of this.ambienceElements.values()) el.pause();
        if (this.voiceElement) this.voiceElement.pause();
      } else {
        if (this.wasPlayingBeforeHidden && !this.paused) {
          // 只恢复正在播放的 BGM 元素（intro 或 loop，不是两个都播）
          if (this.bgmLoopElement) {
            // loop 元素存在说明 intro 已结束，只恢复 loop
            this.bgmLoopElement.play().catch(() => {});
          } else if (this.bgmElement) {
            // 还在播 intro
            this.bgmElement.play().catch(() => {});
          }
        }
        if (!this.paused) {
          for (const el of this.ambienceElements.values()) el.play().catch(() => {});
        }
      }
    });
  }

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

export const audioManager = new AudioManagerImpl();
