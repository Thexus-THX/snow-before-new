import { useState, useEffect } from "react";
import SpecialSceneShell from "./SpecialSceneShell";
import type { SeasonJournalSceneProps } from "./sceneRendererTypes";

/**
 * SeasonJournalScene — 季节札记展示页
 *
 * 桌面端：SpecialSceneShell + 札记面板居中
 * 移动端：文档卡片流式布局
 */
export default function SeasonJournalScene(props: SeasonJournalSceneProps) {
  const { scene, onAdvance } = props;
  const journal = scene.content?.journal;
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
  const hasKeepsakes = journal.keepsakes && journal.keepsakes.length > 0;

  // ===== 移动端：文档卡片 =====
  if (isMobile) {
    return (
      <SpecialSceneShell
        scene={scene}
        sceneName={scene.name}
        onAdvance={() => scene.nextSceneId && onAdvance(scene.nextSceneId)}
        canAdvance={canAdvance}
        disableClickAdvance
        hideContinueHint
      >
        <div className="mobile-season-summary">
          <div className="mobile-season-summary-card">
            {/* 状态标签行 */}
            <div className="mobile-season-stats">
              <div className="mobile-season-stat">
                <span className="mobile-season-stat-label">学识</span>
                <span className="mobile-season-stat-value" style={{ color: "var(--color-knowledge)" }}>
                  {visibleSummary.knowledgeLabel}
                </span>
              </div>
              <div className="mobile-season-stat">
                <span className="mobile-season-stat-label">身心</span>
                <span className="mobile-season-stat-value" style={{ color: "var(--color-wellbeing)" }}>
                  {visibleSummary.wellbeingLabel}
                </span>
              </div>
              <div className="mobile-season-stat">
                <span className="mobile-season-stat-label">行动准备</span>
                <span className="mobile-season-stat-value" style={{ color: "var(--color-preparation)" }}>
                  {visibleSummary.preparationLabel}
                </span>
              </div>
            </div>

            {/* 正文札记 */}
            <div className="mobile-season-body">
              <p className="mobile-season-text">
                {journal.journalText}
              </p>
            </div>

            {/* keepsakes */}
            {hasKeepsakes && (
              <div className="mobile-season-keepsakes">
                <div className="mobile-season-keepsakes-title">本季留下的事物</div>
                <ul className="mobile-season-keepsakes-list">
                  {journal.keepsakes!.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* 进入下一季 */}
            {canAdvance && (
              <button
                className="mobile-season-next"
                onClick={(e) => {
                  e.stopPropagation();
                  scene.nextSceneId && onAdvance(scene.nextSceneId);
                }}
              >
                进入下一季
              </button>
            )}
          </div>
        </div>
      </SpecialSceneShell>
    );
  }

  // ===== 桌面端：保持原有布局 =====
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

          <div style={{
            color: "var(--color-text-secondary)",
            fontSize: "var(--font-size-dialogue)",
            lineHeight: "var(--line-height-dialogue)",
            fontStyle: "italic",
            whiteSpace: "pre-wrap",
          }}>
            {journal.journalText}
          </div>

          {hasKeepsakes && (
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
                {journal.keepsakes!.map((item, i) => (
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
