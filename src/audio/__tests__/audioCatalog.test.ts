/**
 * audioCatalog.test.ts — 音频资源清单测试
 */
import { describe, it, expect } from "vitest";
import {
  BGM_CATALOG,
  OTHER_CATALOG,
  getBgmById,
  getTrackById,
  getEnabledTracks,
  getMissingTracks,
  getTrackCountByType,
} from "../audioCatalog";

describe("BGM Catalog (bgmused)", () => {
  it("有 9 首 BGM", () => {
    expect(BGM_CATALOG.length).toBe(9);
  });

  it("bgm.title 是 singleFullTrack 模式", () => {
    const def = getBgmById("bgm.title");
    expect(def).toBeDefined();
    expect(def!.mode).toBe("singleFullTrack");
    expect(def!.loopPath).toBeUndefined();
    expect(def!.fadeInMs).toBe(2500);
    expect(def!.defaultVolume).toBe(0.48);
  });

  it("bgm.first_station 是 introLoop 模式", () => {
    const def = getBgmById("bgm.first_station");
    expect(def).toBeDefined();
    expect(def!.mode).toBe("introLoop");
    expect(def!.path).toContain("intro");
    expect(def!.loopPath).toContain("loop");
    expect(def!.defaultVolume).toBe(0.42);
  });

  it("所有 introLoop BGM 都有 path 和 loopPath", () => {
    const introLoops = BGM_CATALOG.filter((b) => b.mode === "introLoop");
    expect(introLoops.length).toBe(8);
    for (const b of introLoops) {
      expect(b.path, `${b.id} 缺 path`).toBeTruthy();
      expect(b.loopPath, `${b.id} 缺 loopPath`).toBeTruthy();
    }
  });

  it("所有 BGM 都 enabled 且不 missing", () => {
    for (const b of BGM_CATALOG) {
      expect(b.enabled).toBe(true);
      expect(b.missing).toBe(false);
    }
  });

  it("结局 BGM 不 loop", () => {
    expect(getBgmById("bgm.ending_return")!.loop).toBe(false);
    expect(getBgmById("bgm.ending_lamp")!.loop).toBe(false);
  });

  it("getBgmById 不存在返回 undefined", () => {
    expect(getBgmById("bgm.nonexistent")).toBeUndefined();
  });

  it("BGM ID 无重复", () => {
    const ids = BGM_CATALOG.map((b) => b.id);
    expect(ids.length).toBe(new Set(ids).size);
  });
});

describe("Other Catalog", () => {
  it("ambience 6 首全部缺失", () => {
    const ambs = OTHER_CATALOG.filter((t) => t.type === "ambience");
    expect(ambs.length).toBe(6);
    for (const a of ambs) expect(a.missing).toBe(true);
  });

  it("SFX 8 首全部缺失", () => {
    const sfxs = OTHER_CATALOG.filter((t) => t.type === "sfx");
    expect(sfxs.length).toBe(8);
    for (const s of sfxs) expect(s.missing).toBe(true);
  });

  it("voice 预留且缺失", () => {
    const voices = OTHER_CATALOG.filter((t) => t.type === "voice");
    expect(voices.length).toBeGreaterThanOrEqual(1);
    for (const v of voices) expect(v.missing).toBe(true);
  });
});

describe("Query helpers", () => {
  it("getEnabledTracks 返回 9 首 BGM", () => {
    const enabled = getEnabledTracks();
    expect(enabled.length).toBe(9);
  });

  it("getMissingTracks 返回 ambience + sfx + voice", () => {
    const missing = getMissingTracks();
    expect(missing.length).toBe(15);
  });

  it("getTrackCountByType 统计正确", () => {
    const c = getTrackCountByType();
    expect(c.bgm).toEqual({ total: 9, enabled: 9, missing: 0 });
    expect(c.ambience).toEqual({ total: 6, enabled: 0, missing: 6 });
    expect(c.sfx).toEqual({ total: 8, enabled: 0, missing: 8 });
    expect(c.voice.total).toBeGreaterThanOrEqual(1);
  });

  it("getTrackById 可查找任意轨道", () => {
    expect(getTrackById("bgm.title")).toBeDefined();
    expect(getTrackById("amb.station_winter")).toBeDefined();
    expect(getTrackById("sfx.ui_click")).toBeDefined();
    expect(getTrackById("voice.prologue_narration")).toBeDefined();
    expect(getTrackById("nonexistent")).toBeUndefined();
  });
});
