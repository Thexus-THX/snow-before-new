import StatusBar from "@/components/game/StatusBar";
import SceneArea from "@/components/game/SceneArea";
import DialoguePanel from "@/components/game/DialoguePanel";
import ChoicePanel from "@/components/game/ChoicePanel";
import HistoryPanel from "@/components/game/HistoryPanel";
import type { StandardDialogueSceneProps } from "./sceneRendererTypes";

/**
 * StandardDialogueScene — 普通对话场景渲染组件
 *
 * 布局：
 * - 864px 场景区（SceneArea）
 * - 216px 对话区（DialoguePanel / ChoicePanel）
 * - 72px 状态栏叠加（StatusBar）
 *
 * 保持与原有 GamePage 完全一致的行为，包括：
 * - 打字机效果
 * - 点击一次显示全文、再次推进
 * - 普通选项与关键选项
 * - 关键选择二次确认
 * - 锁定选项三态显示
 * - 履历面板
 * - 普通选择精确回滚
 */
export default function StandardDialogueScene(props: StandardDialogueSceneProps) {
  const {
    scene,
    state,
    engine,
    onAdvance,
    onSelectChoice,
    onConfirmCritical,
    onCancelConfirm,
    onRollback,
    onToggleHistory,
    resolvedChoices,
    showingChoices,
    pendingConfirm,
    hasChoices,
    history,
    showHistory,
  } = props;

  const chapter = engine.getChapter(state.chapterId);
  const showStatusBar = scene.showTopStatusBar !== false && chapter;
  const showDialogue = scene.showDialoguePanel !== false && scene.content;
  const canAdvance = hasChoices ? !showingChoices : !!scene.nextSceneId;
  const sceneClickAdvance = !showDialogue && !!scene.nextSceneId;

  const handleAdvance = () => {
    if (!scene) return;
    if (hasChoices && !showingChoices) {
      // 有选项但未显示 → 先显示选项
      onAdvance(""); // 这里走特殊路径，实际上触发了 showingChoices 切换
      return;
    }
    if (!hasChoices && scene.nextSceneId) {
      onAdvance(scene.nextSceneId);
    }
  };

  // 有选项但未显示时，点击场景也触发显示选项
  const sceneClickHandler = hasChoices && !showingChoices
    ? undefined  // 让场景区不可点击，必须通过对话区点击来触发
    : sceneClickAdvance
      ? () => scene.nextSceneId && onAdvance(scene.nextSceneId)
      : undefined;

  const bottomArea = showingChoices || pendingConfirm ? (
    <ChoicePanel
      choices={resolvedChoices}
      onSelect={onSelectChoice}
      pendingConfirm={pendingConfirm}
      onConfirm={onConfirmCritical}
      onCancelConfirm={onCancelConfirm}
    />
  ) : (
    showDialogue && scene.content && (
      <DialoguePanel
        content={scene.content}
        onClickAdvance={handleAdvance}
        canAdvance={canAdvance}
      />
    )
  );

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        background: "var(--color-bg-dark)",
        position: "relative",
      }}
    >
      {/* 场景区 — 固定 864px */}
      <SceneArea
        scene={scene}
        onClick={sceneClickHandler}
        clickable={!!sceneClickHandler}
      />

      {/* 底部区域 — 固定 216px */}
      {bottomArea}

      {/* 状态栏 — 绝对定位叠加在场景上方 72px */}
      {showStatusBar && chapter && (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "var(--top-status-height)",
            display: "flex",
            alignItems: "stretch",
            zIndex: 10,
            pointerEvents: "auto",
          }}
        >
          <div style={{ flex: 1 }}>
            <StatusBar state={state} chapter={chapter} engine={engine} />
          </div>
          <button
            onClick={onToggleHistory}
            style={{
              padding: "0 24px",
              background: "rgba(10,8,6,0.92)",
              borderBottom: "2px solid #3a2818",
              borderLeft: "1px solid #3a2818",
              color: "var(--color-text-secondary)",
              fontSize: "var(--font-size-status)",
              cursor: "pointer",
              letterSpacing: 2,
              flexShrink: 0,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = "var(--color-text-amber)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = "var(--color-text-secondary)";
            }}
          >
            履历
          </button>
        </div>
      )}

      {showHistory && (
        <HistoryPanel
          history={history}
          onRollback={onRollback}
          onClose={onToggleHistory}
        />
      )}
    </div>
  );
}
