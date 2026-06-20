/**
 * audioManifest.test.ts — 兼容测试（旧 manifest 仍可导入但已废弃）
 * STEP 04：保留旧 manifest 导入兼容，核心逻辑已迁移到 audioCatalog
 */
import { describe, it, expect } from "vitest";
import { AUDIO_MANIFEST, getAssetById } from "../audioManifest";

describe("P2A audioManifest (legacy, kept for compatibility)", () => {
  it("旧 manifest 仍可导入且包含 bgm.title", () => {
    const asset = getAssetById("bgm.title");
    expect(asset).toBeDefined();
    expect(asset!.channel).toBe("bgm");
  });

  it("旧 manifest 条目数正确", () => {
    expect(AUDIO_MANIFEST.length).toBeGreaterThanOrEqual(23);
  });

  it("getAssetById 对不存在的 ID 返回 undefined", () => {
    expect(getAssetById("nonexistent")).toBeUndefined();
  });

  it("清单无重复 ID", () => {
    const ids = AUDIO_MANIFEST.map((a) => a.id);
    expect(ids.length).toBe(new Set(ids).size);
  });
});
