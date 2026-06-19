import type { GameState, ChapterDefinition } from "@/schemas/types";
import { GameEngine } from "@/engine/gameEngine";

/**
 * StatusBar — 顶部 72px 状态栏
 *
 * 左侧：年份·季节 | 地点 | 章节名
 * 右侧：学识 | 身心 | 行动准备
 */
interface StatusBarProps {
  state: GameState;
  chapter: ChapterDefinition;
  engine: GameEngine;
}

export default function StatusBar({ state, chapter, engine }: StatusBarProps) {
  const seasonText = engine.seasonLabel(chapter.season);
  const yearText = chapter.season === "prologue" ? "" : `${chapter.year} 年`;
  const labelLeft = yearText ? `${yearText} · ${seasonText}` : seasonText;
  const prepSum =
    state.preparationItems.route +
    state.preparationItems.documents +
    state.preparationItems.funds +
    state.preparationItems.technicalMaterials +
    state.preparationItems.contact;

  return (
    <div
      style={{
        width: "100%",
        height: "var(--top-status-height)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 40px",
        background: "url(/assets/ui/ui_top_status_bar_transparent.png) center/100% 100% no-repeat #1c1612",
        borderBottom: "2px solid #3a2818",
        fontSize: "var(--font-size-status)",
        color: "var(--color-text-secondary)",
        flexShrink: 0,
      }}
    >
      {/* 左侧信息 */}
      <div style={{ display: "flex", gap: 24 }}>
        <span style={{ color: "var(--color-text-amber)", fontWeight: 600, letterSpacing: 1 }}>
          {labelLeft}
        </span>
        <span style={{ opacity: 0.7 }}>{chapter.location}</span>
        <span style={{ opacity: 0.7 }}>{chapter.title}</span>
      </div>

      {/* 右侧数值 */}
      <div style={{ display: "flex", gap: 24 }}>
        <span style={{ color: "var(--color-knowledge)", fontWeight: 500 }}>
          学识 {state.stats.knowledge}
        </span>
        <span style={{ color: "var(--color-wellbeing)", fontWeight: 500 }}>
          身心 {state.stats.wellbeing}
        </span>
        <span style={{ color: "var(--color-preparation)", fontWeight: 500 }}>
          行动准备 {prepSum}
        </span>
      </div>
    </div>
  );
}
