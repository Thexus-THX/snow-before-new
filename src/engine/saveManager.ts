/**
 * saveManager.ts — 版本化存档管理器（P0 实现）
 *
 * 功能：
 * - SaveEnvelope 封装（schemaVersion + gameDataVersion + 时间戳 + snapshots）
 * - Zod 校验
 * - 旧裸 GameState 存档迁移
 * - 结构化 LoadSaveResult
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

/** 存档封装 */
export interface SaveEnvelope {
  schemaVersion: 1;
  gameId: "snow-before-v1";
  gameDataVersion: string; // game-data.json 中的 meta.version
  savedAt: number;
  state: GameState;
  snapshots: Record<string, StateSnapshot>;
}

/** 存档加载结果 */
export type LoadSaveResult =
  | { status: "ok"; save: SaveEnvelope }
  | { status: "not-found" }
  | { status: "migrated"; save: SaveEnvelope }
  | { status: "corrupt"; reason: string }
  | { status: "incompatible"; reason: string }
  | { status: "storage-unavailable"; reason: string };

/** 存档写入结果 */
export type SaveWriteResult =
  | { status: "ok" }
  | { status: "storage-unavailable"; reason: string };

// ============================================================
// 常量
// ============================================================

const STORAGE_KEY = "snow-before-v1-save";
const SCHEMA_VERSION = 1 as const;

// ============================================================
// Zod Schema
// ============================================================

/** StateSnapshot 的 Zod Schema */
const stateSnapshotSchema = z.object({
  id: z.string(),
  sceneId: z.string(),
  state: gameStateSchema,
  createdAt: z.number(),
});

/** SaveEnvelope 的 Zod Schema */
const saveEnvelopeSchema = z.object({
  schemaVersion: z.literal(1),
  gameId: z.literal("snow-before-v1"),
  gameDataVersion: z.string(),
  savedAt: z.number(),
  state: gameStateSchema,
  snapshots: z.record(stateSnapshotSchema),
});

/** 旧的裸 GameState 格式（用于检测和迁移） */
const legacyGameStateSchema = gameStateSchema;

// ============================================================
// 工具函数
// ============================================================

/**
 * 安全检测 localStorage 是否可用
 */
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

/**
 * 安全读取 localStorage
 */
function safeGetItem(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

/**
 * 安全写入 localStorage
 */
function safeSetItem(key: string, value: string): SaveWriteResult {
  try {
    localStorage.setItem(key, value);
    return { status: "ok" };
  } catch {
    return { status: "storage-unavailable", reason: "localStorage 写入失败，可能已满或浏览器隐私模式下不可用" };
  }
}

/**
 * 安全删除 localStorage
 */
function safeRemoveItem(key: string): SaveWriteResult {
  try {
    localStorage.removeItem(key);
    return { status: "ok" };
  } catch {
    return { status: "storage-unavailable", reason: "localStorage 删除失败" };
  }
}

// ============================================================
// 校验函数
// ============================================================

/**
 * 校验 SaveEnvelope
 */
function validateSaveEnvelope(data: unknown): { success: true; data: SaveEnvelope } | { success: false; error: string } {
  const result = saveEnvelopeSchema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data as SaveEnvelope };
  }
  const errors = result.error.issues.map(
    (issue) => `[${issue.path.join(".")}] ${issue.message}`
  );
  return { success: false, error: errors.join("\n") };
}

/**
 * 校验旧版裸 GameState
 */
function validateLegacyGameState(data: unknown): { success: true; data: GameState } | { success: false; error: string } {
  const result = legacyGameStateSchema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data as GameState };
  }
  const errors = result.error.issues.map(
    (issue) => `[${issue.path.join(".")}] ${issue.message}`
  );
  return { success: false, error: errors.join("\n") };
}

// ============================================================
// 存档逻辑校验
// ============================================================

/**
 * 校验存档中的场景和章节引用在 gameData 中存在
 */
function validateSaveReferences(save: SaveEnvelope, gameData: GameData): string | null {
  // 校验 currentSceneId 存在
  if (!gameData.scenes[save.state.currentSceneId]) {
    return `存档中的场景 ID "${save.state.currentSceneId}" 在当前游戏数据中不存在`;
  }

  // 校验 chapterId 存在
  const chapterExists = gameData.chapters.some((ch) => ch.id === save.state.chapterId);
  if (!chapterExists) {
    return `存档中的章节 ID "${save.state.chapterId}" 在当前游戏数据中不存在`;
  }

  // 校验历史中的 rollbackSnapshotId 对应快照存在
  for (const entry of save.state.history) {
    if (entry.rollbackSnapshotId && !save.snapshots[entry.rollbackSnapshotId]) {
      return `历史条目 "${entry.id}" 引用的回滚快照 "${entry.rollbackSnapshotId}" 不存在`;
    }
  }

  return null; // 全部通过
}

// ============================================================
// 公开 API
// ============================================================

/**
 * 检测是否存在有效存档
 */
export function hasValidSave(gameData: GameData): boolean {
  if (!isStorageAvailable()) return false;

  const raw = safeGetItem(STORAGE_KEY);
  if (!raw) return false;

  // 尝试解析 JSON
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return false;
  }

  // 尝试按 SaveEnvelope 校验
  const envelopeResult = validateSaveEnvelope(parsed);
  if (envelopeResult.success) {
    const refError = validateSaveReferences(envelopeResult.data, gameData);
    return refError === null;
  }

  // 尝试按旧版 GameState 校验
  const legacyResult = validateLegacyGameState(parsed);
  if (legacyResult.success) {
    // 旧版可以迁移，视为有效
    return gameData.scenes[legacyResult.data.currentSceneId] !== undefined;
  }

  return false;
}

/**
 * 从 localStorage 加载存档
 */
export function loadSave(gameData: GameData): LoadSaveResult {
  // 检查 storage 可用性
  if (!isStorageAvailable()) {
    return { status: "storage-unavailable", reason: "localStorage 不可用，可能处于浏览器隐私模式" };
  }

  const raw = safeGetItem(STORAGE_KEY);
  if (!raw) {
    return { status: "not-found" };
  }

  // 尝试解析 JSON
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (e) {
    return { status: "corrupt", reason: `存档 JSON 解析失败: ${e instanceof Error ? e.message : "未知错误"}` };
  }

  // 判断是新版 SaveEnvelope 还是旧版裸 GameState
  if (typeof parsed === "object" && parsed !== null && "schemaVersion" in parsed) {
    // 新版格式
    const result = validateSaveEnvelope(parsed);
    if (!result.success) {
      return { status: "corrupt", reason: `存档校验失败:\n${result.error}` };
    }

    const refError = validateSaveReferences(result.data, gameData);
    if (refError) {
      return { status: "incompatible", reason: refError };
    }

    // 校验 gameDataVersion 兼容性
    if (result.data.gameDataVersion !== gameData.meta.version) {
      // 版本不同但仍可加载（结构兼容），标记为 migrated
      const migrated = { ...result.data, gameDataVersion: gameData.meta.version };
      return { status: "migrated", save: migrated };
    }

    return { status: "ok", save: result.data };
  }

  // 旧版格式：裸 GameState
  const legacyResult = validateLegacyGameState(parsed);
  if (!legacyResult.success) {
    return { status: "corrupt", reason: `旧版存档校验失败:\n${legacyResult.error}` };
  }

  return migrateLegacySave(parsed, gameData);
}

/**
 * 迁移旧版裸 GameState 为 SaveEnvelope
 */
export function migrateLegacySave(raw: unknown, gameData: GameData): LoadSaveResult {
  const legacyResult = validateLegacyGameState(raw);
  if (!legacyResult.success) {
    return { status: "corrupt", reason: `旧版存档数据不合法，无法迁移:\n${legacyResult.error}` };
  }

  const state = legacyResult.data;

  // 校验引用
  if (!gameData.scenes[state.currentSceneId]) {
    return { status: "incompatible", reason: `旧版存档中的场景 ID "${state.currentSceneId}" 在当前游戏数据中不存在` };
  }

  // 构建新 SaveEnvelope
  const save: SaveEnvelope = {
    schemaVersion: SCHEMA_VERSION,
    gameId: "snow-before-v1",
    gameDataVersion: gameData.meta.version,
    savedAt: Date.now(),
    state,
    snapshots: {},
  };

  // 立即写回新格式
  const writeResult = writeSave(save);
  if (writeResult.status !== "ok") {
    // 写入失败但迁移成功（数据已加载到内存）
    return { status: "migrated", save };
  }

  return { status: "migrated", save };
}

/**
 * 写入存档到 localStorage
 */
export function writeSave(save: SaveEnvelope): SaveWriteResult {
  if (!isStorageAvailable()) {
    return { status: "storage-unavailable", reason: "localStorage 不可用" };
  }

  // 校验数据结构
  const result = validateSaveEnvelope(save);
  if (!result.success) {
    return { status: "storage-unavailable", reason: `存档数据校验失败，拒绝写入:\n${result.error}` };
  }

  try {
    const json = JSON.stringify(save);
    return safeSetItem(STORAGE_KEY, json);
  } catch (e) {
    return { status: "storage-unavailable", reason: `序列化存档失败: ${e instanceof Error ? e.message : "未知错误"}` };
  }
}

/**
 * 清除存档
 */
export function clearSave(): SaveWriteResult {
  return safeRemoveItem(STORAGE_KEY);
}

/**
 * 从当前 store 状态构建 SaveEnvelope
 */
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

// ============================================================
// 导出常量（供外部使用）
// ============================================================

export { STORAGE_KEY, SCHEMA_VERSION };
