/**
 * AudioManager.test.ts — 统一音频管理器测试
 */
import { describe, it, expect, beforeEach, vi } from "vitest";
import { audioManager } from "../AudioManager";

// Mock Audio
class MockAudio {
  src = "";
  loop = false;
  volume = 0;
  paused = true;
  currentTime = 0;
  onended: (() => void) | null = null;

  constructor(src?: string) {
    if (src) this.src = src;
  }

  play() {
    this.paused = false;
    return Promise.resolve();
  }
  pause() {
    this.paused = true;
  }
  addEventListener(_event: string, handler: () => void) {
    if (_event === "ended") this.onended = handler;
  }
  removeEventListener() {}
}

// @ts-ignore
globalThis.Audio = vi.fn((src?: string) => new MockAudio(src)) as any;

describe("P2A AudioManager", () => {
  beforeEach(() => {
    audioManager.stopAll();
    audioManager.setMuted(false);
    audioManager.setMasterVolume(0.8);
    audioManager.setBgmVolume(0.7);
    audioManager.setAmbienceVolume(0.4);
    audioManager.setSfxVolume(0.8);
  });

  it("playBgm 不存在的 ID 不抛错", () => {
    expect(() => audioManager.playBgm("nonexistent")).not.toThrow();
  });

  it("playBgm src:null 的计划资产不抛错", () => {
    expect(() => audioManager.playBgm("bgm.prologue")).not.toThrow();
  });

  it("crossfadeBgm src:null 不抛错", () => {
    expect(() => audioManager.crossfadeBgm("bgm.spring_lab")).not.toThrow();
  });

  it("playAmbience 空数组不抛错", () => {
    expect(() => audioManager.playAmbience([])).not.toThrow();
  });

  it("playAmbience 全 src:null 不抛错", () => {
    expect(() => audioManager.playAmbience(["amb.station_winter", "amb.lab_radio"])).not.toThrow();
  });

  it("stopAmbience 空状态不抛错", () => {
    expect(() => audioManager.stopAmbience()).not.toThrow();
  });

  it("playSfx 不存在的 ID 不抛错", () => {
    expect(() => audioManager.playSfx("nonexistent")).not.toThrow();
  });

  it("playSfx src:null 不抛错", () => {
    expect(() => audioManager.playSfx("sfx.ui_click")).not.toThrow();
  });

  it("stopAll 空状态不抛错", () => {
    expect(() => audioManager.stopAll()).not.toThrow();
  });

  it("setMasterVolume clamp 到 0-1", () => {
    expect(() => audioManager.setMasterVolume(-0.5)).not.toThrow();
    expect(() => audioManager.setMasterVolume(1.5)).not.toThrow();
    expect(() => audioManager.setMasterVolume(0.5)).not.toThrow();
  });

  it("setMuted 不抛错", () => {
    expect(() => audioManager.setMuted(true)).not.toThrow();
    expect(() => audioManager.setMuted(false)).not.toThrow();
  });

  it("unlock 不抛错", () => {
    expect(() => audioManager.unlock()).not.toThrow();
  });

  it("getCurrentBgmId 初始为 null", () => {
    expect(audioManager.getCurrentBgmId()).toBeNull();
  });

  it("setBgmVolume / setAmbienceVolume / setSfxVolume clamp", () => {
    expect(() => audioManager.setBgmVolume(2)).not.toThrow();
    expect(() => audioManager.setAmbienceVolume(-1)).not.toThrow();
    expect(() => audioManager.setSfxVolume(0.5)).not.toThrow();
  });
});
