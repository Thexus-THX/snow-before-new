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
}

export default function ChoicePanel({
  choices,
  onSelect,
  pendingConfirm,
  onConfirm,
  onCancelConfirm,
}: ChoicePanelProps) {
  // 如果正在等待二次确认，显示确认对话框
  if (pendingConfirm) {
    return (
      <div
        style={{
          width: "100%",
          height: "var(--dialogue-height)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "0 64px",
          background: "var(--color-bg-dialogue)",
          borderTop: "1px solid #3a2a18",
          gap: 24,
          flexShrink: 0,
        }}
      >
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
              background: "url(/assets/ui/ui_choice_critical_transparent.png) center/100% 100% no-repeat",
              color: "var(--color-text-primary)",
              fontSize: "var(--font-size-choice)",
              border: "none",
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
              background: "url(/assets/ui/ui_choice_normal_transparent.png) center/100% 100% no-repeat",
              color: "var(--color-text-secondary)",
              fontSize: "var(--font-size-choice)",
              border: "none",
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
    <div
      style={{
        width: "100%",
        height: "var(--dialogue-height)",
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        justifyContent: "center",
        padding: "0 48px",
        background: "var(--color-bg-dialogue)",
        borderTop: "1px solid #3a2a18",
        gap: 10,
        overflowY: "auto",
        flexShrink: 0,
      }}
    >
      {choices.map((resolved) => {
        const { choice, availability, lockedHint } = resolved;
        const isLocked = availability === "locked";

        return (
          <button
            key={choice.id}
            onClick={isLocked ? undefined : () => onSelect(choice)}
            disabled={isLocked}
            className={`choice-btn${choice.isCritical ? " choice-btn-critical" : ""}${isLocked ? " choice-btn-locked" : ""}`}
            style={{
              width: "100%",
              padding: "10px 24px",
              background: isLocked
                ? "url(/assets/ui/ui_choice_locked_transparent.png) center/100% 100% no-repeat"
                : choice.isCritical
                  ? "url(/assets/ui/ui_choice_critical_transparent.png) center/100% 100% no-repeat"
                  : "url(/assets/ui/ui_choice_normal_transparent.png) center/100% 100% no-repeat",
              color: isLocked ? "var(--color-text-dim)" : "var(--color-text-primary)",
              fontSize: "var(--font-size-choice)",
              textAlign: "left",
              lineHeight: "var(--line-height-dialogue)",
              border: "none",
              borderRadius: "var(--border-radius-md)",
              cursor: isLocked ? "not-allowed" : "pointer",
              opacity: isLocked ? 0.6 : 1,
              transition: "filter var(--transition-fast)",
              position: "relative" as const,
            }}
            onMouseEnter={(e) => {
              if (isLocked) return;
              e.currentTarget.style.filter = "brightness(1.15)";
            }}
            onMouseLeave={(e) => {
              if (isLocked) return;
              e.currentTarget.style.filter = "none";
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
