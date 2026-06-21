import SpecialSceneShell from "./SpecialSceneShell";
import type { EndingSceneProps } from "./sceneRendererTypes";

/**
 * EndingScene — 结局展示页
 *
 * 数据优先级：
 * 1. scene.content.ending
 * 2. 若字段不完整，使用安全降级显示 scene.name 与 content.text
 *
 * 要求：
 * - 结局背景全屏
 * - 显示结局名称和正文段落
 * - 不显示 GOOD/BAD 等级
 * - 不在组件中重新计算结局
 * - 缺配音文件时不报错
 */
export default function EndingScene(props: EndingSceneProps) {
  const { scene, onAdvance } = props;
  const ending = scene.content?.ending;

  const canAdvance = !!scene.nextSceneId;

  // 缺少 ending 内容时安全降级
  if (!ending || !ending.paragraphs || ending.paragraphs.length === 0) {
    return (
      <SpecialSceneShell
        scene={scene}
        sceneName={scene.name}
        onAdvance={() => scene.nextSceneId && onAdvance(scene.nextSceneId)}
        canAdvance={canAdvance}
      >
        <div className="ending-content" style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "var(--space-xl)",
          padding: "0 120px",
          maxWidth: 960,
          textAlign: "center",
        }}>
          <h1 style={{
            color: "var(--color-text-primary)",
            fontSize: "var(--font-size-title)",
            fontWeight: 600,
            letterSpacing: 8,
            textShadow: "0 2px 12px rgba(0,0,0,0.6)",
          }}>
            {scene.name}
          </h1>
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
        </div>
      </SpecialSceneShell>
    );
  }

  return (
    <SpecialSceneShell
      scene={scene}
      sceneName={scene.name}
      onAdvance={() => scene.nextSceneId && onAdvance(scene.nextSceneId)}
      canAdvance={canAdvance}
    >
      <div className="ending-content" style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "var(--space-xl)",
        padding: "0 120px",
        maxWidth: 960,
        textAlign: "center",
      }}>
        {/* 结局标题 */}
        <h1 style={{
          color: "var(--color-text-primary)",
          fontSize: "var(--font-size-title)",
          fontWeight: 600,
          letterSpacing: 8,
          lineHeight: 1.3,
          textShadow: "0 2px 16px rgba(0,0,0,0.7)",
        }}>
          {ending.title}
        </h1>

        {/* 正文段落 */}
        <div style={{
          display: "flex",
          flexDirection: "column",
          gap: "var(--space-lg)",
          marginTop: "var(--space-lg)",
        }}>
          {ending.paragraphs.map((p, i) => (
            <p
              key={i}
              style={{
                color: "var(--color-text-secondary)",
                fontSize: "var(--font-size-dialogue)",
                lineHeight: 2,
                letterSpacing: 1,
                opacity: 0.9,
              }}
            >
              {p}
            </p>
          ))}
        </div>
      </div>
    </SpecialSceneShell>
  );
}
