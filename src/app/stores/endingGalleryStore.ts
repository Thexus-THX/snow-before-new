import { create } from "zustand";
import type { HistoryEntry } from "@/schemas/types";

/** 单个结局的解锁记录 */
export interface EndingUnlockRecord {
  endingId: string;
  unlockedAt: number; // 时间戳
  /** 触发该结局时经历的关键选择转折点 */
  keyTurningPoints: TurningPoint[];
}

/** 转折点 */
export interface TurningPoint {
  sceneId: string;
  choiceText: string;
  isCritical: boolean;
  visibleEffects: string[];
  timestamp: number;
}

/** 周目记录 */
export interface PlaythroughRecord {
  id: string;              // playthrough_时间戳
  startedAt: number;
  endedAt?: number;
  endingId?: string;       // 最终触发的结局ID
  history: HistoryEntry[]; // 完整选择历史
}

/** 结局图鉴 Store */
interface EndingGalleryStore {
  /** 已解锁的结局 ID 集合 */
  unlockedEndingIds: Set<string>;

  /** 每个结局的所有解锁记录（支持多次解锁不同变体） */
  unlockRecords: EndingUnlockRecord[];

  /** 所有周目记录 */
  playthroughs: PlaythroughRecord[];

  /** 当前正在进行的周目 */
  currentPlaythroughId: string | null;

  // ---- 操作 ----

  /** 开始新周目 */
  startNewPlaythrough: () => string;

  /** 记录当前周目的选择历史快照 */
  updateCurrentPlaythroughHistory: (history: HistoryEntry[]) => void;

  /** 完成当前周目（触发结局） */
  completePlaythrough: (endingId: string) => void;

  /** 判断某结局是否已解锁 */
  isEndingUnlocked: (endingId: string) => boolean;

  /** 获取某结局的最新解锁记录 */
  getLatestUnlockRecord: (endingId: string) => EndingUnlockRecord | undefined;

  /** 获取所有已触发的结局列表 */
  getUnlockedEndings: () => EndingUnlockRecord[];

  /** 清零所有数据（重置图鉴） */
  resetAllData: () => void;
}

const STORAGE_KEY = "snow-before-v1-ending-gallery";

function loadGallery(): Partial<EndingGalleryStore> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const data = JSON.parse(raw);
    return {
      unlockedEndingIds: new Set(data.unlockedEndingIds ?? []),
      unlockRecords: data.unlockRecords ?? [],
      playthroughs: data.playthroughs ?? [],
      currentPlaythroughId: data.currentPlaythroughId ?? null,
    };
  } catch {
    return {};
  }
}

function saveGallery(state: Pick<EndingGalleryStore,
  "unlockedEndingIds" | "unlockRecords" | "playthroughs" | "currentPlaythroughId"
>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      unlockedEndingIds: Array.from(state.unlockedEndingIds),
      unlockRecords: state.unlockRecords,
      playthroughs: state.playthroughs,
      currentPlaythroughId: state.currentPlaythroughId,
    }));
  } catch {
    // localStorage 写入失败时静默降级
  }
}

/** 从历史中提取关键转折点（关键选择 + 有可见效果的选择） */
function extractTurningPoints(history: HistoryEntry[]): TurningPoint[] {
  return history
    .filter((entry) => entry.type === "choice")
    .filter((entry) =>
      entry.isCritical ||
      (entry.visibleEffects && entry.visibleEffects.length > 0)
    )
    .map((entry) => ({
      sceneId: entry.sceneId,
      choiceText: entry.text,
      isCritical: !!entry.isCritical,
      visibleEffects: entry.visibleEffects ?? [],
      timestamp: entry.createdAt,
    }));
}

const saved = loadGallery();

export const useEndingGalleryStore = create<EndingGalleryStore>((set, get) => ({
  unlockedEndingIds: saved.unlockedEndingIds ?? new Set<string>(),
  unlockRecords: saved.unlockRecords ?? [],
  playthroughs: saved.playthroughs ?? [],
  currentPlaythroughId: saved.currentPlaythroughId ?? null,

  startNewPlaythrough: () => {
    const id = `playthrough_${Date.now()}`;
    const newPlaythrough: PlaythroughRecord = {
      id,
      startedAt: Date.now(),
      history: [],
    };
    set((state) => ({
      currentPlaythroughId: id,
      playthroughs: [...state.playthroughs, newPlaythrough],
    }));
    saveGallery(get());
    return id;
  },

  updateCurrentPlaythroughHistory: (history: HistoryEntry[]) => {
    const { currentPlaythroughId } = get();
    if (!currentPlaythroughId) return;
    set((state) => ({
      playthroughs: state.playthroughs.map((p) =>
        p.id === currentPlaythroughId ? { ...p, history } : p
      ),
    }));
    saveGallery(get());
  },

  completePlaythrough: (endingId: string) => {
    const { currentPlaythroughId, playthroughs, unlockedEndingIds, unlockRecords } = get();

    // 找到当前周目
    const current = playthroughs.find((p) => p.id === currentPlaythroughId);
    if (!current) return;

    // 提取转折点
    const turningPoints = extractTurningPoints(current.history);

    // 创建解锁记录
    const record: EndingUnlockRecord = {
      endingId,
      unlockedAt: Date.now(),
      keyTurningPoints: turningPoints,
    };

    // 更新状态
    const newUnlocked = new Set(unlockedEndingIds);
    newUnlocked.add(endingId);

    set({
      unlockedEndingIds: newUnlocked,
      unlockRecords: [...unlockRecords, record],
      playthroughs: playthroughs.map((p) =>
        p.id === currentPlaythroughId
          ? { ...p, endedAt: Date.now(), endingId }
          : p
      ),
      currentPlaythroughId: null,
    });
    saveGallery(get());
  },

  isEndingUnlocked: (endingId: string) => {
    return get().unlockedEndingIds.has(endingId);
  },

  getLatestUnlockRecord: (endingId: string) => {
    const records = get().unlockRecords.filter((r) => r.endingId === endingId);
    if (records.length === 0) return undefined;
    // 返回最新的解锁记录
    return records.sort((a, b) => b.unlockedAt - a.unlockedAt)[0];
  },

  getUnlockedEndings: () => {
    const { unlockRecords, unlockedEndingIds } = get();
    // 对每个已解锁的结局，返回最新的一条记录
    const latestMap = new Map<string, EndingUnlockRecord>();
    for (const record of unlockRecords) {
      const existing = latestMap.get(record.endingId);
      if (!existing || record.unlockedAt > existing.unlockedAt) {
        latestMap.set(record.endingId, record);
      }
    }
    return Array.from(latestMap.values());
  },

  resetAllData: () => {
    set({
      unlockedEndingIds: new Set(),
      unlockRecords: [],
      playthroughs: [],
      currentPlaythroughId: null,
    });
    saveGallery(get());
  },
}));
