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
  // 初始化为当前正在播放的 BGM ID，避免从 TitlePage 进入时重播同 ID
  const prevBgmId = useRef<string | null>(audioManager.getCurrentBgmId());
  const prevSceneId = useRef<string | null>(null);

  useEffect(() => {
    if (!scene) return;

    const config = getSceneAudio(scene.id);
    const newBgmId = config.bgm ?? null;

    // 进入 SFX：每个场景切换时触发一次（同场景不重复）
    if (config.enterSfx && scene.id !== prevSceneId.current) {
      audioManager.playSfx(config.enterSfx);
    }
    prevSceneId.current = scene.id;

    // 只有 BGM ID 变化时才切换
    if (newBgmId !== prevBgmId.current) {
      if (DEBUG) {
        console.info(`[useSceneAudio] BGM 切换: ${prevBgmId.current ?? "(无)"} → ${newBgmId ?? "(无)"} (scene: ${scene.id})`);
      }

      prevBgmId.current = newBgmId;

      if (newBgmId) {
        audioManager.crossfadeBgm(newBgmId);
      }
      // 新场景无 BGM 时不停止，让当前 BGM 继续播放（如结局→致谢）

      // 切换环境音
      if (config.ambience && config.ambience.length > 0) {
        audioManager.playAmbience(config.ambience);
      } else {
        audioManager.stopAmbience();
      }
    }
  }, [scene]);

  // BGM 由场景切换逻辑接管，不在卸载时强制停止
  // （避免 StrictMode 双挂载导致 BGM 被误停）
}

/**
 * 标题页专用：播放标题 BGM
 */
export function useTitleBgm(): void {
  useEffect(() => {
    audioManager.crossfadeBgm("bgm.title");
  }, []);
}

export { audioManager };
