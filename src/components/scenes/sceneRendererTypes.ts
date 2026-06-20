/**
 * sceneRendererTypes.ts — 统一场景渲染层 Props 类型定义
 *
 * 所有场景组件（StandardDialogue / 特殊场景 / Fallback）共享此接口。
 * GamePage 负责持有状态和回调，SceneRenderer 按模板分发给对应组件。
 */

import type {
  SceneDefinition,
  GameState,
  HistoryEntry,
  ResolvedChoice,
  ChoiceDefinition,
} from "@/schemas/types";
import type { GameEngine } from "@/engine/gameEngine";

/** 基础 Props：所有场景组件共有的数据 */
export interface SceneComponentBaseProps {
  scene: SceneDefinition;
  state: GameState;
  engine: GameEngine;
}

/** 回调 Props：从 GamePage 传入的操作回调 */
export interface SceneCallbackProps {
  /** 推进到下一场景（直接跳转，不经过选择） */
  onAdvance: (nextSceneId: string) => void;
  /** 选择选项（普通选择直接提交，关键选择触发二次确认） */
  onSelectChoice: (choice: ChoiceDefinition) => void;
  /** 确认关键选择 */
  onConfirmCritical: (choice: ChoiceDefinition) => void;
  /** 取消关键选择确认 */
  onCancelConfirm: () => void;
  /** 回滚到指定历史条目 */
  onRollback: (entry: HistoryEntry) => void;
  /** 切换历史面板显隐 */
  onToggleHistory: () => void;
}

/** 选择相关状态：由 GamePage 管理，传入子组件 */
export interface SceneChoiceState {
  /** 解析后的选项列表 */
  resolvedChoices: ResolvedChoice[];
  /** 是否正在显示选项 */
  showingChoices: boolean;
  /** 等待二次确认的关键选项 */
  pendingConfirm: ChoiceDefinition | null;
  /** 是否有选项 */
  hasChoices: boolean;
  /** 选项提交错误消息（用户可见） */
  choiceError: string | null;
}

/** 历史相关状态 */
export interface SceneHistoryState {
  /** 历史记录列表 */
  history: HistoryEntry[];
  /** 是否显示历史面板 */
  showHistory: boolean;
}

/** SceneRenderer 完整 Props */
export interface SceneRendererProps
  extends SceneComponentBaseProps,
    SceneCallbackProps,
    SceneChoiceState,
    SceneHistoryState {}

/** 普通对话场景 Props = 完整 Props（因为它需要所有子组件） */
export type StandardDialogueSceneProps = SceneRendererProps;

/** 特殊场景 Props：只需基础数据 + 推进回调（不需要选择/历史面板交互） */
export interface SpecialSceneProps extends SceneComponentBaseProps {
  onAdvance: (nextSceneId: string) => void;
}

/** 章节介绍场景 Props */
export type ChapterIntroSceneProps = SpecialSceneProps;

/** 家书场景 Props */
export type LetterSceneProps = SpecialSceneProps;

/** 历史事件场景 Props */
export type HistoricalEventSceneProps = SpecialSceneProps;

/** 季节札记场景 Props */
export type SeasonJournalSceneProps = SpecialSceneProps;

/** 结局场景 Props */
export type EndingSceneProps = SpecialSceneProps;

/** 自由排版场景 Props */
export type FreeLayoutSceneProps = SpecialSceneProps;

/** 安全降级场景 Props */
export type SceneFallbackProps = SpecialSceneProps;
