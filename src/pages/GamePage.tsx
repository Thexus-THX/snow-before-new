import { useEffect, useState, useCallback, useRef } from "react";
import GameViewport from "@/components/common/GameViewport";
import SceneRenderer from "@/components/scenes/SceneRenderer";
import { useGameStore } from "@/app/stores/gameStore";
import { validateGameData } from "@/schemas/gameSchema";
import { hasValidSave } from "@/engine/saveManager";
import { buildHistoryEntryFromScene } from "@/engine/sceneHistory";
import { audioManager } from "@/audio/AudioManager";
import { useSceneAudio } from "@/audio/useSceneAudio";
import type { GameData, ChoiceDefinition, HistoryEntry, ResolvedChoice } from "@/schemas/types";
import gameDataRaw from "@/content/game-data.json";

/**
 * GamePage — 游戏运行器
 *
 * 职责：
 * - 初始化游戏数据、处理启动意图（新游戏/继续/直接访问）
 * - 持有所有状态变量和回调函数
 * - 通过 SceneRenderer 按 scene.template 分发到对应场景组件
 * - 在场景推进前记录特殊场景的历史记录
 *
 * 比例（来自 data schema）：
 * - sceneHeight: 864  (80%)
 * - dialogueHeight: 216 (20%)
 * - topStatusHeight: 72 (叠加在场景上，不占独立空间)
 */
export default function GamePage() {
  const {
    loadGameData, startNewGame, continueGame, getCurrentScene, advanceScene,
    commitChoice, rollbackToHistoryEntry, getHistory, recordHistoryEntry,
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

    // 进入游戏时停止标题 BGM
    audioManager.stopBgm();

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

  // 推进场景（统一入口）：在推进前记录当前特殊场景的历史
  const handleAdvance = useCallback((nextSceneId: string) => {
    if (!currentScene) return;

    // 有选项但未显示 → 显示选项（无论 nextSceneId 是否为空）
    if (hasChoices && !showingChoices) {
      setShowingChoices(true);
      return;
    }

    // 需要有效的 nextSceneId 才能推进
    if (!nextSceneId) return;

    // 特殊场景（非 standardDialogue）：离开前记录历史
    if (currentScene.template !== "standardDialogue") {
      const historyEntry = buildHistoryEntryFromScene(currentScene);
      if (historyEntry) {
        recordHistoryEntry(historyEntry);
      }
    }

    advanceScene(nextSceneId);
  }, [currentScene, hasChoices, showingChoices, advanceScene, recordHistoryEntry]);

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

  const history = getHistory();

  // 场景音频
  useSceneAudio(currentScene);

  // 加载/错误
  if (loading) return (<GameViewport><div style={{width:"100%",height:"100%",display:"flex",alignItems:"center",justifyContent:"center",background:"var(--color-bg-dark)",color:"var(--color-text-secondary)",fontSize:24}}>正在加载…</div></GameViewport>);
  if (error) return (<GameViewport><div style={{width:"100%",height:"100%",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",background:"var(--color-bg-dark)",color:"var(--color-change-negative)",fontSize:16,padding:64,gap:16}}><p style={{fontSize:22,color:"var(--color-text-amber)"}}>数据加载失败</p><pre style={{whiteSpace:"pre-wrap",maxWidth:800,lineHeight:1.6}}>{error}</pre></div></GameViewport>);
  if (!state || !engine || !currentScene) return (<GameViewport><div style={{width:"100%",height:"100%",display:"flex",alignItems:"center",justifyContent:"center",background:"var(--color-bg-dark)",color:"var(--color-text-dim)",fontSize:24}}>无场景数据</div></GameViewport>);

  return (
    <GameViewport>
      <SceneRenderer
        scene={currentScene}
        state={state}
        engine={engine}
        onAdvance={handleAdvance}
        onSelectChoice={handleSelectChoice}
        onConfirmCritical={handleConfirmCritical}
        onCancelConfirm={() => setPendingConfirm(null)}
        onRollback={handleRollback}
        onToggleHistory={() => setShowHistory(!showHistory)}
        resolvedChoices={resolvedChoices}
        showingChoices={showingChoices}
        pendingConfirm={pendingConfirm}
        hasChoices={hasChoices}
        history={history}
        showHistory={showHistory}
      />
    </GameViewport>
  );
}
