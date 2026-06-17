# 《雪落之前》V1 数据结构规范

## 一、总原则

- 所有剧情由 JSON 驱动。
- React 组件只负责渲染和交互。
- 所有数据导入时必须经过 Zod 校验。
- 场景 ID、选项 ID 和标记名必须唯一。
- 不允许在 JSON 中写函数。

---

## 二、GameData

```ts
interface GameData {
  meta: GameMeta;
  characters: Record<string, CharacterDefinition>;
  initialState: GameState;
  chapters: ChapterDefinition[];
  scenes: Record<string, SceneDefinition>;
  endings: Record<string, EndingDefinition>;
  settings: GameContentSettings;
}
```

---

## 三、元信息

```ts
interface GameMeta {
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
```

---

## 四、角色定义

```ts
interface CharacterDefinition {
  id: string;
  name: string;
  shortName?: string;
  fullName?: string;
  defaultPortrait?: string;
  portraits: Record<string, string>;
}
```

推荐角色 ID：

```text
shen
chen
nadya
belov
ivan
mother
father
lanying
narrator
```

---

## 五、游戏状态

```ts
interface GameState {
  currentSceneId: string;
  chapterId: string;

  stats: {
    knowledge: number;
    wellbeing: number;
    responsibility: number;
    homesickness: number;
  };

  preparationItems: {
    route: number;
    documents: number;
    funds: number;
    technicalMaterials: number;
    contact: number;
  };

  trust: {
    chen: number;
    nadya: number;
    belov: number;
    ivan: number;
  };

  cooperationModifier: number;
  returnTendency: number;
  stayTendency: number;
  flags: string[];
  lockedCriticalChoiceIds: string[];
  history: HistoryEntry[];
  visitedSceneIds: string[];
}
```

派生值：

```ts
preparation = sum(preparationItems)
baseTrust = round((chen + nadya + belov + ivan) / 4)
socialTrust = clamp(baseTrust + cooperationModifier, 0, 10)
```

所有长期值必须 clamp 到合法范围。

---

## 六、章节定义

```ts
interface ChapterDefinition {
  id: string;
  title: string;
  year: number;
  season: "spring" | "summer" | "autumn" | "winter" | "prologue" | "ending";
  location: string;
  introSceneId: string;
  journalSceneId?: string;
}
```

推荐章节 ID：

```text
prologue_1931
day01_spring_1936
day02_summer_1936
day03_autumn_1936
day04_winter_1936
day05_spring_1937
day06_summer_1937
day07_autumn_1937
day08_winter_1937
ending_1938
```

---

## 七、场景定义

```ts
type SceneTemplate =
  | "standardDialogue"
  | "freeLayout"
  | "letter"
  | "chapterIntro"
  | "historicalEvent"
  | "seasonJournal"
  | "ending";

interface SceneDefinition {
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
  autoSavePoint?: "chapterStart" | "criticalChoice" | "chapterEnd" | "beforeEnding";
  conditions?: ConditionGroup;
}
```

---

## 八、画布元素

```ts
type CanvasElement = ImageElement | TextElement;

interface BaseElement {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  opacity: number;
  zIndex: number;
  locked?: boolean;
}

interface ImageElement extends BaseElement {
  type: "image";
  asset: string;
  fit: "contain" | "cover";
}

interface TextElement extends BaseElement {
  type: "text";
  text: string;
  fontFamily: string;
  fontSize: number;
  lineHeight: number;
  align: "left" | "center" | "right";
  color: string;
  backgroundColor?: string;
}
```

坐标统一使用 1920×1080 逻辑坐标。

---

## 九、场景内容

```ts
interface SceneContent {
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
```

---

## 十、家书

```ts
interface LetterContent {
  date?: string;
  salutation?: string;
  pages: string[];
  postscript?: string;
  signature?: string;
  paperAsset: string;
  openSfx?: string;
  pageTurnSfx?: string;
  closeSfx?: string;
  historyPlainText: string;
}
```

规则：

- 120 字以内通常 1 页。
- 超过 120 字按自然段拆成 2—3 页。
- 不使用滚动条。

---

## 十一、历史事件页

```ts
interface HistoricalEventContent {
  date: string;
  title: string;
  imageAsset: string;
  paragraphs: string[];
  gameplayNotice?: string;
  sourceNote?: string;
}
```

`sourceNote` 可记录史料来源或“艺术化重构”。玩家端可暂不展示，但开发数据中保留。

---

## 十二、季节札记

```ts
interface SeasonJournalContent {
  visibleSummary: {
    knowledgeLabel: string;
    wellbeingLabel: string;
    preparationLabel: string;
  };
  journalText: string;
  keepsakes: string[];
}
```

同一章节可创建多个条件版本，通过场景条件决定显示哪一版。

---

## 十三、选项

```ts
interface ChoiceDefinition {
  id: string;
  text: string;
  isCritical: boolean;
  nextSceneId: string;

  effects?: EffectDefinition;
  conditions?: ConditionGroup;

  visibleWhenLocked?: boolean;
  lockedHint?: string;
  choiceGroupId?: string;

  confirmationText?: string;
  narrativeFeedback?: string;
}
```

关键选择默认确认文案：

> 这是一个关键选择，可能影响后续剧情、人物关系与结局。确认后，本周目将无法撤回这一决定。

按钮：

- 返回考虑。
- 确认选择。

---

## 十四、效果

```ts
interface EffectDefinition {
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
```

`preparation` 和 `socialTrust` 不允许直接写入，必须派生计算。

---

## 十五、条件

```ts
interface ConditionGroup {
  all?: Condition[];
  any?: Condition[];
  none?: Condition[];
}

type Condition =
  | { type: "statMin"; key: string; value: number }
  | { type: "statMax"; key: string; value: number }
  | { type: "prepMin"; key: string; value: number }
  | { type: "prepExact"; key: string; value: number }
  | { type: "trustMin"; key: string; value: number }
  | { type: "flag"; value: string }
  | { type: "notFlag"; value: string }
  | { type: "tendencyMin"; key: "return" | "stay"; value: number }
  | { type: "reliableCountMin"; value: number };
```

锁定提示不显示内部数字，使用 `lockedHint`。

---

## 十六、历史记录与回滚

```ts
interface HistoryEntry {
  id: string;
  sceneId: string;
  type: "text" | "choice" | "letter" | "system";
  speakerName?: string;
  text: string;
  visibleEffects?: string[];
  isCritical?: boolean;
  isLocked?: boolean;
  rollbackSnapshotId?: string;
  createdAt: number;
}
```

状态快照：

```ts
interface StateSnapshot {
  id: string;
  sceneId: string;
  state: GameState;
  createdAt: number;
}
```

普通选择创建可回滚快照。关键选择确认后不提供回滚入口。

---

## 十七、结局

```ts
interface EndingDefinition {
  id: string;
  title: string;
  background: string;
  bgm: string;
  voice?: string;
  variants: EndingVariant[];
}

interface EndingVariant {
  id: string;
  conditions: ConditionGroup;
  paragraphs: string[];
  journeyReview: JourneyReviewRule;
}
```

V1 结局 ID：

```text
ending_electric_wave_return
ending_foreign_lamp
```

未来预留：

```text
ending_lone_snow
ending_distant_spark
ending_late_return
```

---

## 十八、旅程回顾

```ts
interface JourneyReviewRule {
  finalVisibleSummary: boolean;
  takeItems: ReviewItemRule[];
  leaveItems: ReviewItemRule[];
  helpers: ReviewItemRule[];
  turningPoints: ReviewItemRule[];
  maxItemsPerSection?: number;
}

interface ReviewItemRule {
  text: string;
  conditions: ConditionGroup;
  priority: number;
}
```

每个区块只显示优先级最高的 3—5 条，不显示隐藏数值。

---

## 十九、示例场景

```json
{
  "id": "d1_lab_before_test",
  "name": "第一日·实验前",
  "chapterId": "day01_spring_1936",
  "template": "standardDialogue",
  "background": "/assets/backgrounds/bg_day01_spring_lab.webp",
  "bgm": "/assets/audio/bgm/bgm_02_spring_research.ogg",
  "ambience": "/assets/audio/ambience/amb_lab_hum_loop.ogg",
  "showTopStatusBar": true,
  "showDialoguePanel": true,
  "elements": [
    {
      "id": "nadya",
      "type": "image",
      "asset": "/assets/characters/char_nadya_neutral.webp",
      "x": 1220,
      "y": 120,
      "width": 520,
      "height": 720,
      "opacity": 1,
      "zIndex": 2,
      "locked": false,
      "fit": "contain"
    }
  ],
  "content": {
    "speakerId": "nadya",
    "speakerName": "娜佳",
    "textType": "dialogue",
    "text": "记录表里有一组数值不太对。你要先看设备，还是帮我再核一遍？",
    "portraitAsset": "/assets/characters/char_nadya_neutral.webp"
  },
  "choices": [
    {
      "id": "D1_C1_A",
      "text": "提前进入实验室，重新检查线路与线圈",
      "isCritical": false,
      "nextSceneId": "d1_lab_fault",
      "effects": {
        "stats": {
          "knowledge": 1
        },
        "addFlags": [
          "d1_prechecked_equipment"
        ]
      }
    },
    {
      "id": "D1_C1_B",
      "text": "留在准备室，帮娜佳核对实验记录",
      "isCritical": false,
      "nextSceneId": "d1_lab_fault",
      "effects": {
        "trust": {
          "nadya": 1
        },
        "addFlags": [
          "d1_checked_records_with_nadya"
        ]
      }
    }
  ]
}
```

---

## 二十、校验规则

导出前必须检查：

- 所有场景 ID 唯一。
- 所有选项 ID 唯一。
- 所有跳转场景存在。
- 所有章节入口存在。
- 所有背景、角色、UI 和音频路径符合规定目录。
- 所有数值变化为整数。
- 准备项不会超出 0—2。
- 长期数值和角色信任不会超出 0—10。
- 关键选择有确认文案。
- 锁定选项有 `lockedHint`。
- 家书页数为 1—3。
- 结局至少有一个可满足的变体。
