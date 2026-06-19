import SpecialSceneShell from "./SpecialSceneShell";
import type { SceneFallbackProps } from "./sceneRendererTypes";

/**
 * SceneFallback — 安全降级页
 *
 * 处理以下情况：
 * - 模板已知但必要内容缺失
 * - 背景图片加载失败
 * - elements 为空
 * - 特殊场景内容不完整
 *
 * 运行时要求：
 * - 不白屏
 * - 显示场景名称和已有文字
 * - 有合法 nextSceneId 时仍可继续
 * - 没有合法目标时显示"返回标题"
 * - 控制台给出包含 scene.id 的错误（仅 DEV）
 * - 生产界面不展示技术堆栈
 */
export default function SceneFallback(props: SceneFallbackProps) {
  const { scene, onAdvance } = props;

  const hasNext = !!scene.nextSceneId;

  // DEV 环境输出错误
  if (import.meta.env.DEV) {
    console.error(
      `[SceneFallback] 场景 "${scene.id}" (${scene.name}) 模板 "${scene.template}" 内容不完整，已降级显示`,
    );
  }

  return (
    <SpecialSceneShell
      scene={scene}
      sceneName={scene.name}
      onAdvance={() => {
        if (scene.nextSceneId) {
          onAdvance(scene.nextSceneId);
        }
      }}
      canAdvance={hasNext}
    >
      <div style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "var(--space-xl)",
        padding: "0 120px",
        maxWidth: 720,
        textAlign: "center",
      }}>
        {/* 场景名称 */}
        <h1 style={{
          color: "var(--color-text-primary)",
          fontSize: "var(--font-size-chapter)",
          fontWeight: 600,
          letterSpacing: 6,
        }}>
          {scene.name}
        </h1>

        {/* 已有文字（如果有） */}
        {scene.content?.text && (
          <p style={{
            color: "var(--color-text-secondary)",
            fontSize: "var(--font-size-dialogue)",
            lineHeight: "var(--line-height-dialogue)",
            opacity: 0.85,
          }}>
            {scene.content.text}
          </p>
        )}

        {/* 模板信息（仅 DEV 环境） */}
        {import.meta.env.DEV && (
          <p style={{
            color: "var(--color-text-dim)",
            fontSize: "var(--font-size-small)",
            opacity: 0.5,
            fontFamily: "var(--font-mono)",
          }}>
            [{scene.id}] · 模板: {scene.template}
          </p>
        )}

        {/* 无合法目标时显示返回标题 */}
        {!hasNext && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              window.location.hash = "#/";
            }}
            style={{
              marginTop: "var(--space-xl)",
              padding: "12px 48px",
              background: "rgba(42,34,24,0.8)",
              border: "1px solid #5a4a3a",
              borderRadius: "var(--border-radius-md)",
              color: "var(--color-text-primary)",
              fontSize: "var(--font-size-dialogue)",
              cursor: "pointer",
              letterSpacing: 4,
            }}
          >
            返回标题
          </button>
        )}
      </div>
    </SpecialSceneShell>
  );
}
