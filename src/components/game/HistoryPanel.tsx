import type { HistoryEntry } from "@/schemas/types";
import { useGameStore } from "@/app/stores/gameStore";

/**
 * HistoryPanel — 历史记录面板
 *
 * - 从右侧滑入的半透明面板
 * - 显示显性数值变化（不显示隐藏数值）
 * - 普通选择条目显示「可回退」按钮（由 store.canRollbackEntry 判定）
 * - 关键选择/锁定条目不可回退
 * - 不可跨越已确认关键选择回滚
 * - 回退时恢复完整快照并截断历史
 */
interface HistoryPanelProps {
  history: HistoryEntry[];
  onRollback: (entry: HistoryEntry) => void;
  onClose: () => void;
}

const typeLabel: Record<string, string> = {
  text: "对话",
  choice: "选择",
  letter: "家书",
  system: "旁白",
};

export default function HistoryPanel({ history, onRollback, onClose }: HistoryPanelProps) {
  const canRollbackEntry = useGameStore((s) => s.canRollbackEntry);

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        zIndex: 100,
        display: "flex",
        justifyContent: "flex-end",
      }}
    >
      {/* 半透明遮罩 */}
      <div
        onClick={onClose}
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(0,0,0,0.45)",
        }}
      />

      {/* 面板主体 */}
      <div
        style={{
          position: "relative",
          width: 480,
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: "rgba(20,17,13,0.96)",
          borderLeft: "1px solid #3a2818",
          padding: "24px 0",
        }}
      >
        {/* 标题栏 */}
        <div
          style={{
            padding: "0 24px 16px",
            borderBottom: "1px solid #3a2818",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <span
            style={{
              color: "var(--color-text-primary)",
              fontSize: 22,
              fontWeight: 600,
              letterSpacing: 2,
            }}
          >
            旅程记录
          </span>
          <button
            onClick={onClose}
            style={{
              color: "var(--color-text-dim)",
              fontSize: 18,
              cursor: "pointer",
              padding: "4px 12px",
            }}
          >
            ✕
          </button>
        </div>

        {/* 列表 */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "16px 24px",
            display: "flex",
            flexDirection: "column",
            gap: 16,
          }}
        >
          {history.length === 0 && (
            <p style={{ color: "var(--color-text-dim)", fontSize: 16, marginTop: 40, textAlign: "center" }}>
              尚无记录
            </p>
          )}
          {history.map((entry) => (
            <div
              key={entry.id}
              style={{
                padding: "12px 16px",
                background: "rgba(42,34,24,0.5)",
                borderRadius: "var(--border-radius-md)",
                border: "1px solid #2a2218",
              }}
            >
              {/* 类型标签 */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 6,
                }}
              >
                <span
                  style={{
                    fontSize: 12,
                    color: "var(--color-text-dim)",
                    letterSpacing: 1,
                  }}
                >
                  {typeLabel[entry.type] ?? entry.type}
                </span>
                {entry.isCritical && (
                  <span style={{ fontSize: 11, color: "var(--color-change-negative)" }}>
                    不可回退
                  </span>
                )}
                {entry.type === "choice" && !entry.isCritical && !entry.isLocked && !canRollbackEntry(entry).canRollback && (
                  <span style={{ fontSize: 11, color: "var(--color-text-dim)" }}>
                    {canRollbackEntry(entry).reason}
                  </span>
                )}
              </div>

              {/* 发言者 */}
              {entry.speakerName && (
                <span
                  style={{
                    color: "var(--color-text-amber)",
                    fontSize: 14,
                    fontWeight: 600,
                  }}
                >
                  {entry.speakerName}
                </span>
              )}

              {/* 文本 */}
              <p
                style={{
                  color: "var(--color-text-secondary)",
                  fontSize: 15,
                  lineHeight: 1.6,
                  margin: entry.speakerName ? "4px 0 0" : 0,
                }}
              >
                {entry.text}
              </p>

              {/* 显性效果 */}
              {entry.visibleEffects && entry.visibleEffects.length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 8 }}>
                  {entry.visibleEffects.map((eff, i) => (
                    <span
                      key={i}
                      style={{
                        fontSize: 13,
                        color: eff.includes("+") ? "var(--color-change-positive)" : "var(--color-change-negative)",
                        background: eff.includes("+")
                          ? "rgba(163,201,163,0.1)"
                          : "rgba(201,122,122,0.1)",
                        padding: "2px 8px",
                        borderRadius: "var(--border-radius-sm)",
                      }}
                    >
                      {eff}
                    </span>
                  ))}
                </div>
              )}

              {/* 回退按钮 */}
              {canRollbackEntry(entry).canRollback && (
                <button
                  onClick={() => onRollback(entry)}
                  style={{
                    marginTop: 10,
                    padding: "6px 16px",
                    fontSize: 13,
                    color: "var(--color-text-secondary)",
                    background: "rgba(106,96,80,0.2)",
                    border: "1px solid #4a4030",
                    borderRadius: "var(--border-radius-sm)",
                    cursor: "pointer",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "rgba(106,96,80,0.35)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "rgba(106,96,80,0.2)";
                  }}
                >
                  ↩ 回退至此
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
