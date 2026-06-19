/**
 * useSceneAudio.ts — 场景音频 Hook
 *
 * 根据当前场景自动切换 BGM 和环境音。
 * 在 GamePage 顶层调用。
 */
import { useEffect, useRef } from "react";
import { audioManager } from "./AudioManager";
import { getSceneAudio } from "./audioSceneMap";
import type { SceneDefinition } from "@/schemas/types";

/**
 * 监听场景变化，自动更新音频
 * @param scene 当前场景对象（可能为 undefined）
 */
export function useSceneAudio(scene: SceneDefinition | undefined): void {
  const prevSceneId = useRef<string | null>(null);

  useEffect(() => {
    if (!scene) return;
    if (prevSceneId.current === scene.id) return;
    prevSceneId.current = scene.id;

    const config = getSceneAudio(scene.id);

    // 切换 BGM
    if (config.bgm) {
      audioManager.crossfadeBgm(config.bgm);
    }

    // 切换环境音
    if (config.ambience && config.ambience.length > 0) {
      audioManager.playAmbience(config.ambience);
    } else {
      audioManager.stopAmbience();
    }

    // 进入 SFX
    if (config.enterSfx) {
      audioManager.playSfx(config.enterSfx);
    }
  }, [scene]);
}

/**
 * 标题页专用：播放标题 BGM
 */
export function useTitleBgm(): void {
  useEffect(() => {
    audioManager.crossfadeBgm("bgm.title");
    return () => {
      // 不在此处停止，由后续场景接管
    };
  }, []);
}

export { audioManager };
