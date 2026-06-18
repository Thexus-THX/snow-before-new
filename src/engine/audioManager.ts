/**
 * audioManager.ts — 全局音频管理器（轻量级单例）
 *
 * 管理标题 BGM 的全局实例，使其可以在 TitlePage 和 SettingsPage 之间共享。
 * 页面切到后台时自动静音，恢复前台时恢复播放。
 * 后续阶段可扩展为完整 AudioManager。
 */

let titleBgm: HTMLAudioElement | null = null;
const TITLE_BGM_PATH = "/assets/audio/bgm/bgm_00_title.ogg";
let visibilityHandlerRegistered = false;

/**
 * 注册页面可见性变化监听：页面隐藏时暂停 BGM，恢复时继续播放
 */
function registerVisibilityHandler(): void {
  if (visibilityHandlerRegistered) return;
  visibilityHandlerRegistered = true;

  document.addEventListener("visibilitychange", () => {
    if (!titleBgm) return;

    if (document.hidden) {
      // 页面切到后台：暂停
      titleBgm.pause();
    } else {
      // 页面回到前台：恢复播放
      titleBgm.play().catch(() => {});
    }
  });
}

/**
 * 获取或创建标题 BGM 实例（全局单例）
 */
export function ensureTitleBgm(): HTMLAudioElement {
  if (!titleBgm) {
    titleBgm = new Audio(TITLE_BGM_PATH);
    titleBgm.loop = true;
    titleBgm.volume = 0.6; // 初始默认值，后续由 settingsStore 覆盖
  }
  registerVisibilityHandler();
  return titleBgm;
}

/**
 * 获取标题 BGM 实例（可能为 null）
 */
export function getTitleBgm(): HTMLAudioElement | null {
  return titleBgm;
}

/**
 * 停止并重置标题 BGM
 */
export function stopTitleBgm(): void {
  if (titleBgm) {
    titleBgm.pause();
    titleBgm.currentTime = 0;
  }
}

/**
 * 销毁标题 BGM 实例
 */
export function destroyTitleBgm(): void {
  if (titleBgm) {
    titleBgm.pause();
    titleBgm.src = "";
    titleBgm = null;
  }
}
