import { useState } from "react";
import { useNavigate } from "react-router-dom";
import type { GameState, ChapterDefinition } from "@/schemas/types";
import { GameEngine } from "@/engine/gameEngine";

/**
 * StatusBar — 顶部 72px 状态栏
 *
 * 左侧：年份·季节 | 地点 | 章节名
 * 右侧：学识 | 身心 | 行动准备 | 设置 | 标题
 */
interface StatusBarProps {
  state: GameState;
  chapter: ChapterDefinition;
  engine: GameEngine;
}

export default function StatusBar({ state, chapter, engine }: StatusBarProps) {
  const navigate = useNavigate();
  const [showTitleConfirm, setShowTitleConfirm] = useState(false);
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
        background: "#1c1612",
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

      {/* 右侧数值 + 按钮 */}
      <div style={{ display: "flex", gap: 20, alignItems: "center" }}>
        <span style={{ color: "var(--color-knowledge)", fontWeight: 500 }}>
          学识 {state.stats.knowledge}
        </span>
        <span style={{ color: "var(--color-wellbeing)", fontWeight: 500 }}>
          身心 {state.stats.wellbeing}
        </span>
        <span style={{ color: "var(--color-preparation)", fontWeight: 500 }}>
          行动准备 {prepSum}
        </span>

        {/* 分隔 */}
        <span style={{ color: "var(--color-text-dim)", opacity: 0.3, fontSize: 18, lineHeight: 1 }}>│</span>

        {/* 设置按钮 */}
        <button
          onClick={() => navigate("/settings?from=game")}
          title="设置"
          style={{
            background: "none",
            border: "1px solid rgba(180,160,140,0.25)",
            borderRadius: 4,
            color: "var(--color-text-dim)",
            fontSize: 13,
            padding: "4px 10px",
            cursor: "pointer",
            letterSpacing: 1,
            transition: "all 0.2s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = "rgba(180,160,140,0.6)";
            e.currentTarget.style.color = "var(--color-text-secondary)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = "rgba(180,160,140,0.25)";
            e.currentTarget.style.color = "var(--color-text-dim)";
          }}
        >
          设置
        </button>

        {/* 标题按钮 */}
        <button
          onClick={() => setShowTitleConfirm(true)}
          title="返回标题"
          style={{
            background: "none",
            border: "1px solid rgba(180,160,140,0.25)",
            borderRadius: 4,
            color: "var(--color-text-dim)",
            fontSize: 13,
            padding: "4px 10px",
            cursor: "pointer",
            letterSpacing: 1,
            transition: "all 0.2s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = "rgba(180,160,140,0.6)";
            e.currentTarget.style.color = "var(--color-text-secondary)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = "rgba(180,160,140,0.25)";
            e.currentTarget.style.color = "var(--color-text-dim)";
          }}
        >
          标题
        </button>
      </div>

      {/* 返回标题确认弹窗 */}
      {showTitleConfirm && (
        <div
          onClick={() => setShowTitleConfirm(false)}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 100,
            background: "rgba(0,0,0,0.75)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: 380,
              padding: "28px 32px",
              borderRadius: 4,
              border: "1.5px solid #3a2818",
              background: "#14100c",
              boxShadow: "0 12px 48px rgba(0,0,0,0.7)",
              display: "flex",
              flexDirection: "column",
              gap: 20,
              alignItems: "center",
            }}
          >
            <p style={{
              margin: 0,
              fontSize: 15,
              color: "#c8b898",
              lineHeight: 1.8,
              textAlign: "center",
              letterSpacing: 1,
            }}>
              确定返回标题页？<br />
              <span style={{ fontSize: 13, color: "#8a7060" }}>未保存的进度将丢失</span>
            </p>
            <div style={{ display: "flex", gap: 16 }}>
              <button
                onClick={() => setShowTitleConfirm(false)}
                style={{
                  padding: "8px 28px",
                  border: "1px solid #5a5040",
                  borderRadius: 4,
                  background: "rgba(42, 34, 24, 0.5)",
                  color: "#b8a88c",
                  cursor: "pointer",
                  fontSize: 14,
                }}
              >
                取消
              </button>
              <button
                onClick={() => navigate("/")}
                style={{
                  padding: "8px 28px",
                  border: "1px solid #8a4030",
                  borderRadius: 4,
                  background: "rgba(80, 32, 32, 0.35)",
                  color: "#d47a68",
                  cursor: "pointer",
                  fontSize: 14,
                }}
              >
                确定
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
