import SpecialSceneShell from "./SpecialSceneShell";
import type { SeasonJournalSceneProps } from "./sceneRendererTypes";

/**
 * SeasonJournalScene — 季节札记展示页
 *
 * 数据来源：scene.content.journal
 * - visibleSummary: knowledgeLabel / wellbeingLabel / preparationLabel
 * - journalText: 沈怀远第一人称札记
 * - keepsakes: 1-3 项本季留下的事物
 *
 * 要求：
 * - 全屏背景上居中显示札记面板
 * - 只显示显性状态（学识/身心/行动准备），不显示隐藏数值
 * - journalText 使用第一人称札记排版
 * - keepsakes 显示 1-3 项，没有时自然隐藏
 * - 进入下一季按钮只触发一次
 */
export default function SeasonJournalScene(props: SeasonJournalSceneProps) {
  const { scene, onAdvance } = props;
  const journal = scene.content?.journal;

  const canAdvance = !!scene.nextSceneId;

  // 缺少 journal 内容时安全降级
  if (!journal) {
    return (
      <SpecialSceneShell
        scene={scene}
        sceneName={scene.name}
        onAdvance={() => scene.nextSceneId && onAdvance(scene.nextSceneId)}
        canAdvance={canAdvance}
        disableClickAdvance
      >
        <p style={{ color: "var(--color-text-dim)", fontSize: 20 }}>
          季节札记内容暂缺
        </p>
      </SpecialSceneShell>
    );
  }

  const { visibleSummary } = journal;

  return (
    <SpecialSceneShell
      scene={scene}
      sceneName={scene.name}
      onAdvance={() => scene.nextSceneId && onAdvance(scene.nextSceneId)}
      canAdvance={canAdvance}
      disableClickAdvance
    >
      <div className="season-journal-content" style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "60px",
      }}>
        {/* 札记面板 */}
        <div style={{
          maxWidth: 840,
          width: "100%",
          background: "rgba(26,22,16,0.94)",
          border: "2px solid #4a3828",
          borderRadius: "var(--border-radius-md)",
          padding: "48px 56px",
          boxShadow: "0 4px 32px rgba(0,0,0,0.5)",
          display: "flex",
          flexDirection: "column",
          gap: "var(--space-lg)",
          maxHeight: "88%",
          overflowY: "auto",
        }}>
          {/* 显性状态摘要 */}
          <div style={{
            display: "flex",
            justifyContent: "center",
            gap: "var(--space-xl)",
            paddingBottom: "var(--space-lg)",
            borderBottom: "1px solid #3a2818",
            flexWrap: "wrap",
          }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ color: "var(--color-text-dim)", fontSize: "var(--font-size-small)", letterSpacing: 2, marginBottom: 4 }}>
                学识
              </div>
              <div style={{ color: "var(--color-knowledge)", fontSize: 20, fontWeight: 600 }}>
                {visibleSummary.knowledgeLabel}
              </div>
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ color: "var(--color-text-dim)", fontSize: "var(--font-size-small)", letterSpacing: 2, marginBottom: 4 }}>
                身心
              </div>
              <div style={{ color: "var(--color-wellbeing)", fontSize: 20, fontWeight: 600 }}>
                {visibleSummary.wellbeingLabel}
              </div>
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ color: "var(--color-text-dim)", fontSize: "var(--font-size-small)", letterSpacing: 2, marginBottom: 4 }}>
                行动准备
              </div>
              <div style={{ color: "var(--color-preparation)", fontSize: 20, fontWeight: 600 }}>
                {visibleSummary.preparationLabel}
              </div>
            </div>
          </div>

          {/* 第一人称札记 */}
          <div style={{
            color: "var(--color-text-secondary)",
            fontSize: "var(--font-size-dialogue)",
            lineHeight: "var(--line-height-dialogue)",
            fontStyle: "italic",
            whiteSpace: "pre-wrap",
          }}>
            {journal.journalText}
          </div>

          {/* keepsakes */}
          {journal.keepsakes && journal.keepsakes.length > 0 && (
            <div style={{
              borderTop: "1px solid #3a2818",
              paddingTop: "var(--space-lg)",
            }}>
              <div style={{
                color: "var(--color-text-dim)",
                fontSize: "var(--font-size-small)",
                letterSpacing: 2,
                marginBottom: "var(--space-sm)",
              }}>
                本季留下的事物
              </div>
              <div style={{
                display: "flex",
                flexDirection: "column",
                gap: "var(--space-sm)",
              }}>
                {journal.keepsakes.map((item, i) => (
                  <div
                    key={i}
                    style={{
                      color: "var(--color-text-secondary)",
                      fontSize: "var(--font-size-dialogue)",
                      lineHeight: 1.6,
                      paddingLeft: "var(--space-md)",
                      borderLeft: "2px solid var(--color-text-amber)",
                    }}
                  >
                    {item}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 进入下一季按钮 */}
          {canAdvance && (
            <div style={{
              textAlign: "center",
              paddingTop: "var(--space-md)",
              borderTop: "1px solid #3a2818",
            }}>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  scene.nextSceneId && onAdvance(scene.nextSceneId);
                }}
                style={{
                  padding: "10px 48px",
                  background: "rgba(42,34,24,0.8)",
                  border: "1px solid #5a4a3a",
                  borderRadius: "var(--border-radius-md)",
                  color: "var(--color-text-primary)",
                  fontSize: "var(--font-size-dialogue)",
                  cursor: "pointer",
                  letterSpacing: 4,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(60,48,32,0.9)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "rgba(42,34,24,0.8)";
                }}
              >
                进入下一季
              </button>
            </div>
          )}
        </div>
      </div>
    </SpecialSceneShell>
  );
}
