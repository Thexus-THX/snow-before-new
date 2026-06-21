// ============================================================
// 《雪落之前》V1 — 完整 TypeScript 类型定义
// 严格遵循 docs/07_DATA_SCHEMA.md
// ============================================================

// ---- 元信息 ----

export interface GameMeta {
  id: "snow-before-v1";
  title: "雪落之前";
  version: string;
  startSceneId: string;
  continueEnabled: boolean;
  logicalWidth: 1920;
  logicalHeight: 1080;
  sceneHeight: 864;
  dialogueHeight: 216;
  topStatusHeight: 72;
}

// ---- 角色定义 ----

export interface CharacterDefinition {
  id: string;
  name: string;
  shortName?: string;
  fullName?: string;
  defaultPortrait?: string;
  portraits: Record<string, string>;
}

// ---- 游戏状态 ----

export interface GameState {
  currentSceneId: string;
  chapterId: string;

  stats: {
    knowledge: number; // 学识 (0-10)
    wellbeing: number; // 身心状态 (0-10)
    responsibility: number; // 担当 (0-10, 隐藏)
    homesickness: number; // 故土牵挂 (0-10, 隐藏)
  };

  preparationItems: {
    route: number; // 归国路线 (0-2)
    documents: number; // 身份与票证 (0-2)
    funds: number; // 经费 (0-2)
    technicalMaterials: number; // 技术资料 (0-2)
    contact: number; // 可靠联系人 (0-2)
  };

  trust: {
    chen: number; // 陈绍衡 (0-10)
    nadya: number; // 娜佳 (0-10)
    belov: number; // 别洛夫 (0-10)
    ivan: number; // 伊万 (0-10)
  };

  cooperationModifier: number; // 合作修正值
  returnTendency: number; // 归国倾向
  stayTendency: number; // 留苏倾向
  flags: string[];
  lockedCriticalChoiceIds: string[];
  history: HistoryEntry[];
  visitedSceneIds: string[];
}

// 派生值（不存 JSON，由引擎计算）
// preparation = sum(preparationItems)
// socialTrust = clamp(round((chen+nadya+belov+ivan)/4) + cooperationModifier, 0, 10)

// ---- 章节定义 ----

export type SeasonLabel =
  | "spring"
  | "summer"
  | "autumn"
  | "winter"
  | "prologue"
  | "ending";

export interface ChapterDefinition {
  id: string;
  title: string;
  year: number;
  season: SeasonLabel;
  location: string;
  introSceneId: string;
  journalSceneId?: string;
}

// ---- 场景定义 ----

export type SceneTemplate =
  | "standardDialogue"
  | "freeLayout"
  | "letter"
  | "chapterIntro"
  | "historicalEvent"
  | "seasonJournal"
  | "ending";

export interface SceneDefinition {
  id: string;
  name: string;
  chapterId: string;
  template: SceneTemplate;

  background?: string;
  bgm?: string;
  ambience?: string;
  enterSfx?: string;

  showTopStatusBar?: boolean;
  showDialoguePanel?: boolean;

  elements?: CanvasElement[];
  content?: SceneContent;
  choices?: ChoiceDefinition[];

  nextSceneId?: string;
  autoSavePoint?:
    | "chapterStart"
    | "criticalChoice"
    | "chapterEnd"
    | "beforeEnding";
  conditions?: ConditionGroup;
}

// ---- 画布元素 ----

export type CanvasElement = ImageElement | TextElement;

export interface BaseElement {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  opacity: number;
  zIndex: number;
  locked?: boolean;
}

export interface ImageElement extends BaseElement {
  type: "image";
  asset: string;
  fit: "contain" | "cover";
}

export interface TextElement extends BaseElement {
  type: "text";
  text: string;
  fontFamily: string;
  fontSize: number;
  lineHeight: number;
  align: "left" | "center" | "right";
  color: string;
  backgroundColor?: string;
}

// ---- 场景内容 ----

export interface SceneContent {
  speakerId?: string;
  speakerName?: string;
  textType?: "dialogue" | "narration" | "innerThought";
  text?: string;
  portraitAsset?: string;

  chapterTitle?: string;
  dateText?: string;
  locationText?: string;
  backgroundText?: string;

  letter?: LetterContent;
  historicalEvent?: HistoricalEventContent;
  journal?: SeasonJournalContent;
  ending?: EndingContent;
}

// ---- 家书 ----

export interface LetterContent {
  date?: string;
  salutation?: string;
  pages: string[]; // 每页文字，1-3 页
  postscript?: string;
  signature?: string;
  paperAsset: string;
  openSfx?: string;
  pageTurnSfx?: string;
  closeSfx?: string;
  historyPlainText: string; // 历史面板保留的纯文字副本
}

// ---- 历史事件页 ----

export interface HistoricalEventContent {
  date: string;
  title: string;
  imageAsset: string;
  paragraphs: string[]; // 2-4 句客观说明
  gameplayNotice?: string; // 对后续玩法的提示
  sourceNote?: string; // 史料来源或"艺术化重构"标注
}

// ---- 季节札记 ----

export interface SeasonJournalContent {
  visibleSummary: {
    knowledgeLabel: string;
    wellbeingLabel: string;
    preparationLabel: string;
  };
  journalText: string; // 第一人称札记
  keepsakes: string[]; // 1-3 项本季留下的事物
}

// ---- 结局内容 ----

export interface EndingContent {
  title: string;
  paragraphs: string[];
  voice?: string;
}

// ---- 选项 ----

export interface ChoiceDefinition {
  id: string;
  text: string;
  isCritical: boolean;
  nextSceneId: string;

  effects?: EffectDefinition;
  conditions?: ConditionGroup;

  visibleWhenLocked?: boolean; // 锁定状态下是否仍显示
  lockedHint?: string; // 锁定提示（叙事化）
  choiceGroupId?: string; // 相同 groupId 的不同条件版本

  confirmationText?: string; // 关键选择二次确认文案
  narrativeFeedback?: string; // 选择后的叙事反馈
}

/** 选项可用性三态 */
export type ChoiceAvailability = "available" | "locked" | "hidden";

/** 解析后的选项（含可用性状态） */
export interface ResolvedChoice {
  choice: ChoiceDefinition;
  availability: ChoiceAvailability;
  lockedHint?: string; // 锁定原因（叙事化，不暴露数值阈值）
}

// ---- 效果 ----

export interface EffectDefinition {
  stats?: Partial<{
    knowledge: number;
    wellbeing: number;
    responsibility: number;
    homesickness: number;
  }>;

  preparationItems?: Partial<{
    route: number;
    documents: number;
    funds: number;
    technicalMaterials: number;
    contact: number;
  }>;

  trust?: Partial<{
    chen: number;
    nadya: number;
    belov: number;
    ivan: number;
  }>;

  cooperationModifier?: number;
  returnTendency?: number;
  stayTendency?: number;
  addFlags?: string[];
  removeFlags?: string[];
}

// ---- 条件 ----

export interface ConditionGroup {
  all?: Condition[]; // AND 逻辑
  any?: Condition[]; // OR 逻辑
  none?: Condition[]; // NOT 逻辑
}

export type Condition =
  | { type: "statMin"; key: string; value: number }
  | { type: "statMax"; key: string; value: number }
  | { type: "prepMin"; key: string; value: number }
  | { type: "prepExact"; key: string; value: number }
  | { type: "trustMin"; key: string; value: number }
  | { type: "flag"; value: string }
  | { type: "notFlag"; value: string }
  | { type: "tendencyMin"; key: "return" | "stay"; value: number }
  | { type: "reliableCountMin"; value: number };

// ---- 历史记录 ----

export interface HistoryEntry {
  id: string;
  sceneId: string;
  type: "text" | "choice" | "letter" | "system";
  speakerName?: string;
  text: string;
  visibleEffects?: string[]; // 只记录显性数值变化描述
  isCritical?: boolean;
  isLocked?: boolean;
  rollbackSnapshotId?: string; // 可回滚快照 ID
  choiceId?: string; // 关联的选择定义 ID
  createdAt: number;
}

// ---- 状态快照 ----

export interface StateSnapshot {
  id: string;
  sceneId: string;
  state: GameState;
  createdAt: number;
}

// ---- 结局 ----

export interface EndingDefinition {
  id: string;
  title: string;
  background: string;
  bgm: string;
  voice?: string;
  variants: EndingVariant[];
}

export interface EndingVariant {
  id: string;
  conditions: ConditionGroup;
  paragraphs: string[];
  journeyReview: JourneyReviewRule;
}

// ---- 旅程回顾 ----

export interface JourneyReviewRule {
  finalVisibleSummary: boolean; // 是否显示最终显性数值
  takeItems: ReviewItemRule[]; // "你带走了"
  leaveItems: ReviewItemRule[]; // "你未能带走"
  helpers: ReviewItemRule[]; // "曾帮助你的人"
  turningPoints: ReviewItemRule[]; // 关键经历
  maxItemsPerSection?: number; // 每区最多显示条数（默认 5）
}

export interface ReviewItemRule {
  text: string;
  conditions: ConditionGroup;
  priority: number;
}

// ---- 全局内容配置 ----

export interface GameContentSettings {
  textSpeeds: {
    slow: number; // 打字机慢速间隔（ms）
    normal: number;
    fast: number;
  };
  audioDefaults: {
    bgmVolume: number;
    ambienceVolume: number;
    sfxVolume: number;
    voiceVolume: number;
    masterVolume: number;
  };
}

// ---- 顶层 GameData ----

export interface GameData {
  meta: GameMeta;
  characters: Record<string, CharacterDefinition>;
  initialState: GameState;
  chapters: ChapterDefinition[];
  scenes: Record<string, SceneDefinition>;
  endings: Record<string, EndingDefinition>;
  settings: GameContentSettings;
}

// ---- 编辑器专用类型 ----

export interface EditorSnapshot {
  scenes: Record<string, SceneDefinition>;
  timestamp: number;
}
