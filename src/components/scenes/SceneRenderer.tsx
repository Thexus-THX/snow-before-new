import StandardDialogueScene from "./StandardDialogueScene";
import ChapterIntroScene from "./ChapterIntroScene";
import LetterScene from "./LetterScene";
import HistoricalEventScene from "./HistoricalEventScene";
import SeasonJournalScene from "./SeasonJournalScene";
import EndingScene from "./EndingScene";
import FreeLayoutScene from "./FreeLayoutScene";
import SceneFallback from "./SceneFallback";
import type { SceneRendererProps } from "./sceneRendererTypes";
import type { SceneTemplate } from "@/schemas/types";

/**
 * SceneRenderer — 统一场景渲染分发器
 *
 * 按 scene.template 穷尽分发到对应组件：
 * - standardDialogue → StandardDialogueScene
 * - chapterIntro → ChapterIntroScene
 * - letter → LetterScene
 * - historicalEvent → HistoricalEventScene
 * - seasonJournal → SeasonJournalScene
 * - ending → EndingScene
 * - freeLayout → FreeLayoutScene
 * - 未知模板 → SceneFallback
 *
 * TypeScript 会对 SceneTemplate 进行穷尽检查。
 */
export default function SceneRenderer(props: SceneRendererProps) {
  const { scene, state, engine } = props;

  // 特殊场景公共 Props
  const specialProps = {
    scene,
    state,
    engine,
    onAdvance: (nextSceneId: string) => props.onAdvance(nextSceneId),
  };

  const template: SceneTemplate = scene.template;

  switch (template) {
    case "standardDialogue":
      return <StandardDialogueScene {...props} />;

    case "chapterIntro":
      return <ChapterIntroScene {...specialProps} />;

    case "letter":
      return <LetterScene {...specialProps} />;

    case "historicalEvent":
      return <HistoricalEventScene {...specialProps} />;

    case "seasonJournal":
      return <SeasonJournalScene {...specialProps} />;

    case "ending":
      return <EndingScene {...specialProps} />;

    case "freeLayout":
      return <FreeLayoutScene {...specialProps} />;

    default: {
      // TypeScript 穷尽检查
      const _exhaustive: never = template;
      void _exhaustive;
      return <SceneFallback {...specialProps} />;
    }
  }
}
