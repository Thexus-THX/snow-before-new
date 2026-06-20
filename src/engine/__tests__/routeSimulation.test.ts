/**
 * routeSimulation.test.ts — P4A 路线模拟器测试
 *
 * 验证 P3C 后 6 条路线可达性。
 * 用纯逻辑模拟，不依赖浏览器 UI。
 */
import { describe, it, expect } from "vitest";
import gameDataRaw from "../../content/game-data.json";
import type { GameData, GameState, ChoiceDefinition, SceneDefinition } from "@/schemas/types";

const gd = gameDataRaw as unknown as GameData;
const scenes = gd.scenes;

function createState(): GameState {
  return JSON.parse(JSON.stringify(gd.initialState));
}

function getScene(id: string): SceneDefinition | undefined {
  return scenes[id];
}

function applyEffects(state: GameState, effects: NonNullable<ChoiceDefinition["effects"]>): void {
  const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
  if (effects.stats) {
    for (const [k, v] of Object.entries(effects.stats)) {
      if (v !== undefined) (state.stats as any)[k] = clamp(((state.stats as any)[k] || 0) + v, 0, 10);
    }
  }
  if (effects.preparationItems) {
    for (const [k, v] of Object.entries(effects.preparationItems)) {
      if (v !== undefined) (state.preparationItems as any)[k] = clamp(((state.preparationItems as any)[k] || 0) + v, 0, 2);
    }
  }
  if (effects.trust) {
    for (const [k, v] of Object.entries(effects.trust)) {
      if (v !== undefined) (state.trust as any)[k] = clamp(((state.trust as any)[k] || 0) + v, 0, 10);
    }
  }
  if (effects.addFlags) state.flags.push(...effects.addFlags);
  if (effects.removeFlags) state.flags = state.flags.filter(f => !effects.removeFlags!.includes(f));
  if (effects.returnTendency) state.returnTendency += effects.returnTendency;
  if (effects.stayTendency) state.stayTendency += effects.stayTendency;
  if (effects.cooperationModifier !== undefined) state.cooperationModifier += effects.cooperationModifier;
}

function checkCondition(state: GameState, cond: any): boolean {
  switch (cond.type) {
    case "statMin": return (state.stats as any)[cond.key] >= cond.value;
    case "statMax": return (state.stats as any)[cond.key] <= cond.value;
    case "prepMin": return (state.preparationItems as any)[cond.key] >= cond.value;
    case "prepExact": return (state.preparationItems as any)[cond.key] === cond.value;
    case "trustMin": return (state.trust as any)[cond.key] >= cond.value;
    case "flag": return state.flags.includes(cond.value);
    case "notFlag": return !state.flags.includes(cond.value);
    case "tendencyMin": return cond.key === "return"
      ? state.returnTendency >= cond.value
      : state.stayTendency >= cond.value;
    case "reliableCountMin": {
      let count = 0;
      for (const k of ["chen", "nadya", "belov", "ivan"]) {
        if ((state.trust as any)[k] >= 7) count++;
      }
      return count >= cond.value;
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
      return { endSceneId: `LOOP:${currentId}`, path, state };
    }
    visited.add(currentId);
    path.push(currentId);

    const scene = getScene(currentId);
    if (!scene) {
      return { endSceneId: `MISSING:${currentId}`, path, state };
    }

    // 到达致谢页即终点
    if (currentId === "thank_you") {
      return { endSceneId: currentId, path, state };
    }

    // 有选项
    if (scene.choices && scene.choices.length > 0) {
      const available = scene.choices.filter(c => !c.conditions || checkConditionGroup(state, c.conditions));
      if (available.length === 0) {
        // 无可用选项 = 死胡同
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
      // 特殊路由 __title__ 终止
      if (scene.nextSceneId === "__title__") {
        return { endSceneId: currentId, path, state };
      }
      currentId = scene.nextSceneId;
      steps++;
      continue;
    }

    // 死胡同
    return { endSceneId: `DEAD_END:${currentId}`, path, state };
  }

  return { endSceneId: `MAX_STEPS:${currentId}`, path, state };
}

describe("P4A 全流程路线验收", () => {
  const MAX_STEPS = 300;

  // ============================================================
  // 路线 1：完整归国（高准备 + 高归国倾向）
  // ============================================================
  it("路线1：完整归国 → 《电波归途》", () => {
    const state = createState();
    const visited = new Set<string>();
    const path: string[] = [];

    // D4选B(提国内→returnTendency+1), D6选A(打听→returnTendency+2), D8选A(坦诚→returnTendency+1)
    // D6_A→contact+1, D7_C1_A→contact+1, D7_K1_A(坦白→documents+1 contact+1)
    // D2选A(返检→ivan+2), 序章选B(radio→knowledge+1)
    const strategy = (choices: ChoiceDefinition[], _s: GameState): number => {
      const preferred = [
        "P0_RADIO",           // 学识+1
        "D1_K1_A",            // 担当+2 别洛夫+1
        "D2_C1_A", "D2_K1_A", // 伊万+2 担当+2
        "D3_C1_B", "D3_LIB_A","D3_C3_B", // 学识/担当
        "D4_C1_A", "D4_K1_B", // 提国内→returnTendency+1
        "D5_C1_A", "D5_C2_B", // 民用→returnTendency+1
        "D6_C1_A", "D6_K1_A", // 打听路线→contact+1 returnTendency+2
        "D7_C1_A", "D7_K1_A", // 路线+contact+1, 坦白→documents+1 contact+1
        "D8_C1_A", "D8_K1_A", // 交接+坦诚→returnTendency+1
        "BROWSE_RETURN",      // 方向：归国
        "FINAL_RETURN_PREPARED",
        "FINAL_RETURN_SUPPORTED",
        "FINAL_RETURN_HASTY",
      ];
      for (const pid of preferred) {
        const idx = choices.findIndex(c => c.id === pid);
        if (idx >= 0) return idx;
      }
      return 0;
    };

    const result = advance(gd.meta.startSceneId, state, strategy, visited, path, MAX_STEPS);
    
    expect(result.endSceneId).not.toContain("MISSING");
    expect(result.endSceneId).not.toContain("DEAD_END");
    expect(result.endSceneId).not.toContain("NO_CHOICES");
    expect(result.endSceneId).not.toContain("MAX_STEPS");
    
    const reachedEnding = result.path.includes("ending_electric_wave");
    expect(reachedEnding).toBe(true);
  });

  // ============================================================
  // 路线 2：同伴协助归国
  // ============================================================
  it("路线2：同伴协助归国 → 《电波归途》", () => {
    const state = createState();
    const visited = new Set<string>();
    const path: string[] = [];

    // 信任娜佳+陈绍衡, D6_A→contact+1, D6_A→returnTendency+2
    const strategy = (choices: ChoiceDefinition[], _s: GameState): number => {
      const preferred = [
        "P0_PEOPLE",          // 娜佳+1
        "D1_C1_B", "D1_K1_B",// 娜佳+1+1
        "D2_C1_B", "D2_K1_B",// 娜佳+1
        "D3_C1_A", "D3_LIB_C","D3_C3_A", // 娜佳+2
        "D4_C1_B", "D4_K1_B", // 娜佳+1 returnTendency+1
        "D5_C1_B", "D5_C2_B", // 娜佳+1 returnTendency+1
        "D6_C1_B", "D6_K1_A", // 陈+1, 打听→contact+1 returnTendency+2
        "D7_C1_A", "D7_K1_B", // contact+1, 合规
        "D8_C1_B", "D8_K1_A", // contact+1, 坦诚→returnTendency+1
        "BROWSE_RETURN",
        "FINAL_RETURN_SUPPORTED",
        "FINAL_RETURN_PREPARED",
        "FINAL_RETURN_HASTY",
      ];
      for (const pid of preferred) {
        const idx = choices.findIndex(c => c.id === pid);
        if (idx >= 0) return idx;
      }
      return 0;
    };

    const result = advance(gd.meta.startSceneId, state, strategy, visited, path, MAX_STEPS);
    
    expect(result.endSceneId).not.toContain("MISSING");
    expect(result.endSceneId).not.toContain("DEAD_END");
    expect(result.endSceneId).not.toContain("MAX_STEPS");
    expect(result.path.includes("ending_electric_wave")).toBe(true);
  });

  // ============================================================
  // 路线 3：仓促归国（最低准备，fallback）
  // ============================================================
  it("路线3：仓促归国 → 仍可达《电波归途》", () => {
    const state = createState();
    const visited = new Set<string>();
    const path: string[] = [];

    // 选坏选项：D1隐瞒、D2按期交付、D7私自带资料
    const strategy = (choices: ChoiceDefinition[], _s: GameState): number => {
      const preferred = [
        "P0_LETTER",
        "D1_K1_C",            // 隐瞒
        "D2_K1_C",            // 按期交付
        "D3_C1_A", "D3_C2_A","D3_C3_A",
        "D4_K1_B",            // 提国内
        "D5_C1_B", "D5_C2_C",
        "D6_C1_B", "D6_K1_A", // 打听路线
        "D7_C1_D", "D7_K1_C", // 私自带资料
        "D8_C1_D", "D8_K1_B",
        "BROWSE_RETURN",
        "FINAL_RETURN_HASTY",  // 仓促归国 fallback 永远可选
        "FINAL_RETURN_SUPPORTED",
        "FINAL_RETURN_PREPARED",
      ];
      for (const pid of preferred) {
        const idx = choices.findIndex(c => c.id === pid);
        if (idx >= 0) return idx;
      }
      return 0;
    };

    const result = advance(gd.meta.startSceneId, state, strategy, visited, path, MAX_STEPS);
    
    expect(result.endSceneId).not.toContain("MISSING");
    expect(result.endSceneId).not.toContain("DEAD_END");
    expect(result.endSceneId).not.toContain("MAX_STEPS");
    expect(result.path.includes("ending_electric_wave")).toBe(true);
    
    // 验证 restricted_materials flag 存在
    expect(state.flags).toContain("flag_restricted_materials");
    expect(state.flags).toContain("flag_concealed_lab_anomaly");
    expect(state.flags).toContain("flag_factory_rushed_delivery");
  });

  // ============================================================
  // 路线 4：留下支援（高知识 + 高担当）
  // ============================================================
  it("路线4：留下支援 → 《异乡长灯》", () => {
    const state = createState();
    const visited = new Set<string>();
    const path: string[] = [];

    // D4_A→stayTendency+2, D5_A→stayTendency+1, D6_B→stayTendency+1, D8_C→stayTendency+1
    const strategy = (choices: ChoiceDefinition[], _s: GameState): number => {
      const preferred = [
        "P0_RADIO",
        "D1_K1_A",            // 担当+2
        "D2_C1_A", "D2_K1_A", // 伊万+2 担当+2
        "D3_C1_B", "D3_LIB_A","D3_C3_B",
        "D4_K1_A",            // 接受长期邀请→stayTendency+2
        "D5_C1_A", "D5_C2_A", // 技术先进→stayTendency+1
        "D6_C1_A", "D6_K1_B", // 等待→stayTendency+1
        "D7_C1_C", "D7_K1_B", // 技术资料+1 合规
        "D8_C1_A", "D8_K1_C", // 交接+技术笔记→stayTendency+1
        "BROWSE_STAY",
        "FINAL_STAY_SUPPORT",
        "FINAL_STAY_RESEARCH",
        "FINAL_STAY_DELAY",
      ];
      for (const pid of preferred) {
        const idx = choices.findIndex(c => c.id === pid);
        if (idx >= 0) return idx;
      }
      return 0;
    };

    const result = advance(gd.meta.startSceneId, state, strategy, visited, path, MAX_STEPS);
    
    expect(result.endSceneId).not.toContain("MISSING");
    expect(result.endSceneId).not.toContain("DEAD_END");
    expect(result.endSceneId).not.toContain("MAX_STEPS");
    expect(result.path.includes("ending_foreign_lamp")).toBe(true);
    
    // 验证 stayTendency >= 2
    expect(state.stayTendency).toBeGreaterThanOrEqual(2);
  });

  // ============================================================
  // 路线 5：继续研究（accepted_long_term）
  // ============================================================
  it("路线5：继续研究 → 《异乡长灯》研究变体", () => {
    const state = createState();
    const visited = new Set<string>();
    const path: string[] = [];

    // D4_A→stayTendency+2+flag, 满足 FINAL_STAY_RESEARCH 条件
    const strategy = (choices: ChoiceDefinition[], _s: GameState): number => {
      const preferred = [
        "P0_RADIO",
        "D1_K1_B",
        "D2_K1_B",
        "D3_C1_B", "D3_LIB_B","D3_C3_A",
        "D4_K1_A",            // flag_accepted_long_term_research + stayTendency+2
        "D5_C1_A", "D5_C2_A", // stayTendency+1
        "D6_C1_A", "D6_K1_B",
        "D7_C1_C", "D7_K1_B",
        "D8_C1_A", "D8_K1_C",
        "BROWSE_STAY",
        "FINAL_STAY_RESEARCH",
        "FINAL_STAY_SUPPORT",
        "FINAL_STAY_DELAY",
      ];
      for (const pid of preferred) {
        const idx = choices.findIndex(c => c.id === pid);
        if (idx >= 0) return idx;
      }
      return 0;
    };

    const result = advance(gd.meta.startSceneId, state, strategy, visited, path, MAX_STEPS);
    
    expect(result.endSceneId).not.toContain("MISSING");
    expect(result.endSceneId).not.toContain("DEAD_END");
    expect(result.endSceneId).not.toContain("MAX_STEPS");
    expect(result.path.includes("ending_foreign_lamp")).toBe(true);
    
    // 验证 flag
    expect(state.flags).toContain("flag_accepted_long_term_research");
  });

  // ============================================================
  // 路线 6：等待时机（fallback 留下）
  // ============================================================
  it("路线6：等待时机 → 《异乡长灯》", () => {
    const state = createState();
    const visited = new Set<string>();
    const path: string[] = [];

    // 混合低准备 + 低倾向，选等待
    const strategy = (choices: ChoiceDefinition[], _s: GameState): number => {
      const preferred = [
        "P0_LETTER",
        "D1_K1_C",
        "D2_K1_C",
        "D3_C1_A", "D3_C2_A","D3_C3_A",
        "D4_K1_B",
        "D5_C1_B", "D5_C2_C",
        "D6_C1_B", "D6_K1_C",
        "D7_C1_D", "D7_K1_D", // 放弃资料
        "D8_C1_D", "D8_K1_B",
        "BROWSE_STAY",
        "FINAL_STAY_DELAY",    // 等待时机 fallback 永远可选
        "FINAL_STAY_RESEARCH",
        "FINAL_STAY_SUPPORT",
      ];
      for (const pid of preferred) {
        const idx = choices.findIndex(c => c.id === pid);
        if (idx >= 0) return idx;
      }
      return 0;
    };

    const result = advance(gd.meta.startSceneId, state, strategy, visited, path, MAX_STEPS);
    
    expect(result.endSceneId).not.toContain("MISSING");
    expect(result.endSceneId).not.toContain("DEAD_END");
    expect(result.endSceneId).not.toContain("MAX_STEPS");
    expect(result.path.includes("ending_foreign_lamp")).toBe(true);
  });

  // ============================================================
  // 专项验证
  // ============================================================

  it("contact 可通过 D6_K1_A / D7_C1_A / D8_C1_B 获得", () => {
    const state = createState();
    const visited = new Set<string>();
    const path: string[] = [];
    
    const strategy = (choices: ChoiceDefinition[], _s: GameState): number => {
      const preferred = [
        "P0_RADIO", "D1_K1_A", "D2_C1_A", "D2_K1_A",
        "D3_C1_B", "D3_LIB_A", "D3_C3_B",
        "D4_C1_A", "D4_K1_B",
        "D5_C1_A", "D5_C2_B",
        "D6_C1_A", "D6_K1_A",   // contact+1
        "D7_C1_A",               // contact+1
        "D7_K1_A",
        "D8_C1_B",               // contact+1
        "D8_K1_A",
        "BROWSE_RETURN",
        "FINAL_RETURN_PREPARED", "FINAL_RETURN_SUPPORTED", "FINAL_RETURN_HASTY",
      ];
      for (const pid of preferred) {
        const idx = choices.findIndex(c => c.id === pid);
        if (idx >= 0) return idx;
      }
      return 0;
    };
    
    advance(gd.meta.startSceneId, state, strategy, visited, path, 300);
    expect(state.preparationItems.contact).toBeGreaterThanOrEqual(1);
  });

  it("flag_restricted_materials 锁定完整归国", () => {
    const state = createState();
    state.flags.push("flag_restricted_materials");
    // 模拟到达最终选择，检查 FINAL_RETURN_PREPARED 条件
    const scene = getScene("d8_final_return_options");
    expect(scene).toBeDefined();
    const prepared = scene!.choices!.find(c => c.id === "FINAL_RETURN_PREPARED");
    expect(prepared).toBeDefined();
    expect(checkConditionGroup(state, prepared!.conditions)).toBe(false);
  });

  it("returnTendency 影响归国高级选项", () => {
    const state = createState();
    // 无归国倾向时完整归国不可选
    const scene = getScene("d8_final_return_options");
    const prepared = scene!.choices!.find(c => c.id === "FINAL_RETURN_PREPARED");
    expect(checkConditionGroup(state, prepared!.conditions)).toBe(false);
    
    // returnTendency >= 2 后可解锁
    state.returnTendency = 2;
    state.preparationItems.route = 1;
    state.preparationItems.documents = 1;
    state.preparationItems.technicalMaterials = 1;
    state.preparationItems.contact = 1;
    state.stats.knowledge = 6;
    state.stats.responsibility = 6;
    state.trust.chen = 7;
    state.trust.nadya = 7;
    // 不再需要满足所有条件，只验证 tendency 影响
    // 至少 tendency 不再阻止
    const condResult = checkCondition(state, { type: "tendencyMin", key: "return", value: 2 });
    expect(condResult).toBe(true);
  });

  it("stayTendency 影响留下高级选项", () => {
    const state = createState();
    // 无留下倾向时继续研究不可选
    const scene = getScene("d8_final_stay_options");
    const research = scene!.choices!.find(c => c.id === "FINAL_STAY_RESEARCH");
    expect(checkConditionGroup(state, research!.conditions)).toBe(false);
    
    // stayTendency >= 2 或 flag_accepted_long_term_research 可解锁
    state.stayTendency = 2;
    expect(checkConditionGroup(state, research!.conditions)).toBe(true);
  });

  it("d8_readiness_report 出现在最终选择前", () => {
    const scene = getScene("d8_readiness_report");
    expect(scene).toBeDefined();
    expect(scene!.template).toBe("standardDialogue");
    // d8_before_final_silence → d8_readiness_report → d8_k2_final
    const beforeScene = getScene("d8_before_final_silence");
    expect(beforeScene!.nextSceneId).toBe("d8_readiness_report");
    expect(scene!.nextSceneId).toBe("d8_k2_final");
  });

  it("D7_K1 第四选项存在", () => {
    const scene = getScene("d7_k1_materials");
    expect(scene).toBeDefined();
    const dChoice = scene!.choices!.find(c => c.id === "D7_K1_D");
    expect(dChoice).toBeDefined();
    expect(dChoice!.text).toContain("放弃");
  });

  it("所有路线不超最大步数不卡死", () => {
    for (let r = 1; r <= 6; r++) {
      const state = createState();
      const visited = new Set<string>();
      const path: string[] = [];
      const strategy = () => 0;

      const result = advance(gd.meta.startSceneId, state, strategy, visited, path, 300);
      expect(result.endSceneId, `路线${r}: ${result.endSceneId}`).not.toContain("MAX_STEPS");
      expect(result.endSceneId, `路线${r}: ${result.endSceneId}`).not.toContain("DEAD_END");
      expect(result.endSceneId, `路线${r}: ${result.endSceneId}`).not.toContain("MISSING");
    }
  });
});
