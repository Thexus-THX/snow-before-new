import { useEffect, useState, useCallback, useRef } from "react";
import GameViewport from "@/components/common/GameViewport";
import StatusBar from "@/components/game/StatusBar";
import SceneArea from "@/components/game/SceneArea";
import DialoguePanel from "@/components/game/DialoguePanel";
import ChoicePanel from "@/components/game/ChoicePanel";
import HistoryPanel from "@/components/game/HistoryPanel";
import { useGameStore } from "@/app/stores/gameStore";
import { validateGameData } from "@/schemas/gameSchema";
import { hasValidSave } from "@/engine/saveManager";
import type { GameData, ChoiceDefinition, HistoryEntry, ResolvedChoice } from "@/schemas/types";
import gameDataRaw from "@/content/game-data.json";

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
    loadGameData, startNewGame, continueGame, getCurrentScene, advanceScene,
    commitChoice, rollbackToHistoryEntry, getHistory,
    state, engine, gameData, launchMode,
  } = useGameStore();

  const initializedRef = useRef(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showingChoices, setShowingChoices] = useState(false);
  const [pendingConfirm, setPendingConfirm] = useState<ChoiceDefinition | null>(null);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    // 防止 StrictMode 双重初始化
    if (initializedRef.current) return;

    try {
      const validation = validateGameData(gameDataRaw);
      if (!validation.success) throw new Error(`数据校验失败:\n${validation.error}`);
      const gd = validation.data as GameData;

      // 加载数据
      loadGameData(gd);

      // 根据启动意图执行
      if (launchMode === "new") {
        // 明确新游戏：清空存档后开始
        startNewGame();
      } else if (launchMode === "continue") {
        // 明确继续：尝试读档，失败则回退到新游戏
        const result = continueGame();
        if (!result.success) {
          console.warn("[GamePage] 继续游戏失败:", result.reason, "— 回退到新游戏");
          startNewGame();
        }
      } else {
        // 无启动意图（直接访问 /game）：
        // 优先继续有效存档，没有有效存档才新建
        if (gd && hasValidSave(gd)) {
          const result = continueGame();
          if (!result.success) {
            startNewGame();
          }
        } else {
          startNewGame();
        }
      }

      initializedRef.current = true;
      setLoading(false);
    } catch (e) {
      console.error("[init] 错误:", e);
      setError(e instanceof Error ? e.message : "未知错误");
      setLoading(false);
    }
  }, [loadGameData, startNewGame, continueGame, launchMode]);

  useEffect(() => {
    setShowingChoices(false);
    setPendingConfirm(null);
  }, [state?.currentSceneId]);

  const currentScene = getCurrentScene();
  const resolvedChoices: ResolvedChoice[] = state && engine && currentScene
    ? engine.getResolvedChoices(currentScene.id, state) : [];
  const hasChoices = resolvedChoices.length > 0;

  const handleAdvance = useCallback(() => {
    if (!currentScene) return;
    if (hasChoices && !showingChoices) { setShowingChoices(true); return; }
    if (!hasChoices && currentScene.nextSceneId) advanceScene(currentScene.nextSceneId);
  }, [currentScene, hasChoices, showingChoices, advanceScene]);

  const handleSelectChoice = useCallback((choice: ChoiceDefinition) => {
    if (choice.isCritical) { setPendingConfirm(choice); return; }
    // 普通选择：直接通过 commitChoice 原子事务处理
    const result = commitChoice(choice);
    if (!result.ok) {
      console.warn("[GamePage] commitChoice 失败:", result.reason);
    }
  }, [commitChoice]);

  const handleConfirmCritical = useCallback((choice: ChoiceDefinition) => {
    // 关键选择：通过 commitChoice 原子事务处理
    const result = commitChoice(choice);
    if (!result.ok) {
      console.warn("[GamePage] 关键选择提交失败:", result.reason);
    }
    setPendingConfirm(null);
  }, [commitChoice]);

  const handleRollback = useCallback((entry: HistoryEntry) => {
    const result = rollbackToHistoryEntry(entry);
    if (!result.success) {
      console.warn("[GamePage] 回滚失败:", result.reason);
    }
  }, [rollbackToHistoryEntry]);

  // 加载/错误
  if (loading) return (<GameViewport><div style={{width:"100%",height:"100%",display:"flex",alignItems:"center",justifyContent:"center",background:"var(--color-bg-dark)",color:"var(--color-text-secondary)",fontSize:24}}>正在加载…</div></GameViewport>);
  if (error) return (<GameViewport><div style={{width:"100%",height:"100%",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",background:"var(--color-bg-dark)",color:"var(--color-change-negative)",fontSize:16,padding:64,gap:16}}><p style={{fontSize:22,color:"var(--color-text-amber)"}}>数据加载失败</p><pre style={{whiteSpace:"pre-wrap",maxWidth:800,lineHeight:1.6}}>{error}</pre></div></GameViewport>);
  if (!state || !engine || !currentScene) return (<GameViewport><div style={{width:"100%",height:"100%",display:"flex",alignItems:"center",justifyContent:"center",background:"var(--color-bg-dark)",color:"var(--color-text-dim)",fontSize:24}}>无场景数据</div></GameViewport>);

  const chapter = engine.getChapter(state.chapterId);
  const showStatusBar = currentScene.showTopStatusBar !== false && chapter;
  const showDialogue = currentScene.showDialoguePanel !== false && currentScene.content;
  const canAdvance = hasChoices ? !showingChoices : !!currentScene.nextSceneId;
  const sceneClickAdvance = !showDialogue && !!currentScene.nextSceneId;
  const history = getHistory();

  const bottomArea = showingChoices || pendingConfirm ? (
    <ChoicePanel choices={resolvedChoices} onSelect={handleSelectChoice}
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
