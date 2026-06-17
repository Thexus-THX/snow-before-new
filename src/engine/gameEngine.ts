import type {
  GameData,
  GameState,
  SceneDefinition,
  CharacterDefinition,
  ChapterDefinition,
  SeasonLabel,
  ConditionGroup,
  Condition,
  ChoiceDefinition,
} from "@/schemas/types";

/**
 * GameEngine — 游戏数据访问与条件评估层
 *
 * 职责：
 * - 持有 GameData，提供场景/角色/章节查找
 * - 条件判定（阶段 4）
 * - 不负责状态管理（由 gameStore 负责）
 */
export class GameEngine {
  private data: GameData;

  constructor(data: GameData) {
    this.data = data;
  }

  // ---- 场景 ----

  getScene(sceneId: string): SceneDefinition | null {
    return this.data.scenes[sceneId] ?? null;
  }

  getStartScene(): SceneDefinition {
    return this.data.scenes[this.data.meta.startSceneId];
  }

  getAllSceneIds(): string[] {
    return Object.keys(this.data.scenes);
  }

  // ---- 角色 ----

  getCharacter(charId: string): CharacterDefinition | null {
    return this.data.characters[charId] ?? null;
  }

  // ---- 章节 ----

  getChapter(chapterId: string): ChapterDefinition | null {
    return this.data.chapters.find((ch) => ch.id === chapterId) ?? null;
  }

  getChapterForScene(sceneId: string): ChapterDefinition | null {
    const scene = this.getScene(sceneId);
    if (!scene) return null;
    return this.getChapter(scene.chapterId);
  }

  // ---- 季节标签 ----

  seasonLabel(season: SeasonLabel): string {
    const map: Record<SeasonLabel, string> = {
      spring: "春",
      summer: "夏",
      autumn: "秋",
      winter: "冬",
      prologue: "序章",
      ending: "终章",
    };
    return map[season];
  }

  // ---- 条件评估 ----

  evaluateConditionGroup(group: ConditionGroup, state: GameState): boolean {
    // 如果没有条件，默认满足
    const hasAll = group.all && group.all.length > 0;
    const hasAny = group.any && group.any.length > 0;
    const hasNone = group.none && group.none.length > 0;
    if (!hasAll && !hasAny && !hasNone) return true;

    const allResult = hasAll ? group.all!.every((c) => this.evaluateCondition(c, state)) : true;
    const anyResult = hasAny ? group.any!.some((c) => this.evaluateCondition(c, state)) : true;
    const noneResult = hasNone ? group.none!.every((c) => !this.evaluateCondition(c, state)) : true;

    return allResult && anyResult && noneResult;
  }

  private evaluateCondition(condition: Condition, state: GameState): boolean {
    switch (condition.type) {
      case "statMin":
        return this.getStat(state, condition.key) >= condition.value;
      case "statMax":
        return this.getStat(state, condition.key) <= condition.value;
      case "prepMin":
        return this.getPrepItem(state, condition.key) >= condition.value;
      case "prepExact":
        return this.getPrepItem(state, condition.key) === condition.value;
      case "trustMin":
        return this.getTrust(state, condition.key) >= condition.value;
      case "flag":
        return state.flags.includes(condition.value);
      case "notFlag":
        return !state.flags.includes(condition.value);
      case "tendencyMin":
        return condition.key === "return"
          ? state.returnTendency >= condition.value
          : state.stayTendency >= condition.value;
      case "reliableCountMin":
        return this.getReliableCount(state) >= condition.value;
      default:
        return false;
    }
  }

  private getStat(state: GameState, key: string): number {
    const map: Record<string, number> = {
      knowledge: state.stats.knowledge,
      wellbeing: state.stats.wellbeing,
      responsibility: state.stats.responsibility,
      homesickness: state.stats.homesickness,
    };
    return map[key] ?? 0;
  }

  private getPrepItem(state: GameState, key: string): number {
    const map: Record<string, number> = {
      route: state.preparationItems.route,
      documents: state.preparationItems.documents,
      funds: state.preparationItems.funds,
      technicalMaterials: state.preparationItems.technicalMaterials,
      contact: state.preparationItems.contact,
    };
    return map[key] ?? 0;
  }

  private getTrust(state: GameState, key: string): number {
    const map: Record<string, number> = {
      chen: state.trust.chen,
      nadya: state.trust.nadya,
      belov: state.trust.belov,
      ivan: state.trust.ivan,
    };
    return map[key] ?? 0;
  }

  private getReliableCount(state: GameState): number {
    return [state.trust.chen, state.trust.nadya, state.trust.belov, state.trust.ivan].filter(
      (v) => v >= 7
    ).length;
  }

  // ---- 选项可见性 ----

  /** 获取场景中玩家可见且满足条件的选项 */
  getVisibleChoices(sceneId: string, state: GameState): ChoiceDefinition[] {
    const scene = this.getScene(sceneId);
    if (!scene?.choices) return [];

    return scene.choices.filter((choice) => {
      // 场景级条件
      if (scene.conditions && !this.evaluateConditionGroup(scene.conditions, state)) {
        return false;
      }
      // 选项级条件
      if (choice.conditions && !this.evaluateConditionGroup(choice.conditions, state)) {
        return false;
      }
      return true;
    });
  }

  // ---- 原始数据访问（编辑器用） ----

  getGameData(): GameData {
    return this.data;
  }
}
