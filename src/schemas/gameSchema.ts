import { z } from "zod";

// ============================================================
// 《雪落之前》V1 — Zod 校验 Schema
// 严格遵循 docs/07_DATA_SCHEMA.md 的校验规则
// ============================================================

// ---- 基础值范围 ----
const statValue = z.number().int().min(0).max(10);
const prepValue = z.number().int().min(0).max(2);

// ---- 条件 Schema ----
const conditionSchema: z.ZodType<import("./types").Condition> = z.union([
  z.object({ type: z.literal("statMin"), key: z.string(), value: z.number() }),
  z.object({ type: z.literal("statMax"), key: z.string(), value: z.number() }),
  z.object({ type: z.literal("prepMin"), key: z.string(), value: z.number() }),
  z.object({
    type: z.literal("prepExact"),
    key: z.string(),
    value: z.number(),
  }),
  z.object({ type: z.literal("trustMin"), key: z.string(), value: z.number() }),
  z.object({ type: z.literal("flag"), value: z.string() }),
  z.object({ type: z.literal("notFlag"), value: z.string() }),
  z.object({
    type: z.literal("tendencyMin"),
    key: z.enum(["return", "stay"]),
    value: z.number(),
  }),
  z.object({
    type: z.literal("reliableCountMin"),
    value: z.number(),
  }),
]);

const conditionGroupSchema: z.ZodType<import("./types").ConditionGroup> =
  z.object({
    all: z.array(conditionSchema).optional(),
    any: z.array(conditionSchema).optional(),
    none: z.array(conditionSchema).optional(),
  });

// ---- 效果 Schema ----
const effectSchema = z.object({
  stats: z
    .object({
      knowledge: z.number().int().optional(),
      wellbeing: z.number().int().optional(),
      responsibility: z.number().int().optional(),
      homesickness: z.number().int().optional(),
    })
    .optional(),
  preparationItems: z
    .object({
      route: z.number().int().optional(),
      documents: z.number().int().optional(),
      funds: z.number().int().optional(),
      technicalMaterials: z.number().int().optional(),
      contact: z.number().int().optional(),
    })
    .optional(),
  trust: z
    .object({
      chen: z.number().int().optional(),
      nadya: z.number().int().optional(),
      belov: z.number().int().optional(),
      ivan: z.number().int().optional(),
    })
    .optional(),
  cooperationModifier: z.number().int().optional(),
  returnTendency: z.number().int().optional(),
  stayTendency: z.number().int().optional(),
  addFlags: z.array(z.string()).optional(),
  removeFlags: z.array(z.string()).optional(),
});

// ---- 选项 Schema ----
const choiceSchema = z.object({
  id: z.string().min(1),
  text: z.string(),
  isCritical: z.boolean(),
  nextSceneId: z.string(),
  effects: effectSchema.optional(),
  conditions: conditionGroupSchema.optional(),
  visibleWhenLocked: z.boolean().optional(),
  lockedHint: z.string().optional(),
  choiceGroupId: z.string().optional(),
  confirmationText: z.string().optional(),
  narrativeFeedback: z.string().optional(),
});

// ---- 家书 Schema ----
const letterContentSchema = z.object({
  date: z.string().optional(),
  salutation: z.string().optional(),
  pages: z.array(z.string()).min(1).max(3),
  postscript: z.string().optional(),
  signature: z.string().optional(),
  paperAsset: z.string(),
  openSfx: z.string().optional(),
  pageTurnSfx: z.string().optional(),
  closeSfx: z.string().optional(),
  historyPlainText: z.string(),
});

// ---- 历史事件 Schema ----
const historicalEventSchema = z.object({
  date: z.string(),
  title: z.string(),
  imageAsset: z.string(),
  paragraphs: z.array(z.string()),
  gameplayNotice: z.string().optional(),
  sourceNote: z.string().optional(),
});

// ---- 季节札记 Schema ----
const seasonJournalSchema = z.object({
  visibleSummary: z.object({
    knowledgeLabel: z.string(),
    wellbeingLabel: z.string(),
    preparationLabel: z.string(),
  }),
  journalText: z.string(),
  keepsakes: z.array(z.string()),
});

// ---- 结局内容 Schema ----
const endingContentSchema = z.object({
  title: z.string(),
  paragraphs: z.array(z.string()),
  voice: z.string().optional(),
});

// ---- 场景内容 Schema ----
const sceneContentSchema = z.object({
  speakerId: z.string().optional(),
  speakerName: z.string().optional(),
  textType: z.enum(["dialogue", "narration", "innerThought"]).optional(),
  text: z.string().optional(),
  portraitAsset: z.string().optional(),
  chapterTitle: z.string().optional(),
  dateText: z.string().optional(),
  locationText: z.string().optional(),
  backgroundText: z.string().optional(),
  letter: letterContentSchema.optional(),
  historicalEvent: historicalEventSchema.optional(),
  journal: seasonJournalSchema.optional(),
  ending: endingContentSchema.optional(),
});

// ---- 画布元素 Schema ----
const baseElementSchema = z.object({
  id: z.string(),
  x: z.number(),
  y: z.number(),
  width: z.number(),
  height: z.number(),
  opacity: z.number().min(0).max(1),
  zIndex: z.number(),
  locked: z.boolean().optional(),
});

const imageElementSchema = baseElementSchema.extend({
  type: z.literal("image"),
  asset: z.string(),
  fit: z.enum(["contain", "cover"]),
});

const textElementSchema = baseElementSchema.extend({
  type: z.literal("text"),
  text: z.string(),
  fontFamily: z.string(),
  fontSize: z.number(),
  lineHeight: z.number(),
  align: z.enum(["left", "center", "right"]),
  color: z.string(),
  backgroundColor: z.string().optional(),
});

const canvasElementSchema = z.union([imageElementSchema, textElementSchema]);

// ---- 场景 Schema ----
const sceneSchema = z.object({
  id: z.string().min(1),
  name: z.string(),
  chapterId: z.string(),
  template: z.enum([
    "standardDialogue",
    "freeLayout",
    "letter",
    "chapterIntro",
    "historicalEvent",
    "seasonJournal",
    "ending",
  ]),
  background: z.string().optional(),
  bgm: z.string().optional(),
  ambience: z.string().optional(),
  enterSfx: z.string().optional(),
  showTopStatusBar: z.boolean().optional(),
  showDialoguePanel: z.boolean().optional(),
  elements: z.array(canvasElementSchema).optional(),
  content: sceneContentSchema.optional(),
  nextSceneId: z.string().optional(),
  choices: z.array(choiceSchema).optional(),
  conditions: conditionGroupSchema.optional(),
  autoSavePoint: z.enum(["chapterStart", "criticalChoice", "chapterEnd", "beforeEnding"]).optional(),
});

// ---- 角色 Schema ----
const characterSchema = z.object({
  id: z.string(),
  name: z.string(),
  shortName: z.string().optional(),
  fullName: z.string().optional(),
  defaultPortrait: z.string().optional(),
  portraits: z.record(z.string()),
});

// ---- 章节 Schema ----
const chapterSchema = z.object({
  id: z.string(),
  title: z.string(),
  year: z.number().int(),
  season: z.enum(["spring", "summer", "autumn", "winter", "prologue", "ending"]),
  location: z.string(),
  introSceneId: z.string(),
  journalSceneId: z.string().optional(),
});

// ---- 游戏状态 Schema ----
const gameStateSchema = z.object({
  currentSceneId: z.string(),
  chapterId: z.string(),
  stats: z.object({
    knowledge: statValue,
    wellbeing: statValue,
    responsibility: statValue,
    homesickness: statValue,
  }),
  preparationItems: z.object({
    route: prepValue,
    documents: prepValue,
    funds: prepValue,
    technicalMaterials: prepValue,
    contact: prepValue,
  }),
  trust: z.object({
    chen: statValue,
    nadya: statValue,
    belov: statValue,
    ivan: statValue,
  }),
  cooperationModifier: z.number().int(),
  returnTendency: z.number().int(),
  stayTendency: z.number().int(),
  flags: z.array(z.string()),
  lockedCriticalChoiceIds: z.array(z.string()),
  history: z.array(
    z.object({
      id: z.string(),
      sceneId: z.string(),
      type: z.enum(["text", "choice", "letter", "system"]),
      speakerName: z.string().optional(),
      text: z.string(),
      visibleEffects: z.array(z.string()).optional(),
      isCritical: z.boolean().optional(),
      isLocked: z.boolean().optional(),
      rollbackSnapshotId: z.string().optional(),
      createdAt: z.number(),
    })
  ),
  visitedSceneIds: z.array(z.string()),
});

// ---- 旅程回顾 Schema ----
const reviewItemRuleSchema = z.object({
  text: z.string(),
  conditions: conditionGroupSchema,
  priority: z.number().int(),
});

const journeyReviewRuleSchema = z.object({
  finalVisibleSummary: z.boolean(),
  takeItems: z.array(reviewItemRuleSchema),
  leaveItems: z.array(reviewItemRuleSchema),
  helpers: z.array(reviewItemRuleSchema),
  turningPoints: z.array(reviewItemRuleSchema),
  maxItemsPerSection: z.number().int().optional(),
});

// ---- 结局 Schema ----
const endingVariantSchema = z.object({
  id: z.string(),
  conditions: conditionGroupSchema,
  paragraphs: z.array(z.string()),
  journeyReview: journeyReviewRuleSchema,
});

const endingSchema = z.object({
  id: z.string(),
  title: z.string(),
  background: z.string(),
  bgm: z.string(),
  voice: z.string().optional(),
  variants: z.array(endingVariantSchema),
});

// ---- 设置 Schema ----
const settingsSchema = z.object({
  textSpeeds: z.object({
    slow: z.number().positive(),
    normal: z.number().positive(),
    fast: z.number().positive(),
  }),
  audioDefaults: z.object({
    bgmVolume: z.number().min(0).max(1),
    ambienceVolume: z.number().min(0).max(1),
    sfxVolume: z.number().min(0).max(1),
    voiceVolume: z.number().min(0).max(1),
    masterVolume: z.number().min(0).max(1),
  }),
});

// ---- 顶层 GameData Schema ----
export const gameDataSchema = z.object({
  meta: z.object({
    id: z.literal("snow-before-v1"),
    title: z.literal("雪落之前"),
    version: z.string(),
    startSceneId: z.string(),
    continueEnabled: z.boolean(),
    logicalWidth: z.literal(1920),
    logicalHeight: z.literal(1080),
    sceneHeight: z.literal(864),
    dialogueHeight: z.literal(216),
    topStatusHeight: z.literal(72),
  }),
  characters: z.record(characterSchema),
  initialState: gameStateSchema,
  chapters: z.array(chapterSchema),
  scenes: z.record(sceneSchema),
  endings: z.record(endingSchema),
  settings: settingsSchema,
});

// 导出类型
export type GameDataSchema = z.infer<typeof gameDataSchema>;

// 校验函数
export function validateGameData(
  data: unknown
): { success: true; data: GameDataSchema } | { success: false; error: string } {
  const result = gameDataSchema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  // 提取具体错误信息
  const errors = result.error.issues.map(
    (issue) => `[${issue.path.join(".")}] ${issue.message}`
  );
  return { success: false, error: errors.join("\n") };
}

export function validateGameDataOrThrow(data: unknown): GameDataSchema {
  return gameDataSchema.parse(data);
}
