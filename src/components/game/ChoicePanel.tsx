import type { ChoiceDefinition } from "@/schemas/types";

/**
 * ChoicePanel — 选项渲染区
 *
 * - 普通选项：正常显示，点击直接生效
 * - 关键选项：带【关键选择】标记，需二次确认
 * - 锁定选项：条件未满足时显示/隐藏（由父组件过滤）
 */
interface ChoicePanelProps {
  choices: ChoiceDefinition[];
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
              background: "var(--color-choice-critical)",
              color: "var(--color-text-primary)",
              fontSize: "var(--font-size-choice)",
              border: "1px solid #5a3020",
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
      {choices.map((choice) => (
        <button
          key={choice.id}
          onClick={() => onSelect(choice)}
          style={{
            width: "100%",
            padding: "10px 24px",
            background: choice.isCritical
              ? "var(--color-choice-critical)"
              : "var(--color-choice-bg)",
            color: "var(--color-text-primary)",
            fontSize: "var(--font-size-choice)",
            textAlign: "left",
            lineHeight: "var(--line-height-dialogue)",
            border: choice.isCritical
              ? "1px solid #5a3020"
              : "1px solid var(--color-choice-border)",
            borderRadius: "var(--border-radius-md)",
            cursor: "pointer",
            transition: "background var(--transition-fast)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "var(--color-choice-hover)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = choice.isCritical
              ? "var(--color-choice-critical)"
              : "var(--color-choice-bg)";
          }}
        >
          {choice.text}
          {choice.isCritical && (
            <span
              style={{
                color: "var(--color-change-negative)",
                fontSize: "var(--font-size-small)",
                marginLeft: 12,
              }}
            >
              【关键选择】
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
