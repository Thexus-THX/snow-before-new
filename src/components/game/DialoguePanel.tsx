import { useEffect, useState, useCallback, useRef } from "react";
import type { SceneContent } from "@/schemas/types";
import { useSettingsStore } from "@/app/stores/settingsStore";
import { useGameStore } from "@/app/stores/gameStore";

/**
 * DialoguePanel — 底部 216px 对话区（含打字机动画）
 *
 * - 文本逐字显示，速度受 settingsStore.textSpeed 控制
 * - 实际毫秒值来自 gameData.settings.textSpeeds
 * - 对话：amber 色 speakerName
 * - 旁白：无 speaker，浅色文字
 * - 内心独白：speaker + 斜体
 * - 点击中途 → 立即显示全文
 * - 点击全文后 → 调用 onClickAdvance 推进
 * - 设置变化后在下一段文字立即生效
 * - 组件卸载或文本切换时清理计时器
 */
interface DialoguePanelProps {
  content: SceneContent;
  onClickAdvance: () => void;
  canAdvance: boolean;
}

/** 默认打字速度（ms/字符），当 gameData 未加载时使用 */
const DEFAULT_SPEED_MS = 40;

export default function DialoguePanel({
  content,
  onClickAdvance,
  canAdvance,
}: DialoguePanelProps) {
  const textSpeed = useSettingsStore((s) => s.textSpeed);
  const gameData = useGameStore((s) => s.gameData);

  const textType = content.textType ?? "narration";
  const showSpeaker = textType !== "narration" && content.speakerName;
  const fullText = content.text ?? "";

  // 从 gameData 读取实际毫秒值，未加载时使用默认值
  const speedMs = gameData?.settings?.textSpeeds?.[textSpeed] ?? DEFAULT_SPEED_MS;

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
    }, speedMs);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [fullText, speedMs]);

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
      className="dialoguePanel"
      onClick={handleClick}
      style={{ cursor: showCursor ? "pointer" : "default", userSelect: "none", flexShrink: 0 }}
    >
      {/* 说话者名称（立即显示） */}
      {showSpeaker && (
        <div className="dialoguePanel__name">{content.speakerName}</div>
      )}

      {/* 对话文本（打字机动画） */}
      <div
        className="dialoguePanel__text"
        style={{
          fontStyle: textType === "innerThought" ? "italic" : "normal",
          color:
            textType === "narration"
              ? "rgba(241, 234, 215, 0.78)"
              : "#f1ead7",
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
              background: "#d4a843",
              marginLeft: 2,
              verticalAlign: "text-bottom",
              animation: "pulse 0.6s ease-in-out infinite",
            }}
          />
        )}
      </div>

      {/* 点击跳过提示（打字中） */}
      {!isFinished && canAdvance && (
        <span className="dialoguePanel__hint">点击显示全文</span>
      )}

      {/* 推进提示（已完成） */}
      {isFinished && canAdvance && (
        <span className="dialoguePanel__hint" style={{ animation: "pulse 2s ease-in-out infinite" }}>
          ▸ 点击继续
        </span>
      )}
    </div>
  );
}
