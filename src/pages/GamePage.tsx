import { useEffect, useState, useCallback } from "react";
import GameViewport from "@/components/common/GameViewport";
import StatusBar from "@/components/game/StatusBar";
import SceneArea from "@/components/game/SceneArea";
import DialoguePanel from "@/components/game/DialoguePanel";
import ChoicePanel from "@/components/game/ChoicePanel";
import HistoryPanel from "@/components/game/HistoryPanel";
import { useGameStore } from "@/app/stores/gameStore";
import { validateGameData } from "@/schemas/gameSchema";
import type { GameData, ChoiceDefinition, HistoryEntry } from "@/schemas/types";

/**
 * GamePage — 游戏运行器 · 固定比例布局
 *
 * 比例（来自 data schema）：
 * - sceneHeight: 864  (80%)
 * - dialogueHeight: 216 (20%)
 * - topStatusHeight: 72 (叠加在场景上，不占独立空间)
 */
export default function GamePage() {
  const {
    loadGameData, startNewGame, getCurrentScene, advanceScene,
    applyChoiceEffect, lockCriticalChoice,
    createSnapshot, recordHistoryEntry, rollback, getHistory, clearTemporarySnapshot,
    state, engine,
  } = useGameStore();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showingChoices, setShowingChoices] = useState(false);
  const [pendingConfirm, setPendingConfirm] = useState<ChoiceDefinition | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [pendingRollbackSnapId] = useState<string | null>(null);

  useEffect(() => {
    async function init() {
      try {
        const res = await fetch("/content/game-data.json");
        if (!res.ok) throw new Error(`加载失败: HTTP ${res.status}`);
        const validation = validateGameData(await res.json());
        if (!validation.success) throw new Error(`数据校验失败:\n${validation.error}`);
        loadGameData(validation.data as GameData);
        startNewGame();
        setLoading(false);
      } catch (e) {
        setError(e instanceof Error ? e.message : "未知错误");
        setLoading(false);
      }
    }
    init();
  }, [loadGameData, startNewGame]);

  useEffect(() => {
    setShowingChoices(false);
    setPendingConfirm(null);
  }, [state?.currentSceneId]);

  const currentScene = getCurrentScene();
  const visibleChoices = state && engine && currentScene
    ? engine.getVisibleChoices(currentScene.id, state) : [];
  const hasChoices = visibleChoices.length > 0;

  const handleAdvance = useCallback(() => {
    if (!currentScene) return;
    if (hasChoices && !showingChoices) { setShowingChoices(true); return; }
    if (!hasChoices && currentScene.nextSceneId) advanceScene(currentScene.nextSceneId);
  }, [currentScene, hasChoices, showingChoices, advanceScene]);

  const applyChoiceAndAdvance = useCallback((choice: ChoiceDefinition) => {
    const visibleEffects = choice.effects ? applyChoiceEffect(choice.effects) : [];
    recordHistoryEntry({
      sceneId: currentScene?.id ?? "", type: "choice", text: choice.text,
      visibleEffects, isCritical: choice.isCritical, isLocked: choice.isCritical,
    });
    advanceScene(choice.nextSceneId);
  }, [applyChoiceEffect, recordHistoryEntry, advanceScene, currentScene]);

  const handleSelectChoice = useCallback((choice: ChoiceDefinition) => {
    if (choice.isCritical) { setPendingConfirm(choice); return; }
    createSnapshot(`choice_${choice.id}`);
    applyChoiceAndAdvance(choice);
  }, [createSnapshot, applyChoiceAndAdvance]);

  const handleConfirmCritical = useCallback((choice: ChoiceDefinition) => {
    applyChoiceAndAdvance(choice);
    lockCriticalChoice(choice.id);
    setPendingConfirm(null);
  }, [applyChoiceAndAdvance, lockCriticalChoice]);

  const handleRollback = useCallback((entry: HistoryEntry) => {
    const snaps = useGameStore.getState().snapshots;
    const list = Object.values(snaps).sort((a, b) => a.createdAt - b.createdAt);
    const closest = list[list.length - 1];
    if (closest && rollback(closest.id)) clearTemporarySnapshot(closest.id);
  }, [rollback, clearTemporarySnapshot]);

  // 加载/错误
  if (loading) return (<GameViewport><div style={{width:"100%",height:"100%",display:"flex",alignItems:"center",justifyContent:"center",background:"var(--color-bg-dark)",color:"var(--color-text-secondary)",fontSize:24}}>正在加载…</div></GameViewport>);
  if (error) return (<GameViewport><div style={{width:"100%",height:"100%",display:"flex",alignItems:"center",justifyContent:"center",background:"var(--color-bg-dark)",color:"var(--color-change-negative)",fontSize:18,padding:64}}><pre>{error}</pre></div></GameViewport>);
  if (!state || !engine || !currentScene) return (<GameViewport><div style={{width:"100%",height:"100%",display:"flex",alignItems:"center",justifyContent:"center",background:"var(--color-bg-dark)",color:"var(--color-text-dim)",fontSize:24}}>无场景数据</div></GameViewport>);

  const chapter = engine.getChapter(state.chapterId);
  const showStatusBar = currentScene.showTopStatusBar !== false && chapter;
  const showDialogue = currentScene.showDialoguePanel !== false && currentScene.content;
  const canAdvance = hasChoices ? !showingChoices : !!currentScene.nextSceneId;
  const sceneClickAdvance = !showDialogue && !!currentScene.nextSceneId;
  const history = getHistory();

  const bottomArea = showingChoices || pendingConfirm ? (
    <ChoicePanel choices={visibleChoices} onSelect={handleSelectChoice}
      pendingConfirm={pendingConfirm} onConfirm={handleConfirmCritical}
      onCancelConfirm={() => setPendingConfirm(null)} />
  ) : (showDialogue && currentScene.content && (
    <DialoguePanel content={currentScene.content} onClickAdvance={handleAdvance} canAdvance={canAdvance} />
  ));

  return (
    <GameViewport>
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", background: "var(--color-bg-dark)", position: "relative" }}>
        {/* 场景区 — 固定 864px */}
        <SceneArea scene={currentScene}
          onClick={sceneClickAdvance ? () => advanceScene(currentScene.nextSceneId!) : undefined}
          clickable={sceneClickAdvance} />

        {/* 底部区域 — 固定 216px */}
        {bottomArea}

        {/* 状态栏 — 绝对定位叠加在场景上方 72px */}
        {showStatusBar && chapter && (
          <div style={{
            position: "absolute", top: 0, left: 0, right: 0,
            height: "var(--top-status-height)",
            display: "flex", alignItems: "stretch",
            zIndex: 10, pointerEvents: "auto",
          }}>
            <div style={{ flex: 1 }}>
              <StatusBar state={state} chapter={chapter} engine={engine} />
            </div>
            <button onClick={() => setShowHistory(!showHistory)} style={{
              padding: "0 24px", background: "rgba(10,8,6,0.92)",
              borderBottom: "2px solid #3a2818", borderLeft: "1px solid #3a2818",
              color: "var(--color-text-secondary)", fontSize: "var(--font-size-status)",
              cursor: "pointer", letterSpacing: 2, flexShrink: 0,
            }}
              onMouseEnter={e => { e.currentTarget.style.color = "var(--color-text-amber)"; }}
              onMouseLeave={e => { e.currentTarget.style.color = "var(--color-text-secondary)"; }}
            >履历</button>
          </div>
        )}

        {showHistory && (
          <HistoryPanel history={history} onRollback={handleRollback} onClose={() => setShowHistory(false)} />
        )}
      </div>
    </GameViewport>
  );
}
