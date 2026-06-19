import SpecialSceneShell from "./SpecialSceneShell";
import type { HistoricalEventSceneProps } from "./sceneRendererTypes";

/**
 * HistoricalEventScene — 历史事件展示页
 *
 * 数据来源：scene.content.historicalEvent
 * - date / title / imageAsset / paragraphs
 * - gameplayNotice / sourceNote
 *
 * 要求：
 * - 全屏历史事件页
 * - 视觉语言为旧报纸、档案与事件通报
 * - 日期、标题、报纸图、正文层级清晰
 * - paragraphs 按段落显示
 * - gameplayNotice 与史实正文视觉区分
 * - sourceNote 使用小号克制排版
 * - 页面关闭后只推进一次
 */
export default function HistoricalEventScene(props: HistoricalEventSceneProps) {
  const { scene, onAdvance } = props;
  const evt = scene.content?.historicalEvent;

  const canAdvance = !!scene.nextSceneId;

  // 缺少 historicalEvent 内容时安全降级
  if (!evt) {
    return (
      <SpecialSceneShell
        scene={scene}
        sceneName={scene.name}
        onAdvance={() => scene.nextSceneId && onAdvance(scene.nextSceneId)}
        canAdvance={canAdvance}
      >
        <p style={{ color: "var(--color-text-dim)", fontSize: 20 }}>
          历史事件内容暂缺
        </p>
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
      <div className="historical-event-content" style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "60px 120px",
        gap: "var(--space-lg)",
        overflowY: "auto",
      }}>
        {/* 外层报纸框架 */}
        <div style={{
          maxWidth: 960,
          width: "100%",
          background: "rgba(26,22,16,0.92)",
          border: "2px solid #4a3828",
          borderRadius: "var(--border-radius-md)",
          padding: "48px 56px",
          boxShadow: "0 4px 32px rgba(0,0,0,0.5)",
        }}>
          {/* 日期 */}
          <div style={{
            color: "var(--color-text-dim)",
            fontSize: "var(--font-size-status)",
            letterSpacing: 3,
            textAlign: "center",
            marginBottom: "var(--space-md)",
            borderBottom: "1px solid #3a2818",
            paddingBottom: "var(--space-md)",
          }}>
            {evt.date}
          </div>

          {/* 标题 */}
          <h2 style={{
            color: "var(--color-text-amber)",
            fontSize: 28,
            fontWeight: 600,
            letterSpacing: 4,
            textAlign: "center",
            marginBottom: "var(--space-xl)",
            lineHeight: 1.4,
          }}>
            {evt.title}
          </h2>

          {/* 报纸图 */}
          {evt.imageAsset && (
            <div style={{
              textAlign: "center",
              marginBottom: "var(--space-xl)",
            }}>
              <img
                src={evt.imageAsset}
                alt={evt.title}
                style={{
                  maxWidth: "100%",
                  maxHeight: 300,
                  objectFit: "contain",
                  border: "1px solid #3a2818",
                }}
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                  if (import.meta.env.DEV) {
                    console.warn(`[HistoricalEventScene] 图片加载失败: ${evt.imageAsset}`);
                  }
                }}
              />
            </div>
          )}

          {/* 正文段落 */}
          <div style={{
            color: "var(--color-text-secondary)",
            fontSize: "var(--font-size-dialogue)",
            lineHeight: "var(--line-height-dialogue)",
          }}>
            {evt.paragraphs.map((p, i) => (
              <p key={i} style={{ marginBottom: "var(--space-md)", textIndent: "2em" }}>
                {p}
              </p>
            ))}
          </div>

          {/* 玩法提示（视觉区分） */}
          {evt.gameplayNotice && (
            <div style={{
              marginTop: "var(--space-xl)",
              padding: "16px 24px",
              background: "rgba(42,34,24,0.6)",
              borderLeft: "3px solid var(--color-text-amber)",
              color: "var(--color-text-secondary)",
              fontSize: "var(--font-size-status)",
              lineHeight: 1.6,
            }}>
              {evt.gameplayNotice}
            </div>
          )}

          {/* 史料来源 */}
          {evt.sourceNote && (
            <div style={{
              marginTop: "var(--space-lg)",
              color: "var(--color-text-dim)",
              fontSize: "var(--font-size-small)",
              fontStyle: "italic",
              textAlign: "right",
              letterSpacing: 1,
            }}>
              {evt.sourceNote}
            </div>
          )}
        </div>
      </div>
    </SpecialSceneShell>
  );
}
