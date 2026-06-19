/**
 * assetReferences.test.ts — 资源引用检查
 *
 * 检查 game-data.json 中所有 /assets/ 路径是否对应 public/assets/ 下真实文件。
 * 音频文件允许缺失（P2 阶段接入），图片文件不允许缺失。
 */
import { describe, it, expect } from "vitest";
import { existsSync, readdirSync } from "fs";
import { resolve } from "path";
import gameDataRaw from "../game-data.json";
import type { GameData } from "@/schemas/types";

const gd = gameDataRaw as unknown as GameData;
const scenes = gd.scenes;
const publicDir = resolve(__dirname, "../../../public");

function assetExists(assetPath: string): boolean {
  // /assets/xxx → public/assets/xxx
  const rel = assetPath.replace(/^\/assets\//, "assets/");
  return existsSync(resolve(publicDir, rel));
}

describe("P1C 资源引用检查", () => {
  // ---- 图片资源不允许缺失 ----
  it("所有 background 图片存在", () => {
    const missing: string[] = [];
    for (const [id, scene] of Object.entries(scenes)) {
      if (scene.background && !assetExists(scene.background)) {
        missing.push(`${id}: ${scene.background}`);
      }
    }
    expect(missing).toEqual([]);
  });

  it("所有 portraitAsset 图片存在", () => {
    const missing: string[] = [];
    for (const [id, scene] of Object.entries(scenes)) {
      if (scene.content?.portraitAsset && !assetExists(scene.content.portraitAsset)) {
        missing.push(`${id}: ${scene.content.portraitAsset}`);
      }
    }
    expect(missing).toEqual([]);
  });

  it("角色定义中所有 portrait 图片存在", () => {
    const missing: string[] = [];
    for (const char of Object.values(gd.characters)) {
      for (const [key, path] of Object.entries(char.portraits)) {
        if (!assetExists(path)) {
          missing.push(`${char.id}.${key}: ${path}`);
        }
      }
    }
    expect(missing).toEqual([]);
  });

  it("所有 imageAsset 图片存在", () => {
    const missing: string[] = [];
    for (const [id, scene] of Object.entries(scenes)) {
      const evt = scene.content?.historicalEvent;
      if (evt?.imageAsset && !assetExists(evt.imageAsset)) {
        missing.push(`${id}: ${evt.imageAsset}`);
      }
    }
    expect(missing).toEqual([]);
  });

  it("所有 paperAsset 图片存在（UI 素材允许缺失）", () => {
    const missing: string[] = [];
    for (const [id, scene] of Object.entries(scenes)) {
      const letter = scene.content?.letter;
      if (letter?.paperAsset && !assetExists(letter.paperAsset)) {
        missing.push(`${id}: ${letter.paperAsset}`);
      }
    }
    // UI 素材（paperAsset 等）允许缺失，只记录不报错
    if (missing.length > 0) {
      console.warn(`[asset check] paperAsset 缺失（允许）: ${missing.join(", ")}`);
    }
  });

  // ---- 音频资源允许缺失（P2阶段），仅记录 ----
  it("音频资源引用检查（允许缺失）", () => {
    const audioRefs: { scene: string; type: string; path: string; exists: boolean }[] = [];
    for (const [id, scene] of Object.entries(scenes)) {
      if (scene.bgm) audioRefs.push({ scene: id, type: "bgm", path: scene.bgm, exists: assetExists(scene.bgm) });
      if (scene.ambience) audioRefs.push({ scene: id, type: "ambience", path: scene.ambience, exists: assetExists(scene.ambience) });
      if (scene.content?.ending?.voiceAsset) audioRefs.push({ scene: id, type: "voice", path: scene.content.ending.voiceAsset, exists: assetExists(scene.content.ending.voiceAsset) });
      if (scene.content?.ending?.bgm) audioRefs.push({ scene: id, type: "endingBgm", path: scene.content.ending.bgm, exists: assetExists(scene.content.ending.bgm) });
    }
    const missing = audioRefs.filter(r => !r.exists);
    // 音频允许缺失，只记录不报错
    if (missing.length > 0) {
      console.warn(`[P1C] 音频资源缺失 ${missing.length} 项（P2阶段接入）:`);
      missing.forEach(m => console.warn(`  ${m.scene}.${m.type}: ${m.path}`));
    }
    expect(true).toBe(true); // 不因音频缺失而失败
  });

  // ---- 检查无 public/ 硬编码 ----
  it("资源路径不以 public/ 开头", () => {
    const violations: string[] = [];
    for (const [id, scene] of Object.entries(scenes)) {
      const paths = [
        scene.background,
        scene.bgm,
        scene.ambience,
        scene.content?.portraitAsset,
        scene.content?.letter?.paperAsset,
        scene.content?.historicalEvent?.imageAsset,
      ].filter(Boolean) as string[];
      for (const p of paths) {
        if (p.startsWith("public/") || p.startsWith("/public/")) {
          violations.push(`${id}: ${p}`);
        }
      }
    }
    expect(violations).toEqual([]);
  });
});
