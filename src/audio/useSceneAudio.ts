/**
 * useSceneAudio.ts — 场景音频 Hook
 *
 * 根据当前场景自动切换 BGM 和环境音。
 * 在 GamePage 顶层调用。
 *
 * STEP 04：增强清理逻辑，场景切换时正确淡出/停止。
 */
import { useEffect, useRef } from "react";
import { audioManager } from "./AudioManager";
import { getSceneAudio } from "./audioSceneMap";
import type { SceneDefinition } from "@/schemas/types";

const DEBUG = import.meta.env.DEV;

/**
 * 监听场景变化，自动更新音频
 * @param scene 当前场景对象（可能为 undefined）
 */
export function useSceneAudio(scene: SceneDefinition | undefined): void {
  const prevBgmId = useRef<string | null>(null);

  useEffect(() => {
    if (!scene) return;

    const config = getSceneAudio(scene.id);
    const newBgmId = config.bgm ?? null;

    // 只有 BGM ID 变化时才切换
    if (newBgmId !== prevBgmId.current) {
      if (DEBUG) {
        console.info(`[useSceneAudio] BGM 切换: ${prevBgmId.current ?? "(无)"} → ${newBgmId ?? "(无)"} (scene: ${scene.id})`);
      }

      prevBgmId.current = newBgmId;

      if (newBgmId) {
        audioManager.crossfadeBgm(newBgmId);
      } else {
        audioManager.stopBgm();
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
    }
  }, [scene]);

  // 组件卸载时停止所有音频
  useEffect(() => {
    return () => {
      audioManager.stopAll();
    };
  }, []);
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
