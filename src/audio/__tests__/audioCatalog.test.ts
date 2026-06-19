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

describe("BGM Catalog", () => {
  it("有 9 首 BGM", () => {
    expect(BGM_CATALOG.length).toBe(9);
  });

  it("bgm.title 是 singleFullTrack 模式", () => {
    const def = getBgmById("bgm.title");
    expect(def!.mode).toBe("singleFullTrack");
  });

  it("所有 introLoop BGM 都有 path 和 loopPath", () => {
    const introLoops = BGM_CATALOG.filter((b) => b.mode === "introLoop");
    expect(introLoops.length).toBe(8);
    for (const b of introLoops) {
      expect(b.path).toBeTruthy();
      expect(b.loopPath).toBeTruthy();
    }
  });
});

describe("Ambience Catalog", () => {
  it("ambience 6 首，2 首存在 4 首缺失", () => {
    const ambs = OTHER_CATALOG.filter((t) => t.type === "ambience");
    expect(ambs.length).toBe(6);
    const exist = ambs.filter((a) => !a.missing);
    const miss = ambs.filter((a) => a.missing);
    expect(exist.length).toBe(2);
    expect(miss.length).toBe(4);
  });

  it("amb.lab_radio 路径存在", () => {
    const t = getTrackById("amb.lab_radio");
    expect(t).toBeDefined();
    expect(t!.missing).toBe(false);
    expect(t!.path).toContain("amb_lab_radio_loop.ogg");
  });

  it("amb.snowfield_wind 路径存在", () => {
    const t = getTrackById("amb.snowfield_wind");
    expect(t!.missing).toBe(false);
    expect(t!.path).toContain("amb_snowfield_wind_loop.ogg");
  });

  it("缺失 ambience 不抛错", () => {
    const miss = OTHER_CATALOG.filter((t) => t.type === "ambience" && t.missing);
    expect(miss.length).toBe(4);
    for (const m of miss) {
      expect(m.enabled).toBe(false);
    }
  });
});

describe("SFX Catalog", () => {
  it("SFX 8 首，3 首存在 5 首缺失", () => {
    const sfxs = OTHER_CATALOG.filter((t) => t.type === "sfx");
    expect(sfxs.length).toBe(8);
    const exist = sfxs.filter((s) => !s.missing);
    const miss = sfxs.filter((s) => s.missing);
    expect(exist.length).toBe(3);
    expect(miss.length).toBe(5);
  });

  it("sfx.letter_open 路径存在", () => {
    const t = getTrackById("sfx.letter_open");
    expect(t!.missing).toBe(false);
    expect(t!.path).toContain("sfx_letter_open.ogg");
  });

  it("sfx.page_turn 路径存在", () => {
    const t = getTrackById("sfx.page_turn");
    expect(t!.missing).toBe(false);
    expect(t!.path).toContain("sfx_page_turn.ogg");
  });

  it("sfx.train_whistle_distant 路径存在", () => {
    const t = getTrackById("sfx.train_whistle_distant");
    expect(t!.missing).toBe(false);
    expect(t!.path).toContain("sfx_train_whistle_distant.ogg");
  });

  it("缺失 SFX 不抛错", () => {
    const miss = OTHER_CATALOG.filter((t) => t.type === "sfx" && t.missing);
    expect(miss.length).toBe(5);
  });
});

describe("Voice", () => {
  it("voice 预留且缺失", () => {
    const voices = OTHER_CATALOG.filter((t) => t.type === "voice");
    expect(voices.length).toBeGreaterThanOrEqual(1);
    for (const v of voices) expect(v.missing).toBe(true);
  });
});

describe("Query helpers", () => {
  it("getEnabledTracks 返回 9 BGM + 2 ambience + 3 SFX = 14", () => {
    const enabled = getEnabledTracks();
    expect(enabled.length).toBe(14);
  });

  it("getMissingTracks 返回 4 ambience + 5 sfx + 1 voice = 10", () => {
    const missing = getMissingTracks();
    expect(missing.length).toBe(10);
  });

  it("getTrackCountByType 统计正确", () => {
    const c = getTrackCountByType();
    expect(c.bgm).toEqual({ total: 9, enabled: 9, missing: 0 });
    expect(c.ambience).toEqual({ total: 6, enabled: 2, missing: 4 });
    expect(c.sfx).toEqual({ total: 8, enabled: 3, missing: 5 });
  });
});
