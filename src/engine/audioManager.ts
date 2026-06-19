/**
 * audioManager.ts — 兼容层（已迁移到 src/audio/AudioManager.ts）
 *
 * 保留旧 API 以确保渐进迁移，内部转发到统一 AudioManager。
 * @deprecated 请使用 src/audio/AudioManager.ts 中的 audioManager
 */

import { audioManager } from "@/audio/AudioManager";

// ---- 兼容旧 API ----

let titleBgmInstance: HTMLAudioElement | null = null;

export function ensureTitleBgm(): HTMLAudioElement {
  if (!titleBgmInstance) {
    titleBgmInstance = new Audio("/assets/audio/bgm/bgm_00_title.ogg");
    titleBgmInstance.loop = true;
    titleBgmInstance.volume = 0.6;
  }
  audioManager.crossfadeBgm("bgm.title");
  return titleBgmInstance;
}

export function getTitleBgm(): HTMLAudioElement | null {
  return titleBgmInstance;
}

export function stopTitleBgm(): void {
  audioManager.stopBgm();
  if (titleBgmInstance) {
    titleBgmInstance.pause();
    titleBgmInstance.currentTime = 0;
  }
}

export function destroyTitleBgm(): void {
  audioManager.stopBgm();
  if (titleBgmInstance) {
    titleBgmInstance.pause();
    titleBgmInstance.src = "";
    titleBgmInstance = null;
  }
}
