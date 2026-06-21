import { useState, useEffect } from "react";
import SpecialSceneShell from "./SpecialSceneShell";
import type { FreeLayoutSceneProps } from "./sceneRendererTypes";
import type { ImageElement, TextElement } from "@/schemas/types";

/**
 * FreeLayoutScene — 自由排版场景
 *
 * 桌面端：1920×1080 绝对定位海报构图
 * 移动端：文档卡片流式布局，从 elements 中识别标题/正文
 */
export default function FreeLayoutScene(props: FreeLayoutSceneProps) {
  const { scene, onAdvance } = props;
  const elements = scene.elements;
  const [imgErrors, setImgErrors] = useState<Set<string>>(new Set());
  const [isMobile, setIsMobile] = useState(false);

  // 移动端检测（与 GameViewport 一致）
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

  const canAdvance = !!scene.nextSceneId;

  // 无 elements 时安全降级
  if (!elements || elements.length === 0) {
    return (
      <SpecialSceneShell
        scene={scene}
        sceneName={scene.name}
        onAdvance={() => scene.nextSceneId && onAdvance(scene.nextSceneId)}
        canAdvance={canAdvance}
      >
        <div className="free-layout-fallback" style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "var(--space-xl)",
          padding: "0 120px",
          maxWidth: 960,
          textAlign: "center",
        }}>
          {scene.content?.chapterTitle && (
            <h1 style={{
              color: "var(--color-text-primary)",
              fontSize: "var(--font-size-title)",
              fontWeight: 600,
              letterSpacing: 8,
              textShadow: "0 2px 12px rgba(0,0,0,0.6)",
            }}>
              {scene.content.chapterTitle}
            </h1>
          )}
          {scene.content?.text && (
            <p style={{
              color: "var(--color-text-secondary)",
              fontSize: "var(--font-size-dialogue)",
              lineHeight: 2,
              whiteSpace: "pre-wrap",
              textAlign: "center",
            }}>
              {scene.content.text}
            </p>
          )}
        </div>
      </SpecialSceneShell>
    );
  }

  // ===== 移动端：文档卡片流式布局 =====
  if (isMobile) {
    // 从 elements 中按 zIndex 排序提取文本元素，分为标题/分隔线/正文
    const textEls = elements
      .filter((el): el is TextElement => el.type === "text")
      .sort((a, b) => a.zIndex - b.zIndex || a.y - b.y);

    // 标题：fontSize ≥ 30 的文本元素
    const titleEls = textEls.filter((t) => t.fontSize >= 30);
    // 分隔线：fontSize ≤ 2 的极小元素
    const separatorEl = textEls.find((t) => t.fontSize <= 2);
    // 正文：其余文本元素
    const bodyEls = textEls.filter((t) => t.fontSize > 2 && t.fontSize < 30);

    // 图片元素
    const imageEls = elements.filter((el): el is ImageElement => el.type === "image");

    return (
      <SpecialSceneShell
        scene={scene}
        sceneName={scene.name}
        onAdvance={() => scene.nextSceneId && onAdvance(scene.nextSceneId)}
        canAdvance={canAdvance}
      >
        <div className="mobile-free-layout-card">
          {/* 标题 */}
          {titleEls.map((t) => (
            <h1
              key={t.id}
              className="mobile-free-layout-title"
              style={{
                color: t.color,
                opacity: t.opacity,
              }}
            >
              {t.text}
            </h1>
          ))}

          {/* 分隔线 */}
          {separatorEl && (
            <div
              className="mobile-free-layout-separator"
              style={{ opacity: separatorEl.opacity, color: separatorEl.color }}
            />
          )}

          {/* 正文 */}
          <div className="mobile-free-layout-body">
            {bodyEls.map((t) => (
              <p
                key={t.id}
                className="mobile-free-layout-text"
                style={{
                  color: t.color,
                  opacity: t.opacity,
                }}
              >
                {t.text}
              </p>
            ))}
          </div>

          {/* 图片（如有） */}
          {imageEls.map((img) => {
            if (imgErrors.has(img.id)) return null;
            return (
              <img
                key={img.id}
                src={img.asset}
                alt=""
                className="mobile-free-layout-image"
                style={{ opacity: img.opacity }}
                onError={() => {
                  setImgErrors((prev) => new Set(prev).add(img.id));
                  if (import.meta.env.DEV) {
                    console.warn(`[FreeLayoutScene] 图片加载失败: ${img.asset}`);
                  }
                }}
              />
            );
          })}
        </div>
      </SpecialSceneShell>
    );
  }

  // ===== 桌面端：保持原有 1920×1080 绝对定位 =====
  const sorted = [...elements].sort((a, b) => a.zIndex - b.zIndex);

  return (
    <SpecialSceneShell
      scene={scene}
      sceneName={scene.name}
      onAdvance={() => scene.nextSceneId && onAdvance(scene.nextSceneId)}
      canAdvance={canAdvance}
    >
      <div style={{
        position: "relative",
        width: 1920,
        height: 1080,
        overflow: "hidden",
      }}>
        {sorted.map((el) => {
          if (imgErrors.has(el.id)) return null;

          if (el.type === "image") {
            const img = el as ImageElement;
            return (
              <img
                key={el.id}
                src={img.asset}
                alt=""
                draggable={false}
                style={{
                  position: "absolute",
                  left: el.x,
                  top: el.y,
                  width: el.width,
                  height: el.height,
                  opacity: el.opacity,
                  zIndex: el.zIndex,
                  objectFit: img.fit,
                  pointerEvents: "none",
                }}
                onError={() => {
                  setImgErrors((prev) => new Set(prev).add(el.id));
                  if (import.meta.env.DEV) {
                    console.warn(`[FreeLayoutScene] 图片加载失败: ${img.asset}`);
                  }
                }}
              />
            );
          }

          if (el.type === "text") {
            const txt = el as TextElement;
            return (
              <div
                key={el.id}
                style={{
                  position: "absolute",
                  left: el.x,
                  top: el.y,
                  width: el.width,
                  height: el.height,
                  opacity: el.opacity,
                  zIndex: el.zIndex,
                  fontFamily: txt.fontFamily,
                  fontSize: txt.fontSize,
                  lineHeight: txt.lineHeight,
                  textAlign: txt.align,
                  color: txt.color,
                  backgroundColor: txt.backgroundColor,
                  overflow: "hidden",
                  pointerEvents: "none",
                }}
              >
                {txt.text}
              </div>
            );
          }

          return null;
        })}
      </div>
    </SpecialSceneShell>
  );
}
