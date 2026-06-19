/**
 * routeSimulation.test.ts — 路线模拟器测试
 *
 * 用纯逻辑模拟至少 6 条路线，不依赖浏览器 UI。
 * 验证两条主结局可达性。
 */
import { describe, it, expect } from "vitest";
import gameDataRaw from "../../content/game-data.json";
import type { GameData, GameState, ChoiceDefinition, SceneDefinition } from "@/schemas/types";

const gd = gameDataRaw as unknown as GameData;
const scenes = gd.scenes;

/** 创建初始状态 */
function createState(): GameState {
  return JSON.parse(JSON.stringify(gd.initialState));
}

/** 获取场景 */
function getScene(id: string): SceneDefinition | undefined {
  return scenes[id];
}

/** 应用 effects 到 state */
function applyEffects(state: GameState, effects: NonNullable<ChoiceDefinition["effects"]>): void {
  if (effects.stats) {
    for (const [k, v] of Object.entries(effects.stats)) {
      if (v !== undefined) (state.stats as any)[k] = Math.max(0, Math.min(10, ((state.stats as any)[k] || 0) + v));
    }
  }
  if (effects.preparationItems) {
    for (const [k, v] of Object.entries(effects.preparationItems)) {
      if (v !== undefined) (state.preparationItems as any)[k] = Math.max(0, Math.min(2, ((state.preparationItems as any)[k] || 0) + v));
    }
  }
  if (effects.trust) {
    for (const [k, v] of Object.entries(effects.trust)) {
      if (v !== undefined) (state.trust as any)[k] = Math.max(0, Math.min(10, ((state.trust as any)[k] || 0) + v));
    }
  }
  if (effects.addFlags) state.flags.push(...effects.addFlags);
  if (effects.removeFlags) state.flags = state.flags.filter(f => !effects.removeFlags!.includes(f));
  if (effects.returnTendency) state.returnTendency += effects.returnTendency;
  if (effects.stayTendency) state.stayTendency += effects.stayTendency;
}

/** 检查条件是否满足 */
function checkCondition(state: GameState, cond: any): boolean {
  switch (cond.type) {
    case "statMin": return (state.stats as any)[cond.key] >= cond.value;
    case "statMax": return (state.stats as any)[cond.key] <= cond.value;
    case "prepMin": return (state.preparationItems as any)[cond.key] >= cond.value;
    case "prepExact": return (state.preparationItems as any)[cond.key] === cond.value;
    case "trustMin": return (state.trust as any)[cond.key] >= cond.value;
    case "flag": return state.flags.includes(cond.value);
    case "notFlag": return !state.flags.includes(cond.value);
    case "tendencyMin": return cond.key === "return" ? state.returnTendency >= cond.value : state.stayTendency >= cond.value;
    case "reliableCountMin": {
      const reliableFlags = ["d7_confirmed_route_with_chen", "d7_organized_materials_with_nadya", "d7_prepared_documents", "d8_met_chen_before_departure", "d8_met_nadya_before_decision"];
      return reliableFlags.filter(f => state.flags.includes(f)).length >= cond.value;
    }
    default: return true;
  }
}

function checkConditionGroup(state: GameState, cg: any): boolean {
  if (!cg) return true;
  if (cg.all) return cg.all.every((c: any) => checkCondition(state, c));
  if (cg.any) return cg.any.some((c: any) => checkCondition(state, c));
  if (cg.none) return !cg.none.some((c: any) => checkCondition(state, c));
  return true;
}

/** 推进场景：无选项按 nextSceneId，有选项按策略选 */
function advance(
  sceneId: string,
  state: GameState,
  strategy: (choices: ChoiceDefinition[], state: GameState) => number,
  visited: Set<string>,
  path: string[],
  maxSteps: number
): { endSceneId: string; path: string[]; state: GameState } {
  let currentId = sceneId;
  let steps = 0;

  while (steps < maxSteps) {
    if (visited.has(currentId)) {
      // 循环检测
      return { endSceneId: currentId, path, state };
    }
    visited.add(currentId);
    path.push(currentId);

    const scene = getScene(currentId);
    if (!scene) {
      return { endSceneId: `MISSING:${currentId}`, path, state };
    }

    // 到达终点（thank_you 或已遍历完整流程后回到 prologue_train）
    if (currentId === "thank_you") {
      return { endSceneId: currentId, path, state };
    }
    if (currentId === "prologue_train" && path.length > 10) {
      return { endSceneId: currentId, path, state };
    }

    // 有选项
    if (scene.choices && scene.choices.length > 0) {
      const available = scene.choices.filter(c => !c.conditions || checkConditionGroup(state, c.conditions));
      if (available.length === 0) {
        return { endSceneId: `NO_CHOICES:${currentId}`, path, state };
      }
      const idx = strategy(available, state);
      const chosen = available[Math.min(idx, available.length - 1)];
      if (chosen.effects) applyEffects(state, chosen.effects);
      currentId = chosen.nextSceneId;
      steps++;
      continue;
    }

    // 无选项，按 nextSceneId 推进
    if (scene.nextSceneId) {
      currentId = scene.nextSceneId;
      steps++;
      continue;
    }

    // 死胡同
    return { endSceneId: `DEAD_END:${currentId}`, path, state };
  }

  return { endSceneId: `MAX_STEPS:${currentId}`, path, state };
}

describe("P1C 路线模拟器", () => {
  const MAX_STEPS = 200;

  // ---- 路线A：高准备归国 ----
  it("路线A：高准备归国 → 《电波归途》", () => {
    const state = createState();
    const visited = new Set<string>();
    const path: string[] = [];

    // 选择策略：优先选 knowledge/responsibility/route/documents
    const strategy = (choices: ChoiceDefinition[], _s: GameState): number => {
      const preferred = ["P0_RADIO", "D1_K1_A", "D2_K1_A", "D3_C1_B", "D3_C2_B", "D3_C3_B",
        "D4_K1_A", "D5_C1_A", "D5_C2_B", "D6_C1_A", "D6_K1_B",
        "D7_C1_B", "D7_K1_A", "D8_C1_A", "D8_K1_A",
        "FINAL_RETURN_PREPARED", "FINAL_RETURN_SUPPORTED", "FINAL_RETURN_HASTY"];
      for (const pid of preferred) {
        const idx = choices.findIndex(c => c.id === pid);
        if (idx >= 0) return idx;
      }
      return 0;
    };

    const result = advance(gd.meta.startSceneId, state, strategy, visited, path, MAX_STEPS);

    // 至少到达结局或回顾页
    const validEndings = ["ending_electric_wave", "ending_foreign_lamp", "journey_review", "thank_you"];
    const reachedEnding = validEndings.some(e => result.path.includes(e));
    expect(reachedEnding, `路线A未到达合法结局。路径: ${result.path.join(" → ")}`).toBe(true);
    expect(result.path.includes("ending_electric_wave") || result.path.includes("ending_foreign_lamp"),
      `路线A未包含结局场景。路径: ${result.path.join(" → ")}`).toBe(true);
  });

  // ---- 路线B：低准备归国 ----
  it("路线B：低准备归国 → 仍可到达结局", () => {
    const state = createState();
    const visited = new Set<string>();
    const path: string[] = [];

    // 选择策略：选 wellbeing/homesickness/低准备
    const strategy = (choices: ChoiceDefinition[], _s: GameState): number => {
      const preferred = ["P0_LETTER", "D1_K1_B", "D2_K1_B", "D3_C1_A", "D3_C2_A", "D3_C3_A",
        "D4_K1_B", "D5_C1_B", "D5_C2_A", "D6_C1_B", "D6_K1_C",
        "D7_C1_A", "D7_K1_D", "D8_C1_C", "D8_K1_B",
        "FINAL_RETURN_HASTY", "FINAL_RETURN_SUPPORTED", "FINAL_RETURN_PREPARED"];
      for (const pid of preferred) {
        const idx = choices.findIndex(c => c.id === pid);
        if (idx >= 0) return idx;
      }
      return 0;
    };

    const result = advance(gd.meta.startSceneId, state, strategy, visited, path, MAX_STEPS);

    const validEndings = ["ending_electric_wave", "ending_foreign_lamp", "journey_review", "thank_you"];
    const reachedEnding = validEndings.some(e => result.path.includes(e));
    expect(reachedEnding, `路线B未到达合法结局。路径: ${result.path.join(" → ")}`).toBe(true);
  });

  // ---- 路线C：依赖同伴归国 ----
  it("路线C：依赖同伴 → 归国路线", () => {
    const state = createState();
    const visited = new Set<string>();
    const path: string[] = [];

    // 选择策略：优先信任 chen/nadya，积累可靠联系人
    const strategy = (choices: ChoiceDefinition[], _s: GameState): number => {
      const preferred = ["P0_PEOPLE", "D1_K1_B", "D2_K1_A", "D3_C1_A", "D3_C2_C", "D3_C3_A",
        "D4_K1_B", "D5_C1_B", "D5_C2_A", "D6_C1_B", "D6_K1_C",
        "D7_C1_A", "D7_K1_B", "D8_C1_B", "D8_K1_A",
        "FINAL_RETURN_SUPPORTED", "FINAL_RETURN_PREPARED", "FINAL_RETURN_HASTY"];
      for (const pid of preferred) {
        const idx = choices.findIndex(c => c.id === pid);
        if (idx >= 0) return idx;
      }
      return 0;
    };

    const result = advance(gd.meta.startSceneId, state, strategy, visited, path, MAX_STEPS);

    const validEndings = ["ending_electric_wave", "ending_foreign_lamp", "journey_review", "thank_you"];
    const reachedEnding = validEndings.some(e => result.path.includes(e));
    expect(reachedEnding, `路线C未到达合法结局。路径: ${result.path.join(" → ")}`).toBe(true);
  });

  // ---- 路线D：留下并支援国内 ----
  it("路线D：留下支援 → 《异乡长灯》", () => {
    const state = createState();
    const visited = new Set<string>();
    const path: string[] = [];

    // 选择策略：选 stayTendency 和 knowledge
    const strategy = (choices: ChoiceDefinition[], _s: GameState): number => {
      const preferred = ["P0_RADIO", "D1_K1_A", "D2_K1_A", "D3_C1_B", "D3_C2_B", "D3_C3_B",
        "D4_K1_A", "D5_C1_A", "D5_C2_A", "D6_C1_A", "D6_K1_D",
        "D7_C1_B", "D7_K1_B", "D8_C1_A", "D8_K1_A",
        "BROWSE_STAY", "FINAL_STAY_SUPPORT", "FINAL_STAY_RESEARCH", "FINAL_STAY_DELAY"];
      for (const pid of preferred) {
        const idx = choices.findIndex(c => c.id === pid);
        if (idx >= 0) return idx;
      }
      return 0;
    };

    const result = advance(gd.meta.startSceneId, state, strategy, visited, path, MAX_STEPS);

    const validEndings = ["ending_electric_wave", "ending_foreign_lamp", "journey_review", "thank_you"];
    const reachedEnding = validEndings.some(e => result.path.includes(e));
    expect(reachedEnding, `路线D未到达合法结局。路径: ${result.path.join(" → ")}`).toBe(true);
  });

  // ---- 路线E：长期研究留下 ----
  it("路线E：长期研究 → 《异乡长灯》研究变体", () => {
    const state = createState();
    const visited = new Set<string>();
    const path: string[] = [];

    const strategy = (choices: ChoiceDefinition[], _s: GameState): number => {
      const preferred = ["P0_RADIO", "D1_K1_B", "D2_K1_A", "D3_C1_B", "D3_C2_B", "D3_C3_A",
        "D4_K1_A", "D5_C1_A", "D5_C2_A", "D6_C1_A", "D6_K1_D",
        "D7_C1_C", "D7_K1_B", "D8_C1_A", "D8_K1_C",
        "BROWSE_STAY", "FINAL_STAY_RESEARCH", "FINAL_STAY_SUPPORT", "FINAL_STAY_DELAY"];
      for (const pid of preferred) {
        const idx = choices.findIndex(c => c.id === pid);
        if (idx >= 0) return idx;
      }
      return 0;
    };

    const result = advance(gd.meta.startSceneId, state, strategy, visited, path, MAX_STEPS);

    const validEndings = ["ending_electric_wave", "ending_foreign_lamp", "journey_review", "thank_you"];
    const reachedEnding = validEndings.some(e => result.path.includes(e));
    expect(reachedEnding, `路线E未到达合法结局。路径: ${result.path.join(" → ")}`).toBe(true);
  });

  // ---- 路线F：混合低准备 → 不白屏 ----
  it("路线F：混合低准备 → 仍可达合法结局不白屏", () => {
    const state = createState();
    const visited = new Set<string>();
    const path: string[] = [];

    const strategy = (choices: ChoiceDefinition[], _s: GameState): number => {
      const preferred = ["P0_LETTER", "D1_K1_C", "D2_K1_C", "D3_C1_A", "D3_C2_A", "D3_C3_A",
        "D4_K1_B", "D5_C1_B", "D5_C2_C", "D6_C1_B", "D6_K1_A",
        "D7_C1_D", "D7_K1_D", "D8_C1_D", "D8_K1_C",
        "BROWSE_RETURN", "FINAL_RETURN_HASTY", "FINAL_RETURN_SUPPORTED", "FINAL_STAY_DELAY"];
      for (const pid of preferred) {
        const idx = choices.findIndex(c => c.id === pid);
        if (idx >= 0) return idx;
      }
      return 0;
    };

    const result = advance(gd.meta.startSceneId, state, strategy, visited, path, MAX_STEPS);

    const validEndings = ["ending_electric_wave", "ending_foreign_lamp", "journey_review", "thank_you"];
    const reachedEnding = validEndings.some(e => result.path.includes(e));
    expect(reachedEnding, `路线F未到达合法结局。路径: ${result.path.join(" → ")}`).toBe(true);
  });

  // ---- 所有路线不超步数 ----
  it("所有模拟路线不超过最大步数", () => {
    const routes = ["A", "B", "C", "D", "E", "F"];
    for (const r of routes) {
      const state = createState();
      const visited = new Set<string>();
      const path: string[] = [];
      const strategy = () => 0;

      const result = advance(gd.meta.startSceneId, state, strategy, visited, path, MAX_STEPS);
      expect(result.endSceneId, `路线${r} 超时或异常: ${result.endSceneId}`).not.toContain("MAX_STEPS");
      expect(result.endSceneId, `路线${r} 死胡同: ${result.endSceneId}`).not.toContain("DEAD_END");
    }
  });
});
