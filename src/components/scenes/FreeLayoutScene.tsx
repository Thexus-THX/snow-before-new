import { useState } from "react";
import SpecialSceneShell from "./SpecialSceneShell";
import type { FreeLayoutSceneProps } from "./sceneRendererTypes";
import type { ImageElement, TextElement } from "@/schemas/types";

/**
 * FreeLayoutScene — 自由排版场景
 *
 * 严格读取 scene.elements，支持 image 和 text 两类元素
 * 坐标使用 1920×1080 逻辑坐标
 *
 * 要求：
 * - 按 zIndex 排序
 * - 使用绝对定位
 * - opacity 正确生效
 * - 图片不可拖拽
 * - 图片加载失败时隐藏并输出警告（仅 DEV）
 * - 无 elements 时使用 content.text 安全降级
 */
export default function FreeLayoutScene(props: FreeLayoutSceneProps) {
  const { scene, onAdvance } = props;
  const elements = scene.elements;
  const [imgErrors, setImgErrors] = useState<Set<string>>(new Set());

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
        <div style={{
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

  // 按 zIndex 排序
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
