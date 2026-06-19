/**
 * audioManifest.test.ts — 音频清单测试
 */
import { describe, it, expect } from "vitest";
import { AUDIO_MANIFEST, getAssetById, getRealAssetCount, getPlannedAssetCount } from "../audioManifest";

describe("P2A audioManifest", () => {
  it("只有 bgm.title 拥有真实 src", () => {
    const realAssets = AUDIO_MANIFEST.filter(a => a.src !== null);
    expect(realAssets).toHaveLength(1);
    expect(realAssets[0].id).toBe("bgm.title");
    expect(realAssets[0].src).toBe("/assets/audio/bgm/bgm_00_title.ogg");
  });

  it("所有 src:null 的资产都是 optional:true", () => {
    const planned = AUDIO_MANIFEST.filter(a => a.src === null);
    expect(planned.length).toBeGreaterThan(0);
    for (const asset of planned) {
      expect(asset.optional, `${asset.id} 应为 optional`).toBe(true);
    }
  });

  it("getAssetById 可查找存在的资产", () => {
    const asset = getAssetById("bgm.title");
    expect(asset).toBeDefined();
    expect(asset!.channel).toBe("bgm");
  });

  it("getAssetById 对不存在的 ID 返回 undefined", () => {
    expect(getAssetById("nonexistent")).toBeUndefined();
  });

  it("getRealAssetCount 返回 1", () => {
    expect(getRealAssetCount()).toBe(1);
  });

  it("getPlannedAssetCount 返回待提供数量", () => {
    expect(getPlannedAssetCount()).toBeGreaterThan(0);
  });

  it("所有 BGM 资产 channel 为 bgm", () => {
    const bgms = AUDIO_MANIFEST.filter(a => a.channel === "bgm");
    expect(bgms.length).toBe(9);
    for (const bgm of bgms) {
      expect(bgm.id).toMatch(/^bgm\./);
    }
  });

  it("所有 ambience 资产 channel 为 ambience", () => {
    const ambs = AUDIO_MANIFEST.filter(a => a.channel === "ambience");
    expect(ambs.length).toBe(6);
    for (const amb of ambs) {
      expect(amb.id).toMatch(/^amb\./);
    }
  });

  it("所有 SFX 资产 channel 为 sfx", () => {
    const sfxs = AUDIO_MANIFEST.filter(a => a.channel === "sfx");
    expect(sfxs.length).toBe(8);
    for (const sfx of sfxs) {
      expect(sfx.id).toMatch(/^sfx\./);
    }
  });

  it("清单无重复 ID", () => {
    const ids = AUDIO_MANIFEST.map(a => a.id);
    expect(ids.length).toBe(new Set(ids).size);
  });
});
