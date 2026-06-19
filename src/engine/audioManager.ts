/**
 * audioManager.ts — 全局音频管理器（轻量级单例）
 *
 * 管理标题 BGM 的全局实例，使其可以在 TitlePage 和 SettingsPage 之间共享。
 * 页面切到后台时自动暂停，恢复前台时仅在之前正在播放时才恢复。
 */

let titleBgm: HTMLAudioElement | null = null;
let wasPlayingBeforeHidden = false;
const TITLE_BGM_PATH = "/assets/audio/bgm/bgm_00_title.ogg";
let visibilityHandlerRegistered = false;

/**
 * 注册页面可见性变化监听：页面隐藏时暂停 BGM，恢复时仅在之前播放中才恢复
 */
function registerVisibilityHandler(): void {
  if (visibilityHandlerRegistered) return;
  visibilityHandlerRegistered = true;

  document.addEventListener("visibilitychange", () => {
    if (!titleBgm) return;

    if (document.hidden) {
      wasPlayingBeforeHidden = !titleBgm.paused;
      titleBgm.pause();
    } else {
      // 只在之前正在播放时才恢复
      if (wasPlayingBeforeHidden) {
        titleBgm.play().catch(() => {});
      }
    }
  });
}

/**
 * 取消注册可见性监听（BGM 实例销毁时调用）
 */
function unregisterVisibilityHandler(): void {
  // 不取消全局监听，保持简单
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
