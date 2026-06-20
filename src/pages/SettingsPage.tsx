import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import GameViewport from "@/components/common/GameViewport";
import { useSettingsStore } from "@/app/stores/settingsStore";
import { useEndingGalleryStore } from "@/app/stores/endingGalleryStore";
import { clearSave } from "@/engine/saveManager";
import { audioManager } from "@/audio/AudioManager";

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
    ambienceVolume,
    sfxVolume,
    voiceVolume,
    isMuted,
    textSpeed,
    setMasterVolume,
    setMusicVolume,
    setAmbienceVolume,
    setSfxVolume,
    setVoiceVolume,
    toggleMute,
    setTextSpeed,
  } = useSettingsStore();

  const [showResetConfirm, setShowResetConfirm] = useState(false);

  // 实时同步音量到 AudioManager
  useEffect(() => {
    audioManager.setMasterVolume(masterVolume);
    audioManager.setBgmVolume(musicVolume);
    audioManager.setAmbienceVolume(ambienceVolume);
    audioManager.setSfxVolume(sfxVolume);
    audioManager.setVoiceVolume(voiceVolume);
    audioManager.setMuted(isMuted);
  }, [masterVolume, musicVolume, ambienceVolume, sfxVolume, voiceVolume, isMuted]);

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

        {/* 环境音 */}
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <span style={{ width: 80, color: "#b8a88c" }}>环境音</span>
          <input
            type="range"
            min={0}
            max={100}
            value={Math.round(ambienceVolume * 100)}
            onChange={(e) => setAmbienceVolume(Number(e.target.value) / 100)}
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

      {/* 清零存档按钮 */}
      <button
        onClick={() => setShowResetConfirm(true)}
        style={{
          marginTop: 16,
          padding: "10px 40px",
          border: "1px solid #6a3030",
          borderRadius: 4,
          background: "rgba(60, 24, 24, 0.3)",
          color: "#c47868",
          cursor: "pointer",
          fontSize: 14,
          letterSpacing: 2,
        }}
      >
        清 零 存 档
      </button>

      {/* 确认警告弹窗 */}
      {showResetConfirm && (
        <div
          onClick={() => setShowResetConfirm(false)}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 100,
            background: "rgba(0,0,0,0.75)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: 420,
              padding: "32px 36px",
              borderRadius: 4,
              border: "1.5px solid #5a3830",
              background: "#14100c",
              boxShadow: "0 12px 48px rgba(0,0,0,0.7)",
              display: "flex",
              flexDirection: "column",
              gap: 20,
              alignItems: "center",
            }}
          >
            {/* 警告图标 */}
            <div style={{
              width: 44,
              height: 44,
              borderRadius: "50%",
              border: "2px solid #b85448",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}>
              <span style={{ fontSize: 24, color: "#c45a46", fontWeight: 700 }}>!</span>
            </div>

            {/* 警告文字 */}
            <h3 style={{
              margin: 0,
              fontSize: 18,
              fontFamily: "var(--font-display), serif",
              color: "#e8d4c4",
              letterSpacing: 4,
              textAlign: "center",
            }}>
              确认清零存档？
            </h3>
            <p style={{
              margin: 0,
              fontSize: 13,
              color: "#9a8070",
              lineHeight: 1.8,
              textAlign: "center",
            }}>
              此操作将清除所有游戏存档进度<br />
              包括结局图鉴解锁记录和多周目历史<br />
              <span style={{ color: "#b85448" }}>此操作无法撤销</span>
            </p>

            {/* 按钮 */}
            <div style={{ display: "flex", gap: 16 }}>
              <button
                onClick={() => setShowResetConfirm(false)}
                style={{
                  padding: "8px 28px",
                  border: "1px solid #5a5040",
                  borderRadius: 4,
                  background: "rgba(42, 34, 24, 0.5)",
                  color: "#b8a88c",
                  cursor: "pointer",
                  fontSize: 14,
                }}
              >
                取消
              </button>
              <button
                onClick={() => {
                  // 清除游戏存档
                  clearSave();
                  // 重置图鉴 store（解锁记录 + 周目历史）
                  const gallery = useEndingGalleryStore.getState();
                  gallery.resetAllData();
                  setShowResetConfirm(false);
                }}
                style={{
                  padding: "8px 28px",
                  border: "1px solid #8a3030",
                  borderRadius: 4,
                  background: "rgba(120, 32, 32, 0.35)",
                  color: "#d47a68",
                  cursor: "pointer",
                  fontSize: 14,
                  fontWeight: 500,
                }}
              >
                确定
              </button>
            </div>
          </div>
        </div>
      )}

      <p style={{ fontSize: 14, color: "#6a6050", marginTop: 32 }}>
        雪落之前 · 设置
      </p>
    </div>
    </GameViewport>
  );
}
