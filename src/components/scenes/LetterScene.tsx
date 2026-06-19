import { useState, useEffect, useCallback, useRef } from "react";
import SpecialSceneShell from "./SpecialSceneShell";
import type { LetterSceneProps } from "./sceneRendererTypes";
import { audioManager } from "@/audio/AudioManager";

/**
 * LetterScene — 家书阅读场景
 *
 * 数据来源：scene.content.letter
 * - date / salutation / pages (1-3) / postscript / signature
 * - paperAsset / historyPlainText
 *
 * 要求：
 * - 信纸居中显示，1-3 页翻页
 * - 进入新信件时页码重置为 0
 * - 前一页/后一页按钮不触发场景推进
 * - 最后一页才显示"收起信件"按钮
 * - 不使用滚动条，正文固定安全边距
 * - 日期、称呼、正文、附言、署名分区
 * - 页码显示 1 / N
 */
export default function LetterScene(props: LetterSceneProps) {
  const { scene, onAdvance } = props;
  const letter = scene.content?.letter;

  // 页码（从 0 开始）
  const [currentPage, setCurrentPage] = useState(0);
  const openedRef = useRef(false);

  // 进入新信件时页码重置 + 播放拆信 SFX
  useEffect(() => {
    setCurrentPage(0);
    if (!openedRef.current) {
      openedRef.current = true;
      audioManager.playSfx("sfx.letter_open");
    }
    return () => { openedRef.current = false; };
  }, [scene.id]);

  const canAdvance = !!scene.nextSceneId;

  const goNext = useCallback(() => {
    if (!letter) return;
    if (currentPage < letter.pages.length - 1) {
      setCurrentPage((p) => p + 1);
      audioManager.playSfx("sfx.page_turn");
    }
  }, [letter, currentPage]);

  const goPrev = useCallback(() => {
    if (currentPage > 0) {
      setCurrentPage((p) => p - 1);
      audioManager.playSfx("sfx.page_turn");
    }
  }, [currentPage]);

  // 缺少 letter 内容时安全降级
  if (!letter) {
    return (
      <SpecialSceneShell
        scene={scene}
        sceneName={scene.name}
        onAdvance={() => scene.nextSceneId && onAdvance(scene.nextSceneId)}
        canAdvance={canAdvance}
      >
        <p style={{ color: "var(--color-text-dim)", fontSize: 20 }}>
          家书内容暂缺
        </p>
      </SpecialSceneShell>
    );
  }

  const totalPages = letter.pages.length;
  const isLastPage = currentPage === totalPages - 1;
  const pageText = letter.pages[currentPage];

  return (
    <SpecialSceneShell
      scene={scene}
      sceneName={scene.name}
      onAdvance={() => scene.nextSceneId && onAdvance(scene.nextSceneId)}
      canAdvance={canAdvance}
    >
      <div className="letter-container" style={{
        position: "relative",
        width: 720,
        minHeight: 640,
        maxHeight: 860,
        background: `url(${letter.paperAsset}) center/contain no-repeat`,
        padding: "80px 72px 60px",
        display: "flex",
        flexDirection: "column",
        color: "#3a2a1a",
        fontFamily: "var(--font-body)",
      }}>
        {/* 日期 */}
        {letter.date && (
          <div style={{
            fontSize: "var(--font-size-status)",
            color: "#5a4a3a",
            textAlign: "right",
            marginBottom: "var(--space-lg)",
            letterSpacing: 2,
          }}>
            {letter.date}
          </div>
        )}

        {/* 称呼 */}
        {letter.salutation && (
          <div style={{
            fontSize: "var(--font-size-dialogue)",
            color: "#3a2a1a",
            marginBottom: "var(--space-md)",
            letterSpacing: 1,
          }}>
            {letter.salutation}
          </div>
        )}

        {/* 正文 */}
        <div style={{
          flex: 1,
          fontSize: "var(--font-size-dialogue)",
          lineHeight: 2,
          color: "#3a2a1a",
          letterSpacing: 1,
          whiteSpace: "pre-wrap",
          overflow: "hidden",
        }}>
          {pageText}
        </div>

        {/* 附言（仅最后一页） */}
        {isLastPage && letter.postscript && (
          <div style={{
            fontSize: "var(--font-size-status)",
            color: "#5a4a3a",
            marginTop: "var(--space-md)",
            borderTop: "1px solid #c8b898",
            paddingTop: "var(--space-sm)",
            letterSpacing: 1,
          }}>
            {letter.postscript}
          </div>
        )}

        {/* 署名（仅最后一页） */}
        {isLastPage && letter.signature && (
          <div style={{
            fontSize: "var(--font-size-dialogue)",
            color: "#3a2a1a",
            textAlign: "right",
            marginTop: "var(--space-lg)",
            letterSpacing: 2,
          }}>
            {letter.signature}
          </div>
        )}

        {/* 底部翻页区域 */}
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "var(--space-xl)",
          marginTop: "var(--space-lg)",
          paddingTop: "var(--space-md)",
          borderTop: "1px solid #c8b898",
        }}>
          {/* 前一页按钮 */}
          <button
            onClick={(e) => { e.stopPropagation(); goPrev(); }}
            disabled={currentPage === 0}
            style={{
              padding: "6px 24px",
              background: "rgba(58,42,26,0.1)",
              border: "1px solid #8a7a5a",
              borderRadius: "var(--border-radius-md)",
              color: currentPage === 0 ? "#b8a898" : "#3a2a1a",
              fontSize: "var(--font-size-status)",
              cursor: currentPage === 0 ? "not-allowed" : "pointer",
              letterSpacing: 2,
              opacity: currentPage === 0 ? 0.4 : 1,
            }}
          >
            ← 前页
          </button>

          {/* 页码 */}
          <span style={{
            fontSize: "var(--font-size-status)",
            color: "#5a4a3a",
            letterSpacing: 2,
          }}>
            {currentPage + 1} / {totalPages}
          </span>

          {/* 后一页 / 收起信件按钮 */}
          {isLastPage ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                scene.nextSceneId && onAdvance(scene.nextSceneId);
              }}
              style={{
                padding: "6px 24px",
                background: "rgba(58,42,26,0.15)",
                border: "1px solid #8a7a5a",
                borderRadius: "var(--border-radius-md)",
                color: "#3a2a1a",
                fontSize: "var(--font-size-status)",
                cursor: "pointer",
                letterSpacing: 2,
              }}
            >
              收起信件
            </button>
          ) : (
            <button
              onClick={(e) => { e.stopPropagation(); goNext(); }}
              style={{
                padding: "6px 24px",
                background: "rgba(58,42,26,0.1)",
                border: "1px solid #8a7a5a",
                borderRadius: "var(--border-radius-md)",
                color: "#3a2a1a",
                fontSize: "var(--font-size-status)",
                cursor: "pointer",
                letterSpacing: 2,
              }}
            >
              后页 →
            </button>
          )}
        </div>
      </div>
    </SpecialSceneShell>
  );
}
