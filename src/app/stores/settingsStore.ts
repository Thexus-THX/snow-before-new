import { create } from "zustand";

/**
 * settingsStore — 用户设置
 *
 * 管理音量、文字速度、静音等简单键值。
 * 通过 LocalStorage 持久化。
 */
interface SettingsStore {
  // ---- 音量 ----
  masterVolume: number; // 0-1, 默认 0.8
  musicVolume: number; // 0-1, 默认 0.45 (bgm)
  ambienceVolume: number; // 0-1, 默认 0.35
  sfxVolume: number; // 0-1, 默认 0.6
  voiceVolume: number; // 0-1, 默认 0.8
  isMuted: boolean;

  // ---- 文字速度 ----
  textSpeed: "slow" | "normal" | "fast";

  // ---- 其他 ----
  tutorialDismissed: boolean;

  // ---- 操作方法 ----
  setMasterVolume: (v: number) => void;
  setMusicVolume: (v: number) => void;
  setAmbienceVolume: (v: number) => void;
  setSfxVolume: (v: number) => void;
  setVoiceVolume: (v: number) => void;
  toggleMute: () => void;
  setTextSpeed: (speed: "slow" | "normal" | "fast") => void;
  dismissTutorial: () => void;

  // ---- 持久化 ----
  load: () => void;
  save: () => void;
}

function loadSettings(): Partial<SettingsStore> {
  try {
    const raw = localStorage.getItem("snow-before-v1-settings");
    if (!raw) return {};
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

const saved = loadSettings();

export const useSettingsStore = create<SettingsStore>((set, get) => ({
  // 默认值（STEP 04 要求：不要太大）
  masterVolume: saved.masterVolume ?? 0.8,
  musicVolume: saved.musicVolume ?? 0.45,
  ambienceVolume: saved.ambienceVolume ?? 0.35,
  sfxVolume: saved.sfxVolume ?? 0.6,
  voiceVolume: saved.voiceVolume ?? 0.8,
  isMuted: saved.isMuted ?? false,
  textSpeed: saved.textSpeed ?? "normal",
  tutorialDismissed: saved.tutorialDismissed ?? false,

  setMasterVolume: (v: number) => {
    set({ masterVolume: Math.max(0, Math.min(1, v)) });
    get().save();
  },
  setMusicVolume: (v: number) => {
    set({ musicVolume: Math.max(0, Math.min(1, v)) });
    get().save();
  },
  setAmbienceVolume: (v: number) => {
    set({ ambienceVolume: Math.max(0, Math.min(1, v)) });
    get().save();
  },
  setSfxVolume: (v: number) => {
    set({ sfxVolume: Math.max(0, Math.min(1, v)) });
    get().save();
  },
  setVoiceVolume: (v: number) => {
    set({ voiceVolume: Math.max(0, Math.min(1, v)) });
    get().save();
  },
  toggleMute: () => {
    set((s) => ({ isMuted: !s.isMuted }));
    get().save();
  },
  setTextSpeed: (speed: "slow" | "normal" | "fast") => {
    set({ textSpeed: speed });
    get().save();
  },
  dismissTutorial: () => {
    set({ tutorialDismissed: true });
    localStorage.setItem("snow-before-v1-tutorial-dismissed", "true");
    get().save();
  },
  load: () => {
    const s = loadSettings();
    if (Object.keys(s).length > 0) {
      set(s as Partial<SettingsStore>);
    }
  },
  save: () => {
    const { masterVolume, musicVolume, ambienceVolume, sfxVolume, voiceVolume, isMuted, textSpeed, tutorialDismissed } = get();
    const payload = { masterVolume, musicVolume, ambienceVolume, sfxVolume, voiceVolume, isMuted, textSpeed, tutorialDismissed };
    localStorage.setItem("snow-before-v1-settings", JSON.stringify(payload));
  },
}));
