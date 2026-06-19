import SpecialSceneShell from "./SpecialSceneShell";
import type { ChapterIntroSceneProps } from "./sceneRendererTypes";

/**
 * ChapterIntroScene — 章节介绍页
 *
 * 数据来源：
 * - scene.background — 全屏背景
 * - scene.content.chapterTitle — 章节标题（视觉中心）
 * - scene.content.dateText — 日期（可选）
 * - scene.content.locationText — 地点（可选）
 * - scene.content.backgroundText — 章节说明（2-4 句）
 * - scene.content.text — 落款/补充（可选）
 *
 * 表现：
 * - 全屏章节背景
 * - 标题为视觉中心
 * - 年份、季节、地点使用克制小字档案排版
 * - 不显示角色立绘、普通对话框和状态栏
 * - 缺少可选字段时自然隐藏
 */
export default function ChapterIntroScene(props: ChapterIntroSceneProps) {
  const { scene, onAdvance } = props;
  const content = scene.content;
  const chapterTitle = content?.chapterTitle;
  const dateText = content?.dateText;
  const locationText = content?.locationText;
  const backgroundText = content?.backgroundText;
  const footerText = content?.text;

  const canAdvance = !!scene.nextSceneId;

  return (
    <SpecialSceneShell
      scene={scene}
      sceneName={scene.name}
      onAdvance={() => scene.nextSceneId && onAdvance(scene.nextSceneId)}
      canAdvance={canAdvance}
    >
      <div className="chapter-intro-content" style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "var(--space-lg)",
        padding: "0 120px",
        textAlign: "center",
        maxWidth: 1200,
      }}>
        {/* 章节标题 */}
        {chapterTitle && (
          <h1 style={{
            color: "var(--color-text-primary)",
            fontSize: "var(--font-size-title)",
            fontWeight: 600,
            letterSpacing: 8,
            lineHeight: 1.3,
            textShadow: "0 2px 12px rgba(0,0,0,0.6)",
          }}>
            {chapterTitle}
          </h1>
        )}

        {/* 日期 + 地点（小字档案排版） */}
        {(dateText || locationText) && (
          <div style={{
            display: "flex",
            gap: 24,
            color: "var(--color-text-secondary)",
            fontSize: "var(--font-size-status)",
            letterSpacing: 3,
            opacity: 0.8,
          }}>
            {dateText && <span>{dateText}</span>}
            {locationText && <span>{locationText}</span>}
          </div>
        )}

        {/* 章节说明 */}
        {backgroundText && (
          <p style={{
            color: "var(--color-text-secondary)",
            fontSize: "var(--font-size-dialogue)",
            lineHeight: "var(--line-height-dialogue)",
            marginTop: "var(--space-xl)",
            maxWidth: 800,
            opacity: 0.85,
          }}>
            {backgroundText}
          </p>
        )}

        {/* 落款/补充文字 */}
        {footerText && (
          <p style={{
            color: "var(--color-text-dim)",
            fontSize: "var(--font-size-status)",
            marginTop: "var(--space-lg)",
            letterSpacing: 2,
            opacity: 0.6,
          }}>
            {footerText}
          </p>
        )}
      </div>
    </SpecialSceneShell>
  );
}
