/**
 * saveManager.ts — 版本化存档管理器（P0.1 实现）
 *
 * 功能：
 * - SaveEnvelope 封装（schemaVersion + gameDataVersion + 时间戳 + snapshots）
 * - Zod 校验
 * - 旧裸 GameState 存档迁移
 * - 结构化 LoadSaveResult / SaveWriteResult
 * - localStorage 异常安全降级
 *
 * localStorage 键名：snow-before-v1-save（与旧版兼容）
 */

import { z } from "zod";
import type { GameState, StateSnapshot } from "@/schemas/types";
import { gameStateSchema } from "@/schemas/gameSchema";
import type { GameData } from "@/schemas/types";

// ============================================================
// 类型定义
// ============================================================

export interface SaveEnvelope {
  schemaVersion: 1;
  gameId: "snow-before-v1";
  gameDataVersion: string;
  savedAt: number;
  state: GameState;
  snapshots: Record<string, StateSnapshot>;
}

export type LoadSaveResult =
  | { status: "ok"; save: SaveEnvelope }
  | { status: "not-found" }
  | { status: "migrated"; save: SaveEnvelope }
  | { status: "corrupt"; reason: string }
  | { status: "incompatible"; reason: string }
  | { status: "storage-unavailable"; reason: string };

export type SaveWriteResult =
  | { status: "ok" }
  | { status: "storage-unavailable"; reason: string };

// ============================================================
// 常量
// ============================================================

export const STORAGE_KEY = "snow-before-v1-save";
const SCHEMA_VERSION = 1 as const;

// ============================================================
// Zod Schema
// ============================================================

const stateSnapshotSchema = z.object({
  id: z.string(),
  sceneId: z.string(),
  state: gameStateSchema,
  createdAt: z.number(),
});

const saveEnvelopeSchema = z.object({
  schemaVersion: z.literal(1),
  gameId: z.literal("snow-before-v1"),
  gameDataVersion: z.string(),
  savedAt: z.number(),
  state: gameStateSchema,
  snapshots: z.record(stateSnapshotSchema),
});

const legacyGameStateSchema = gameStateSchema;

// ============================================================
// 工具函数
// ============================================================

function isStorageAvailable(): boolean {
  try {
    const testKey = "__snow_storage_test__";
    localStorage.setItem(testKey, "1");
    localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}

function safeGetItem(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSetItem(key: string, value: string): SaveWriteResult {
  try {
    localStorage.setItem(key, value);
    return { status: "ok" };
  } catch {
    return { status: "storage-unavailable", reason: "localStorage 写入失败" };
  }
}

function safeRemoveItem(key: string): SaveWriteResult {
  try {
    localStorage.removeItem(key);
    return { status: "ok" };
  } catch {
    return { status: "storage-unavailable", reason: "localStorage 删除失败" };
  }
}

// ============================================================
// 校验
// ============================================================

function validateSaveEnvelope(data: unknown): { success: true; data: SaveEnvelope } | { success: false; error: string } {
  const result = saveEnvelopeSchema.safeParse(data);
  if (result.success) return { success: true, data: result.data as SaveEnvelope };
  const errors = result.error.issues.map((i) => `[${i.path.join(".")}] ${i.message}`);
  return { success: false, error: errors.join("\n") };
}

function validateLegacyGameState(data: unknown): { success: true; data: GameState } | { success: false; error: string } {
  const result = legacyGameStateSchema.safeParse(data);
  if (result.success) return { success: true, data: result.data as GameState };
  const errors = result.error.issues.map((i) => `[${i.path.join(".")}] ${i.message}`);
  return { success: false, error: errors.join("\n") };
}

function validateSaveReferences(save: SaveEnvelope, gameData: GameData): string | null {
  if (!gameData.scenes[save.state.currentSceneId])
    return `存档场景 ID "${save.state.currentSceneId}" 不存在`;
  const chapterExists = gameData.chapters.some((ch) => ch.id === save.state.chapterId);
  if (!chapterExists)
    return `存档章节 ID "${save.state.chapterId}" 不存在`;
  for (const entry of save.state.history) {
    if (entry.rollbackSnapshotId && !save.snapshots[entry.rollbackSnapshotId])
      return `历史条目 "${entry.id}" 的快照 "${entry.rollbackSnapshotId}" 不存在`;
  }
  return null;
}

// ============================================================
// 公开 API
// ============================================================

export function hasValidSave(gameData: GameData): boolean {
  if (!isStorageAvailable()) return false;
  const raw = safeGetItem(STORAGE_KEY);
  if (!raw) return false;
  let parsed: unknown;
  try { parsed = JSON.parse(raw); } catch { return false; }
  const envelopeResult = validateSaveEnvelope(parsed);
  if (envelopeResult.success) return validateSaveReferences(envelopeResult.data, gameData) === null;
  const legacyResult = validateLegacyGameState(parsed);
  if (legacyResult.success) return gameData.scenes[legacyResult.data.currentSceneId] !== undefined;
  return false;
}

export function loadSave(gameData: GameData): LoadSaveResult {
  if (!isStorageAvailable()) return { status: "storage-unavailable", reason: "localStorage 不可用" };
  const raw = safeGetItem(STORAGE_KEY);
  if (!raw) return { status: "not-found" };
  let parsed: unknown;
  try { parsed = JSON.parse(raw); } catch (e) {
    return { status: "corrupt", reason: `JSON 解析失败: ${e instanceof Error ? e.message : "未知错误"}` };
  }
  if (typeof parsed === "object" && parsed !== null && "schemaVersion" in parsed) {
    const result = validateSaveEnvelope(parsed);
    if (!result.success) return { status: "corrupt", reason: `校验失败:\n${result.error}` };
    const refError = validateSaveReferences(result.data, gameData);
    if (refError) return { status: "incompatible", reason: refError };
    if (result.data.gameDataVersion !== gameData.meta.version)
      return { status: "migrated", save: { ...result.data, gameDataVersion: gameData.meta.version } };
    return { status: "ok", save: result.data };
  }
  const legacyResult = validateLegacyGameState(parsed);
  if (!legacyResult.success) return { status: "corrupt", reason: `旧版校验失败:\n${legacyResult.error}` };
  return migrateLegacySave(parsed, gameData);
}

export function migrateLegacySave(raw: unknown, gameData: GameData): LoadSaveResult {
  const legacyResult = validateLegacyGameState(raw);
  if (!legacyResult.success) return { status: "corrupt", reason: `旧版数据不合法:\n${legacyResult.error}` };
  const state = legacyResult.data;
  if (!gameData.scenes[state.currentSceneId])
    return { status: "incompatible", reason: `旧版场景 ID "${state.currentSceneId}" 不存在` };
  const save: SaveEnvelope = {
    schemaVersion: SCHEMA_VERSION,
    gameId: "snow-before-v1",
    gameDataVersion: gameData.meta.version,
    savedAt: Date.now(),
    state,
    snapshots: {},
  };
  writeSave(save);
  return { status: "migrated", save };
}

export function writeSave(save: SaveEnvelope): SaveWriteResult {
  if (!isStorageAvailable()) return { status: "storage-unavailable", reason: "localStorage 不可用" };
  const result = validateSaveEnvelope(save);
  if (!result.success) return { status: "storage-unavailable", reason: `数据校验失败，拒绝写入:\n${result.error}` };
  try {
    const json = JSON.stringify(save);
    return safeSetItem(STORAGE_KEY, json);
  } catch (e) {
    return { status: "storage-unavailable", reason: `序列化失败: ${e instanceof Error ? e.message : "未知错误"}` };
  }
}

export function clearSave(): SaveWriteResult {
  return safeRemoveItem(STORAGE_KEY);
}

export function buildSaveEnvelope(
  state: GameState,
  snapshots: Record<string, StateSnapshot>,
  gameDataVersion: string,
): SaveEnvelope {
  return {
    schemaVersion: SCHEMA_VERSION,
    gameId: "snow-before-v1",
    gameDataVersion,
    savedAt: Date.now(),
    state: structuredClone(state),
    snapshots: structuredClone(snapshots),
  };
}
