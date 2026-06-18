import { useEffect, useState, useCallback, useRef } from "react";
import type { SceneContent } from "@/schemas/types";

/**
 * DialoguePanel — 底部 216px 对话区（含打字机动画）
 *
 * - 文本逐字显示，速度因 textType 而异
 * - 对话：amber 色 speakerName
 * - 旁白：无 speaker，浅色文字
 * - 内心独白：speaker + 斜体
 * - 点击中途 → 立即显示全文
 * - 点击全文后 → 调用 onClickAdvance 推进
 */
interface DialoguePanelProps {
  content: SceneContent;
  onClickAdvance: () => void;
  canAdvance: boolean;
}

/** 不同文本类型的打字速度（ms/字符） */
const speedMap: Record<string, number> = {
  narration: 55,
  dialogue: 40,
  innerThought: 35,
};

export default function DialoguePanel({
  content,
  onClickAdvance,
  canAdvance,
}: DialoguePanelProps) {
  const textType = content.textType ?? "narration";
  const showSpeaker = textType !== "narration" && content.speakerName;
  const fullText = content.text ?? "";
  const speed = speedMap[textType] ?? 40;

  const [displayedText, setDisplayedText] = useState("");
  const [isFinished, setIsFinished] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const indexRef = useRef(0);

  // 文本切换时重置动画
  useEffect(() => {
    // 先清理旧 timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    setDisplayedText("");
    setIsFinished(false);
    indexRef.current = 0;

    if (!fullText) {
      setIsFinished(true);
      return;
    }

    timerRef.current = setInterval(() => {
      indexRef.current += 1;
      if (indexRef.current >= fullText.length) {
        setDisplayedText(fullText);
        setIsFinished(true);
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
      } else {
        setDisplayedText(fullText.slice(0, indexRef.current + 1));
      }
    }, speed);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [fullText, speed]);

  // 点击处理
  const handleClick = useCallback(() => {
    if (!isFinished) {
      // 打字中 → 立即完成
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      setDisplayedText(fullText);
      setIsFinished(true);
    } else if (canAdvance) {
      // 已完成 → 推进
      onClickAdvance();
    }
  }, [isFinished, canAdvance, fullText, onClickAdvance]);

  const showCursor = canAdvance || !isFinished;

  return (
    <div
      onClick={handleClick}
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
        cursor: showCursor ? "pointer" : "default",
        userSelect: "none",
        position: "relative",
        flexShrink: 0,
      }}
    >
      {/* 说话者名称（立即显示） */}
      {showSpeaker && (
        <span
          style={{
            color: "var(--color-text-amber)",
            fontSize: "var(--font-size-status)",
            fontWeight: 600,
            marginBottom: 8,
            letterSpacing: 2,
          }}
        >
          {content.speakerName}
        </span>
      )}

      {/* 对话文本（打字机动画） */}
      <span
        style={{
          color:
            textType === "narration"
              ? "var(--color-text-secondary)"
              : "var(--color-text-primary)",
          fontSize: "var(--font-size-dialogue)",
          lineHeight: "var(--line-height-dialogue)",
          fontStyle: textType === "innerThought" ? "italic" : "normal",
          minHeight: "1.5em",
        }}
      >
        {displayedText}
        {/* 闪烁光标 */}
        {!isFinished && (
          <span
            style={{
              display: "inline-block",
              width: 2,
              height: "1em",
              background: "var(--color-text-amber)",
              marginLeft: 2,
              verticalAlign: "text-bottom",
              animation: "pulse 0.6s ease-in-out infinite",
            }}
          />
        )}
      </span>

      {/* 点击跳过提示（打字中） */}
      {!isFinished && canAdvance && (
        <span
          style={{
            position: "absolute",
            right: 48,
            bottom: 16,
            color: "var(--color-text-dim)",
            fontSize: "var(--font-size-small)",
          }}
        >
          点击跳过
        </span>
      )}

      {/* 推进提示（已完成） */}
      {isFinished && canAdvance && (
        <span
          style={{
            position: "absolute",
            right: 48,
            bottom: 16,
            color: "var(--color-text-dim)",
            fontSize: "var(--font-size-small)",
            animation: "pulse 2s ease-in-out infinite",
          }}
        >
          ▸ 点击继续
        </span>
      )}
    </div>
  );
}
