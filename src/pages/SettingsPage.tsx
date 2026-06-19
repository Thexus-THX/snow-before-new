import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import GameViewport from "@/components/common/GameViewport";
import { useSettingsStore } from "@/app/stores/settingsStore";
import { getTitleBgm } from "@/engine/audioManager";

/**
 * SettingsPage — 设置页面
 *
 * 音量调节实时生效于全局 BGM 实例。
 */
export default function SettingsPage() {
  const navigate = useNavigate();
  const {
    masterVolume,
    musicVolume,
    sfxVolume,
    voiceVolume,
    isMuted,
    textSpeed,
    setMasterVolume,
    setMusicVolume,
    setSfxVolume,
    setVoiceVolume,
    toggleMute,
    setTextSpeed,
  } = useSettingsStore();

  // 实时同步音量到全局 BGM
  useEffect(() => {
    const bgm = getTitleBgm();
    if (!bgm) return;
    const effectiveVolume = isMuted ? 0 : masterVolume * musicVolume;
    bgm.volume = Math.max(0, Math.min(1, effectiveVolume));
  }, [musicVolume, isMuted, masterVolume]);

  const sliderStyle: React.CSSProperties = {
    width: 200,
    accentColor: "#d4a843",
  };

  return (
    <GameViewport>
    <div
      style={{
        width: 1920,
        height: 1080,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(180deg, #0d1520 0%, #1a2a3a 100%)",
        color: "#e8dfcf",
      }}
    >
      <h1
        style={{
          fontSize: 36,
          fontWeight: 400,
          letterSpacing: 8,
          marginBottom: 48,
          fontFamily: "serif",
        }}
      >
        设置
      </h1>

      <div style={{ width: 400, display: "flex", flexDirection: "column", gap: 24 }}>
        {/* 主音量 */}
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <span style={{ width: 80, color: "#b8a88c" }}>主音量</span>
          <input
            type="range"
            min={0}
            max={100}
            value={Math.round(masterVolume * 100)}
            onChange={(e) => setMasterVolume(Number(e.target.value) / 100)}
            style={sliderStyle}
            disabled={isMuted}
          />
          <span style={{ width: 40, textAlign: "right", color: "#6a6050" }}>
            {Math.round(masterVolume * 100)}%
          </span>
        </div>

        {/* 音乐 */}
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <span style={{ width: 80, color: "#b8a88c" }}>音乐</span>
          <input
            type="range"
            min={0}
            max={100}
            value={Math.round(musicVolume * 100)}
            onChange={(e) => setMusicVolume(Number(e.target.value) / 100)}
            style={sliderStyle}
            disabled={isMuted}
          />
        </div>

        {/* 音效 */}
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <span style={{ width: 80, color: "#b8a88c" }}>音效</span>
          <input
            type="range"
            min={0}
            max={100}
            value={Math.round(sfxVolume * 100)}
            onChange={(e) => setSfxVolume(Number(e.target.value) / 100)}
            style={sliderStyle}
            disabled={isMuted}
          />
        </div>

        {/* 语音 */}
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <span style={{ width: 80, color: "#b8a88c" }}>语音</span>
          <input
            type="range"
            min={0}
            max={100}
            value={Math.round(voiceVolume * 100)}
            onChange={(e) => setVoiceVolume(Number(e.target.value) / 100)}
            style={sliderStyle}
            disabled={isMuted}
          />
        </div>

        {/* 静音 */}
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <span style={{ width: 80, color: "#b8a88c" }}>静音</span>
          <label style={{ cursor: "pointer" }}>
            <input
              type="checkbox"
              checked={isMuted}
              onChange={toggleMute}
              style={{ accentColor: "#d4a843", width: 18, height: 18 }}
            />
          </label>
        </div>

        <hr style={{ border: "none", borderTop: "1px solid #3a2a18" }} />

        {/* 文字速度 */}
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <span style={{ width: 80, color: "#b8a88c" }}>文字速度</span>
          <div style={{ display: "flex", gap: 8 }}>
            {(["slow", "normal", "fast"] as const).map((s) => (
              <button
                key={s}
                onClick={() => setTextSpeed(s)}
                style={{
                  padding: "6px 20px",
                  border: "1px solid #5a5040",
                  borderRadius: 4,
                  background:
                    textSpeed === s
                      ? "rgba(212, 168, 67, 0.2)"
                      : "rgba(42, 34, 24, 0.4)",
                  color: textSpeed === s ? "#d4a843" : "#b8a88c",
                  cursor: "pointer",
                }}
              >
                {s === "slow" ? "慢" : s === "normal" ? "标准" : "快"}
              </button>
            ))}
          </div>
        </div>
      </div>

      <button
        onClick={() => navigate("/")}
        style={{
          marginTop: 48,
          padding: "12px 48px",
          border: "1px solid #5a5040",
          borderRadius: 4,
          background: "rgba(42, 34, 24, 0.4)",
          color: "#b8a88c",
          cursor: "pointer",
          fontSize: 16,
        }}
      >
        返回标题
      </button>

      <p style={{ fontSize: 14, color: "#6a6050", marginTop: 32 }}>
        阶段 1 · 项目骨架
      </p>
    </div>
    </GameViewport>
  );
}
