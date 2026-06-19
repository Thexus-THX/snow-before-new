import { useEffect, useCallback, type ReactNode } from "react";
import { useAdvanceGuard } from "./useAdvanceGuard";
import type { SceneDefinition } from "@/schemas/types";

/**
 * SpecialSceneShell — 所有特殊页面的统一全屏外壳
 *
 * 逻辑尺寸：1920×1080
 * - 不显示普通状态栏和216px对话框
 * - 背景：scene.background，缺失时使用安全底色
 * - 支持点击背景推进、Enter/Space 键盘推进
 * - 交互控件内 stopPropagation 防止误触
 * - 一次性推进保护（useAdvanceGuard）
 * - 输入控件聚焦时不触发键盘推进
 */
interface SpecialSceneShellProps {
  scene: SceneDefinition;
  /** 场景名称（用于降级显示） */
  sceneName: string;
  /** 推进回调 */
  onAdvance: () => void;
  /** 是否有合法的 nextSceneId */
  canAdvance: boolean;
  /** 插槽内容 */
  children?: ReactNode;
}

export default function SpecialSceneShell({
  scene,
  sceneName,
  onAdvance,
  canAdvance,
  children,
}: SpecialSceneShellProps) {
  const { tryAdvance } = useAdvanceGuard(scene.id, onAdvance);

  const handleClick = useCallback((e: React.MouseEvent) => {
    if (!canAdvance) return;
    // 排除交互元素：按钮、链接、输入框等不应触发推进
    const target = e.target as HTMLElement;
    const interactive = target.closest("button, a, input, textarea, select, [role='button']");
    if (interactive) return;
    tryAdvance();
  }, [canAdvance, tryAdvance]);

  // 键盘推进：Enter / Space
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!canAdvance) return;
      // 输入控件聚焦时不触发
      const tag = (e.target as HTMLElement).tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        tryAdvance();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [canAdvance, tryAdvance]);

  const bg = scene.background;

  return (
    <div
      className="special-scene-shell"
      onClickCapture={handleClick}
      style={{
        width: "100%",
        height: "100%",
        position: "relative",
        overflow: "hidden",
        background: bg
          ? `url(${bg}) center/cover no-repeat var(--color-bg-dark)`
          : "var(--color-bg-dark)",
        cursor: canAdvance ? "pointer" : "default",
      }}
    >
      {/* 安全底色：背景缺失时显示场景名称 */}
      {!bg && (
        <p
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            color: "var(--color-text-dim)",
            fontSize: 20,
            opacity: 0.3,
            pointerEvents: "none",
            zIndex: 0,
          }}
        >
          {sceneName}
        </p>
      )}

      {/* 半透明暗色叠加层 */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(10,8,6,0.25)",
          pointerEvents: "none",
          zIndex: 1,
        }}
      />

      {/* 内容插槽 */}
      <div
        style={{
          position: "relative",
          zIndex: 2,
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          pointerEvents: "auto",
        }}
      >
        {children}
      </div>

      {/* 底部"点击继续"提示 */}
      {canAdvance && (
        <div
          style={{
            position: "absolute",
            bottom: 48,
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 10,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 8,
            pointerEvents: "none",
          }}
        >
          <span
            style={{
              color: "var(--color-text-dim)",
              fontSize: "var(--font-size-status)",
              letterSpacing: 4,
              animation: "pulse 2s ease-in-out infinite",
            }}
          >
            ▸ 点击继续
          </span>
        </div>
      )}
    </div>
  );
}
