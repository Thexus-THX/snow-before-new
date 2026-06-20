import type { ChoiceDefinition, ResolvedChoice } from "@/schemas/types";

/**
 * ChoicePanel — 选项渲染区
 *
 * - 普通选项（available）：正常显示，点击直接生效
 * - 关键选项：带【关键选择】标记，需二次确认
 * - 锁定选项（locked）：灰色显示、不可点击、显示 lockedHint
 * - 隐藏选项（hidden）：不渲染（由 GameEngine.getResolvedChoices 过滤）
 */
interface ChoicePanelProps {
  choices: ResolvedChoice[];
  onSelect: (choice: ChoiceDefinition) => void;
  pendingConfirm?: ChoiceDefinition | null;
  onConfirm: (choice: ChoiceDefinition) => void;
  onCancelConfirm: () => void;
  error?: string | null;
}

export default function ChoicePanel({
  choices,
  onSelect,
  pendingConfirm,
  onConfirm,
  onCancelConfirm,
  error,
}: ChoicePanelProps) {
  // 如果正在等待二次确认，显示确认对话框
  if (pendingConfirm) {
    return (
      <div className="choicePanel" style={{ alignItems: "center", gap: 24 }}>

        {/* 确认提示文案 */}
        <p
          style={{
            color: "var(--color-text-primary)",
            fontSize: "var(--font-size-dialogue)",
            textAlign: "center",
            lineHeight: "var(--line-height-dialogue)",
          }}
        >
          {pendingConfirm.confirmationText ?? "这是关键选择，确认后将无法回退。确定吗？"}
        </p>

        {/* 确认/取消按钮 */}
        <div style={{ display: "flex", gap: 32 }}>
          <button
            onClick={() => onConfirm(pendingConfirm)}
            style={{
              padding: "12px 48px",
              background: "var(--color-choice-critical)",
              color: "var(--color-text-primary)",
              fontSize: "var(--font-size-choice)",
              border: "1px solid var(--color-choice-border)",
              borderRadius: "var(--border-radius-md)",
              cursor: "pointer",
            }}
          >
            确认选择
          </button>
          <button
            onClick={onCancelConfirm}
            style={{
              padding: "12px 48px",
              background: "var(--color-choice-bg)",
              color: "var(--color-text-secondary)",
              fontSize: "var(--font-size-choice)",
              border: "1px solid var(--color-choice-border)",
              borderRadius: "var(--border-radius-md)",
              cursor: "pointer",
            }}
          >
            再想一想
          </button>
        </div>
      </div>
    );
  }

  // 正常选项列表
  return (
    <div className="choicePanel">
      {error && (
        <p
          style={{
            color: "var(--color-change-negative)",
            fontSize: "var(--font-size-small)",
            textAlign: "center",
            marginBottom: 8,
            opacity: 0.9,
          }}
        >
          {error}
        </p>
      )}
      {choices.map((resolved) => {
        const { choice, availability, lockedHint } = resolved;
        const isLocked = availability === "locked";

        return (
          <button
            key={choice.id}
            onClick={isLocked ? undefined : () => onSelect(choice)}
            disabled={isLocked}
            className="choiceButton"
            style={{
              background: isLocked
                ? "rgba(30, 25, 18, 0.5)"
                : choice.isCritical
                  ? "rgba(90, 48, 32, 0.72)"
                  : "rgba(35, 31, 25, 0.88)",
              border: isLocked
                ? "1px solid rgba(60, 50, 38, 0.3)"
                : choice.isCritical
                  ? "1px solid rgba(200, 100, 50, 0.6)"
                  : "1px solid rgba(188, 151, 82, 0.52)",
            }}
          >
            {choice.text}
            {choice.isCritical && (
              <span
                style={{
                  color: isLocked ? "var(--color-text-dim)" : "var(--color-change-negative)",
                  fontSize: "var(--font-size-small)",
                  marginLeft: 12,
                }}
              >
                【关键选择】
              </span>
            )}
            {isLocked && lockedHint && (
              <span
                style={{
                  color: "var(--color-text-dim)",
                  fontSize: "var(--font-size-small)",
                  marginLeft: 12,
                  fontStyle: "italic",
                }}
              >
                {lockedHint}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
