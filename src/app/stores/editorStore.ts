import { create } from "zustand";
import type { SceneDefinition, EditorSnapshot } from "@/schemas/types";

/**
 * editorStore — 可视化编辑器状态
 *
 * 管理编辑器内部状态：场景 CRUD、选中状态、Undo/Redo、草稿持久化。
 * 与 gameStore 完全独立。
 */
interface EditorStore {
  // ---- 数据 ----
  scenes: Record<string, SceneDefinition>;
  sceneOrder: string[]; // 场景列表顺序
  selectedSceneId: string | null;
  selectedElementId: string | null;

  // ---- Undo/Redo ----
  undoStack: EditorSnapshot[];
  redoStack: EditorSnapshot[];

  // ---- 脏状态 & 草稿 ----
  isDirty: boolean;

  // ---- 场景 CRUD ----
  createScene: (scene: SceneDefinition) => void;
  updateScene: (sceneId: string, partial: Partial<SceneDefinition>) => void;
  deleteScene: (sceneId: string) => void;
  duplicateScene: (sceneId: string) => string | null;
  renameScene: (sceneId: string, name: string) => void;
  reorderScene: (fromIndex: number, toIndex: number) => void;

  // ---- 选中 ----
  selectScene: (sceneId: string | null) => void;
  selectElement: (elementId: string | null) => void;
  getSelectedScene: () => SceneDefinition | null;

  // ---- Undo/Redo ----
  pushSnapshot: () => void;
  undo: () => void;
  redo: () => void;
  clearHistory: () => void;

  // ---- 草稿 ----
  saveDraft: () => void;
  loadDraft: () => boolean;

  // ---- 导入/导出 ----
  loadScenes: (scenes: Record<string, SceneDefinition>, order: string[]) => void;
  exportScenes: () => Record<string, SceneDefinition>;

  // ---- 重置 ----
  reset: () => void;
}

const MAX_UNDO = 20;

export const useEditorStore = create<EditorStore>((set, get) => ({
  scenes: {},
  sceneOrder: [],
  selectedSceneId: null,
  selectedElementId: null,
  undoStack: [],
  redoStack: [],
  isDirty: false,

  createScene: (scene: SceneDefinition) => {
    get().pushSnapshot();
    set((s) => ({
      scenes: { ...s.scenes, [scene.id]: scene },
      sceneOrder: [...s.sceneOrder, scene.id],
      isDirty: true,
    }));
  },

  updateScene: (sceneId: string, partial: Partial<SceneDefinition>) => {
    const current = get().scenes[sceneId];
    if (!current) return;
    get().pushSnapshot();
    set((s) => ({
      scenes: {
        ...s.scenes,
        [sceneId]: { ...current, ...partial },
      },
      isDirty: true,
    }));
  },

  deleteScene: (sceneId: string) => {
    get().pushSnapshot();
    set((s) => {
      const { [sceneId]: _, ...rest } = s.scenes;
      return {
        scenes: rest,
        sceneOrder: s.sceneOrder.filter((id) => id !== sceneId),
        selectedSceneId:
          s.selectedSceneId === sceneId ? null : s.selectedSceneId,
        isDirty: true,
      };
    });
  },

  duplicateScene: (sceneId: string) => {
    const original = get().scenes[sceneId];
    if (!original) return null;
    const newId = `${sceneId}_copy_${Date.now()}`;
    const copy: SceneDefinition = {
      ...structuredClone(original),
      id: newId,
      name: `${original.name} (副本)`,
    };
    get().pushSnapshot();
    set((s) => ({
      scenes: { ...s.scenes, [newId]: copy },
      sceneOrder: [...s.sceneOrder, newId],
      isDirty: true,
    }));
    return newId;
  },

  renameScene: (sceneId: string, name: string) => {
    const current = get().scenes[sceneId];
    if (!current) return;
    get().pushSnapshot();
    set((s) => ({
      scenes: { ...s.scenes, [sceneId]: { ...current, name } },
      isDirty: true,
    }));
  },

  reorderScene: (fromIndex: number, toIndex: number) => {
    get().pushSnapshot();
    set((s) => {
      const order = [...s.sceneOrder];
      const [removed] = order.splice(fromIndex, 1);
      order.splice(toIndex, 0, removed);
      return { sceneOrder: order, isDirty: true };
    });
  },

  selectScene: (sceneId) => {
    set({ selectedSceneId: sceneId, selectedElementId: null });
  },

  selectElement: (elementId) => {
    set({ selectedElementId: elementId });
  },

  getSelectedScene: () => {
    const { scenes, selectedSceneId } = get();
    if (!selectedSceneId) return null;
    return scenes[selectedSceneId] ?? null;
  },

  pushSnapshot: () => {
    const { scenes, undoStack } = get();
    const snapshot: EditorSnapshot = {
      scenes: structuredClone(scenes),
      timestamp: Date.now(),
    };
    const nextUndo = [snapshot, ...undoStack].slice(0, MAX_UNDO);
    set({ undoStack: nextUndo, redoStack: [] });
  },

  undo: () => {
    const { undoStack, scenes, sceneOrder } = get();
    if (undoStack.length === 0) return;
    const [lastSnapshot, ...restUndo] = undoStack;
    // 当前状态推入 redo
    const currentSnapshot: EditorSnapshot = {
      scenes: structuredClone(scenes),
      timestamp: Date.now(),
    };
    set({
      scenes: lastSnapshot.scenes,
      // 保持 sceneOrder 不变（Undo 不改变列表结构）
      sceneOrder,
      undoStack: restUndo,
      redoStack: [currentSnapshot, ...get().redoStack],
      isDirty: true,
    });
  },

  redo: () => {
    const { redoStack, scenes, sceneOrder } = get();
    if (redoStack.length === 0) return;
    const [nextSnapshot, ...restRedo] = redoStack;
    const currentSnapshot: EditorSnapshot = {
      scenes: structuredClone(scenes),
      timestamp: Date.now(),
    };
    set({
      scenes: nextSnapshot.scenes,
      sceneOrder,
      undoStack: [currentSnapshot, ...get().undoStack].slice(0, MAX_UNDO),
      redoStack: restRedo,
      isDirty: true,
    });
  },

  clearHistory: () => {
    set({ undoStack: [], redoStack: [] });
  },

  saveDraft: () => {
    const { scenes, sceneOrder } = get();
    const payload = { scenes, sceneOrder };
    localStorage.setItem("snow-before-editor-draft", JSON.stringify(payload));
    set({ isDirty: false });
  },

  loadDraft: () => {
    try {
      const raw = localStorage.getItem("snow-before-editor-draft");
      if (!raw) return false;
      const { scenes, sceneOrder } = JSON.parse(raw);
      set({ scenes, sceneOrder, isDirty: false });
      return true;
    } catch {
      return false;
    }
  },

  loadScenes: (scenes: Record<string, SceneDefinition>, order: string[]) => {
    set({ scenes, sceneOrder: order, isDirty: false });
    get().clearHistory();
  },

  exportScenes: () => {
    return get().scenes;
  },

  reset: () => {
    set({
      scenes: {},
      sceneOrder: [],
      selectedSceneId: null,
      selectedElementId: null,
      undoStack: [],
      redoStack: [],
      isDirty: false,
    });
  },
}));
