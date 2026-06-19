/**
 * AudioManager.test.ts — 音频管理器测试
 */
import { describe, it, expect, beforeEach, vi } from "vitest";
import { audioManager } from "../AudioManager";

class MockAudio {
  src = "";
  loop = false;
  volume = 0;
  paused = true;
  currentTime = 0;
  onended: (() => void) | null = null;
  private listeners: Record<string, Array<() => void>> = {};

  constructor(src?: string) {
    if (src) this.src = src;
  }
  play() { this.paused = false; return Promise.resolve(); }
  pause() { this.paused = true; }
  addEventListener(event: string, handler: () => void) {
    if (!this.listeners[event]) this.listeners[event] = [];
    this.listeners[event].push(handler);
    if (event === "ended") this.onended = handler;
  }
  removeEventListener(event: string, handler: () => void) {
    if (this.listeners[event]) {
      this.listeners[event] = this.listeners[event].filter((h) => h !== handler);
    }
  }
  /** 手动触发 ended */
  emitEnded() { if (this.onended) this.onended(); }
}

// @ts-ignore
globalThis.Audio = vi.fn((src?: string) => new MockAudio(src)) as any;

describe("AudioManager", () => {
  beforeEach(() => {
    audioManager.stopAll();
    audioManager.setMuted(false);
    audioManager.setMasterVolume(0.8);
    audioManager.setBgmVolume(0.45);
    audioManager.setAmbienceVolume(0.35);
    audioManager.setSfxVolume(0.6);
    audioManager.setVoiceVolume(0.8);
  });

  // ===== 缺失/不存在 =====
  it("playBgm 不存在 ID 不抛错", () => {
    expect(() => audioManager.playBgm("nonexistent")).not.toThrow();
  });

  it("crossfadeBgm 不存在 ID 不抛错", () => {
    expect(() => audioManager.crossfadeBgm("nonexistent")).not.toThrow();
  });

  it("playAmbience 全缺失不抛错", () => {
    expect(() => audioManager.playAmbience(["amb.station_winter", "amb.lab_radio"])).not.toThrow();
  });

  it("playSfx 缺失不抛错", () => {
    expect(() => audioManager.playSfx("sfx.ui_click")).not.toThrow();
  });

  it("playVoice 缺失不抛错", () => {
    expect(() => audioManager.playVoice("voice.prologue_narration")).not.toThrow();
  });

  // ===== 状态查询 =====
  it("getCurrentBgmId 初始为 null", () => {
    expect(audioManager.getCurrentBgmId()).toBeNull();
  });

  it("getCurrentAmbienceIds 初始为空", () => {
    expect(audioManager.getCurrentAmbienceIds()).toEqual([]);
  });

  it("isPaused 初始为 false", () => {
    expect(audioManager.isPaused()).toBe(false);
  });

  // ===== 音量 =====
  it("音量 clamp 不抛错", () => {
    expect(() => audioManager.setMasterVolume(-0.5)).not.toThrow();
    expect(() => audioManager.setMasterVolume(1.5)).not.toThrow();
    expect(() => audioManager.setBgmVolume(2)).not.toThrow();
    expect(() => audioManager.setAmbienceVolume(-1)).not.toThrow();
    expect(() => audioManager.setSfxVolume(3)).not.toThrow();
    expect(() => audioManager.setVoiceVolume(-2)).not.toThrow();
  });

  it("get 音量返回设置值", () => {
    audioManager.setMasterVolume(0.5);
    audioManager.setBgmVolume(0.3);
    expect(audioManager.getMasterVolume()).toBe(0.5);
    expect(audioManager.getBgmVolume()).toBe(0.3);
  });

  // ===== Mute =====
  it("setMuted 不抛错", () => {
    expect(() => audioManager.setMuted(true)).not.toThrow();
    expect(audioManager.isMuted()).toBe(true);
    audioManager.setMuted(false);
    expect(audioManager.isMuted()).toBe(false);
  });

  // ===== Pause/Resume =====
  it("pauseAll / resumeAll", () => {
    audioManager.pauseAll();
    expect(audioManager.isPaused()).toBe(true);
    audioManager.resumeAll();
    expect(audioManager.isPaused()).toBe(false);
  });

  it("重复 pauseAll 不出错", () => {
    audioManager.pauseAll();
    expect(() => audioManager.pauseAll()).not.toThrow();
  });

  // ===== 全局 =====
  it("stopAll / stopBgm / stopAmbience / stopVoice 空状态不抛错", () => {
    expect(() => audioManager.stopAll()).not.toThrow();
    expect(() => audioManager.stopBgm()).not.toThrow();
    expect(() => audioManager.stopAmbience()).not.toThrow();
    expect(() => audioManager.stopVoice()).not.toThrow();
  });

  it("unlock 不抛错", () => {
    expect(() => audioManager.unlock()).not.toThrow();
  });
});
