import { useState, useEffect, useCallback, useRef } from "react";
import SpecialSceneShell from "./SpecialSceneShell";
import type { LetterSceneProps } from "./sceneRendererTypes";
import { audioManager } from "@/audio/AudioManager";

/**
 * LetterScene — 家书阅读场景
 *
 * 桌面端：SpecialSceneShell + 信纸背景图居中显示
 * 移动端：全屏 overlay + 文档卡片流式布局
 */
export default function LetterScene(props: LetterSceneProps) {
  const { scene, onAdvance } = props;
  const letter = scene.content?.letter;

  const [currentPage, setCurrentPage] = useState(0);
  const openedRef = useRef(false);
  const [isMobile, setIsMobile] = useState(false);

  // 移动端检测
  useEffect(() => {
    const check = () => {
      const mobile = window.innerWidth <= 768;
      const coarse = typeof matchMedia === "function" && matchMedia("(pointer: coarse)").matches;
      setIsMobile(mobile || coarse);
    };
    check();
    window.addEventListener("resize", check);
    window.addEventListener("orientationchange", check);
    return () => {
      window.removeEventListener("resize", check);
      window.removeEventListener("orientationchange", check);
    };
  }, []);

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

  // ===== 移动端：全屏 overlay + 文档卡片 =====
  if (isMobile) {
    return (
      <div className="mobile-letter-overlay">
        <div className="mobile-letter-card">
          {/* 头部：称呼 + 日期 */}
          <div className="mobile-letter-header">
            {letter.salutation && (
              <span className="mobile-letter-salutation">{letter.salutation}</span>
            )}
            {letter.date && (
              <span className="mobile-letter-date">{letter.date}</span>
            )}
          </div>

          {/* 正文区域 */}
          <div className="mobile-letter-body">
            {pageText}
          </div>

          {/* 附言（仅最后一页） */}
          {isLastPage && letter.postscript && (
            <div className="mobile-letter-postscript">
              {letter.postscript}
            </div>
          )}

          {/* 署名（仅最后一页） */}
          {isLastPage && letter.signature && (
            <div className="mobile-letter-signature">
              {letter.signature}
            </div>
          )}

          {/* 底部翻页 */}
          <div className="mobile-letter-footer">
            <button
              className="mobile-letter-button"
              onClick={(e) => { e.stopPropagation(); goPrev(); }}
              disabled={currentPage === 0}
            >
              ← 前页
            </button>

            <span className="mobile-letter-pagenum">
              {currentPage + 1} / {totalPages}
            </span>

            {isLastPage ? (
              <button
                className="mobile-letter-button"
                onClick={(e) => {
                  e.stopPropagation();
                  scene.nextSceneId && onAdvance(scene.nextSceneId);
                }}
              >
                收起信件
              </button>
            ) : (
              <button
                className="mobile-letter-button"
                onClick={(e) => { e.stopPropagation(); goNext(); }}
              >
                后页 →
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ===== 桌面端：保持原有信纸布局 =====
  return (
    <SpecialSceneShell
      scene={scene}
      sceneName={scene.name}
      onAdvance={() => scene.nextSceneId && onAdvance(scene.nextSceneId)}
      canAdvance={canAdvance}
      hideOverlay
      disableClickAdvance
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

        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "var(--space-xl)",
          marginTop: "var(--space-lg)",
          paddingTop: "var(--space-md)",
          borderTop: "1px solid #c8b898",
        }}>
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

          <span style={{
            fontSize: "var(--font-size-status)",
            color: "#5a4a3a",
            letterSpacing: 2,
          }}>
            {currentPage + 1} / {totalPages}
          </span>

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
