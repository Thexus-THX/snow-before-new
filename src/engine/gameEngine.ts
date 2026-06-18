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
  ResolvedChoice,
  ChoiceAvailability,
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

  /** 获取场景中玩家可见且满足条件的选项（保留兼容） */
  getVisibleChoices(sceneId: string, state: GameState): ChoiceDefinition[] {
    const resolved = this.getResolvedChoices(sceneId, state);
    return resolved
      .filter((r) => r.availability === "available")
      .map((r) => r.choice);
  }

  /**
   * 获取场景中解析后的选项（三态：available / locked / hidden）
   *
   * 规则：
   * - 条件满足：available
   * - 条件不满足且 visibleWhenLocked === true：locked
   * - 条件不满足且未要求锁定可见：hidden
   *
   * choiceGroupId 去重规则：
   * 1. 同一 groupId 只返回一个版本
   * 2. 优先返回条件满足的（available）版本
   * 3. 若无满足版本但有 visibleWhenLocked 版本，只返回一个 locked 版本
   * 4. 结果按场景 choices 原始顺序排列，保证稳定
   */
  getResolvedChoices(sceneId: string, state: GameState): ResolvedChoice[] {
    const scene = this.getScene(sceneId);
    if (!scene?.choices) return [];

    // 场景级条件不满足时，所有选项都不可用
    const sceneConditionsMet = !scene.conditions || this.evaluateConditionGroup(scene.conditions, state);

    // Step 1: 为每个选项计算可用性
    const allResolved: ResolvedChoice[] = scene.choices.map((choice) => {
      const choiceConditionsMet = !choice.conditions || this.evaluateConditionGroup(choice.conditions, state);
      const isAvailable = sceneConditionsMet && choiceConditionsMet;

      let availability: ChoiceAvailability;
      let lockedHint: string | undefined;

      if (isAvailable) {
        availability = "available";
      } else if (choice.visibleWhenLocked) {
        availability = "locked";
        lockedHint = choice.lockedHint ?? "当前条件未满足";
      } else {
        availability = "hidden";
      }

      return { choice, availability, lockedHint };
    });

    // Step 2: 处理 choiceGroupId 去重
    // 收集所有有 groupId 的选项
    const groupMap = new Map<string, ResolvedChoice[]>();
    const noGroupChoices: ResolvedChoice[] = [];

    for (const resolved of allResolved) {
      if (resolved.choice.choiceGroupId) {
        const group = groupMap.get(resolved.choice.choiceGroupId) ?? [];
        group.push(resolved);
        groupMap.set(resolved.choice.choiceGroupId, group);
      } else {
        noGroupChoices.push(resolved);
      }
    }

    // Step 3: 每组只选一个代表
    const groupedResults: ResolvedChoice[] = [];
    for (const [, group] of groupMap) {
      // 优先选 available
      const available = group.find((r) => r.availability === "available");
      if (available) {
        groupedResults.push(available);

        // 开发环境：检测同组是否有多个 available（数据错误）
        if (import.meta.env.DEV) {
          const multiAvailable = group.filter((r) => r.availability === "available");
          if (multiAvailable.length > 1) {
            console.warn(
              `[GameEngine] choiceGroupId "${multiAvailable[0].choice.choiceGroupId}" 有 ${multiAvailable.length} 个同时满足的版本，仅保留第一个`,
              multiAvailable.map((r) => r.choice.id),
            );
          }
        }
        continue;
      }

      // 其次选 locked（visibleWhenLocked）
      const locked = group.find((r) => r.availability === "locked");
      if (locked) {
        groupedResults.push(locked);
        continue;
      }

      // 全是 hidden，不返回任何选项
    }

    // Step 4: 合并并按原始顺序排序
    // 构建原始顺序映射
    const orderMap = new Map<string, number>();
    scene.choices.forEach((c, i) => orderMap.set(c.id, i));

    const allResults = [...noGroupChoices, ...groupedResults]
      .filter((r) => r.availability !== "hidden")
      .sort((a, b) => {
        const orderA = orderMap.get(a.choice.id) ?? 999;
        const orderB = orderMap.get(b.choice.id) ?? 999;
        return orderA - orderB;
      });

    return allResults;
  }

  // ---- 原始数据访问（编辑器用） ----

  getGameData(): GameData {
    return this.data;
  }
}
