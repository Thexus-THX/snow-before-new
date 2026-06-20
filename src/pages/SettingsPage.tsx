import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import GameViewport from "@/components/common/GameViewport";
import { useSettingsStore } from "@/app/stores/settingsStore";
import { useEndingGalleryStore } from "@/app/stores/endingGalleryStore";
import { clearSave } from "@/engine/saveManager";
import { audioManager } from "@/audio/AudioManager";

/**
 * SettingsPage — 旧档案设置面板
 */
export default function SettingsPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const fromGame = searchParams.get("from") === "game";
  const {
    masterVolume, musicVolume, ambienceVolume, sfxVolume, voiceVolume,
    isMuted, textSpeed,
    setMasterVolume, setMusicVolume, setAmbienceVolume,
    setSfxVolume, setVoiceVolume, toggleMute, setTextSpeed,
  } = useSettingsStore();

  const [showResetConfirm, setShowResetConfirm] = useState(false);

  useEffect(() => {
    audioManager.setMasterVolume(masterVolume);
    audioManager.setBgmVolume(musicVolume);
    audioManager.setAmbienceVolume(ambienceVolume);
    audioManager.setSfxVolume(sfxVolume);
    audioManager.setVoiceVolume(voiceVolume);
    audioManager.setMuted(isMuted);
  }, [masterVolume, musicVolume, ambienceVolume, sfxVolume, voiceVolume, isMuted]);

  // ===== 共享样式 =====
  const COLORS = {
    panelBg: "rgba(22, 17, 12, 0.72)",
    panelBorder: "rgba(176, 132, 72, 0.45)",
    label: "#b8a88c",
    gold: "#c8a860",
    dimGold: "#8a7050",
    textDim: "#6a6050",
    sliderTrack: "#3a3028",
    sliderFill: "#c8a860",
    sliderThumb: "#d4b878",
    sliderThumbBorder: "#a08050",
    btnBg: "rgba(42, 34, 22, 0.55)",
    btnBorder: "rgba(176, 132, 72, 0.38)",
    btnHoverBg: "rgba(62, 48, 28, 0.75)",
    btnHoverBorder: "rgba(200, 156, 80, 0.55)",
    dangerBorder: "rgba(160, 70, 60, 0.45)",
    dangerHoverBorder: "rgba(200, 90, 70, 0.6)",
  };

  // ===== 自定义滑块组件 =====
  const SliderRow = ({ label, value, onChange, disabled, showPercent = true }: {
    label: string; value: number; onChange: (v: number) => void;
    disabled?: boolean; showPercent?: boolean;
  }) => (
    <div style={{ display: "flex", alignItems: "center", gap: 14, opacity: disabled ? 0.42 : 1 }}>
      <span style={{ width: 72, color: COLORS.label, fontSize: 15, letterSpacing: "0.06em", flexShrink: 0 }}>
        {label}
      </span>
      <div style={{ flex: 1, position: "relative", height: 28, display: "flex", alignItems: "center" }}>
        {/* track */}
        <div style={{
          position: "absolute", left: 0, right: 0, height: 4,
          background: COLORS.sliderTrack, borderRadius: 2,
        }} />
        {/* fill */}
        <div style={{
          position: "absolute", left: 0, height: 4,
          width: `${value * 100}%`,
          background: COLORS.sliderFill, borderRadius: 2,
        }} />
        <input
          type="range" min={0} max={100} value={Math.round(value * 100)}
          onChange={(e) => onChange(Number(e.target.value) / 100)}
          disabled={disabled}
          style={{
            position: "absolute", left: 0, right: 0, height: 28,
            WebkitAppearance: "none", background: "transparent",
            cursor: disabled ? "not-allowed" : "pointer", margin: 0,
          }}
        />
        <style>{`
          input[type=range]::-webkit-slider-thumb {
            -webkit-appearance: none; width: 18px; height: 18px;
            background: ${COLORS.sliderThumb};
            border: 1px solid ${COLORS.sliderThumbBorder};
            border-radius: 2px; cursor: pointer;
            box-shadow: 0 1px 4px rgba(0,0,0,0.4);
          }
          input[type=range]::-webkit-slider-thumb:hover {
            background: #e0cc90; border-color: #c8a860;
          }
          input[type=range]:disabled::-webkit-slider-thumb {
            opacity: 0.5; cursor: not-allowed;
          }
        `}</style>
      </div>
      {showPercent && (
        <span style={{ width: 42, textAlign: "right", color: COLORS.textDim, fontSize: 13, fontVariantNumeric: "tabular-nums", flexShrink: 0 }}>
          {Math.round(value * 100)}%
        </span>
      )}
      {!showPercent && <span style={{ width: 42, flexShrink: 0 }} />}
    </div>
  );

  // ===== 自定义复选框 =====
  const Checkbox = ({ checked, onChange }: { checked: boolean; onChange: () => void }) => (
    <div
      onClick={onChange}
      style={{
        width: 18, height: 18, borderRadius: 2,
        border: `1px solid ${checked ? COLORS.gold : COLORS.panelBorder}`,
        background: checked ? "rgba(200, 168, 96, 0.3)" : "rgba(30, 24, 16, 0.5)",
        display: "flex", alignItems: "center", justifyContent: "center",
        cursor: "pointer", transition: "all 0.2s", flexShrink: 0,
      }}
      onMouseEnter={(e) => {
        if (!checked) e.currentTarget.style.borderColor = COLORS.gold;
      }}
      onMouseLeave={(e) => {
        if (!checked) e.currentTarget.style.borderColor = COLORS.panelBorder;
      }}
    >
      {checked && (
        <span style={{ color: COLORS.gold, fontSize: 12, lineHeight: 1 }}>✓</span>
      )}
    </div>
  );

  // ===== 分割线 =====
  const Divider = () => (
    <div style={{
      height: 1, margin: "6px 0",
      background: `linear-gradient(90deg, transparent, ${COLORS.panelBorder}, transparent)`,
    }} />
  );

  // ===== 分组标题 =====
  const SectionTitle = ({ text }: { text: string }) => (
    <div style={{
      fontSize: 15, fontWeight: 600, letterSpacing: "0.12em",
      color: COLORS.gold, marginBottom: 6, marginTop: 10,
      fontFamily: "var(--font-display), serif",
    }}>
      {text}
    </div>
  );

  return (
    <GameViewport>
      <div style={{
        width: 1920, height: 1080,
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        background: "radial-gradient(ellipse at 50% 45%, rgba(38,30,20,0.55) 0%, rgba(25,20,14,0.35) 40%, #0f1218 70%)",
        color: "#e8dfcf",
      }}>
        {/* ===== 设置面板 ===== */}
        <div style={{
          width: 680,
          padding: "42px 52px 36px",
          background: COLORS.panelBg,
          border: `1px solid ${COLORS.panelBorder}`,
          borderRadius: 3,
          boxShadow: "inset 0 0 28px rgba(0,0,0,0.45), 0 24px 70px rgba(0,0,0,0.5)",
          display: "flex", flexDirection: "column", gap: 0,
        }}>
          {/* 标题 */}
          <h1 style={{
            fontSize: 33, fontWeight: 400, letterSpacing: 8,
            marginBottom: 20, textAlign: "center",
            fontFamily: "var(--font-display), serif",
            color: "var(--color-text-primary)",
            textShadow: "0 3px 10px rgba(0,0,0,0.65)",
          }}>
            设置
          </h1>
          <Divider />

          {/* ===== 音频组 ===== */}
          <SectionTitle text="音频" />

          <div style={{ display: "flex", flexDirection: "column", gap: 14, marginTop: 4 }}>
            <SliderRow label="主音量" value={masterVolume} onChange={setMasterVolume} />
            <SliderRow label="音乐" value={musicVolume} onChange={setMusicVolume} disabled={isMuted} />
            <SliderRow label="环境音" value={ambienceVolume} onChange={setAmbienceVolume} disabled={isMuted} />
            <SliderRow label="音效" value={sfxVolume} onChange={setSfxVolume} disabled={isMuted} />
            {/* 语音 — 暂未启用 */}
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <span style={{ width: 72, color: COLORS.label, fontSize: 15, letterSpacing: "0.06em", flexShrink: 0 }}>
                语音
              </span>
              <span style={{ color: "rgba(180,160,140,0.4)", fontSize: 13, letterSpacing: "0.06em", fontStyle: "italic" }}>
                暂未启用
              </span>
            </div>

            {/* 静音 */}
            <div style={{ display: "flex", alignItems: "center", gap: 14, marginTop: 2 }}>
              <span style={{ width: 72, color: COLORS.label, fontSize: 15, letterSpacing: "0.06em", flexShrink: 0 }}>
                静音
              </span>
              <Checkbox checked={isMuted} onChange={toggleMute} />
              <span style={{ color: COLORS.textDim, fontSize: 13, marginLeft: 4 }}>
                {isMuted ? "已静音" : "未静音"}
              </span>
            </div>
          </div>

          <Divider />

          {/* ===== 阅读组 ===== */}
          <SectionTitle text="阅读" />

          <div style={{ display: "flex", alignItems: "center", gap: 14, marginTop: 4 }}>
            <span style={{ width: 72, color: COLORS.label, fontSize: 15, letterSpacing: "0.06em", flexShrink: 0 }}>
              文字速度
            </span>
            <div style={{ display: "flex", gap: 0 }}>
              {(["slow", "normal", "fast"] as const).map((s, i) => {
                const selected = textSpeed === s;
                return (
                  <button
                    key={s}
                    onClick={() => setTextSpeed(s)}
                    style={{
                      padding: "7px 18px",
                      fontSize: 14, letterSpacing: "0.06em",
                      fontFamily: "var(--font-display), serif",
                      border: `1px solid ${selected ? COLORS.gold : COLORS.panelBorder}`,
                      borderRadius: i === 0 ? "2px 0 0 2px" : i === 2 ? "0 2px 2px 0" : 0,
                      borderLeftWidth: i === 1 ? 0 : 1,
                      background: selected ? "rgba(200, 168, 96, 0.18)" : "rgba(35, 28, 18, 0.5)",
                      color: selected ? COLORS.gold : COLORS.label,
                      cursor: "pointer", transition: "all 0.2s",
                    }}
                    onMouseEnter={(e) => {
                      if (!selected) {
                        e.currentTarget.style.background = "rgba(55, 42, 24, 0.6)";
                        e.currentTarget.style.color = "#d4c8b0";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!selected) {
                        e.currentTarget.style.background = "rgba(35, 28, 18, 0.5)";
                        e.currentTarget.style.color = COLORS.label;
                      }
                    }}
                  >
                    {s === "slow" ? "慢" : s === "normal" ? "标准" : "快"}
                  </button>
                );
              })}
            </div>
          </div>

          <Divider />

          {/* ===== 操作组 ===== */}
          <SectionTitle text="操作" />

          <div style={{ display: "flex", justifyContent: "center", gap: 16, marginTop: 8 }}>
            {/* 返回按钮 */}
            <button
              onClick={() => navigate(fromGame ? "/game" : "/")}
              style={{
                width: 210, height: 48,
                fontSize: 16, fontWeight: 600, letterSpacing: "0.1em",
                fontFamily: "var(--font-display), serif",
                color: COLORS.label, background: COLORS.btnBg,
                border: `1px solid ${COLORS.btnBorder}`, borderRadius: 2,
                cursor: "pointer", transition: "all 0.2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = COLORS.btnHoverBg;
                e.currentTarget.style.borderColor = COLORS.btnHoverBorder;
                e.currentTarget.style.color = "#d4c8b0";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = COLORS.btnBg;
                e.currentTarget.style.borderColor = COLORS.btnBorder;
                e.currentTarget.style.color = COLORS.label;
              }}
              onMouseDown={(e) => { e.currentTarget.style.transform = "translateY(1px)"; }}
              onMouseUp={(e) => { e.currentTarget.style.transform = ""; }}
            >
              {fromGame ? "返回游戏" : "返回标题"}
            </button>

            {/* 清空存档 */}
            <button
              onClick={() => setShowResetConfirm(true)}
              style={{
                width: 210, height: 48,
                fontSize: 16, fontWeight: 600, letterSpacing: "0.1em",
                fontFamily: "var(--font-display), serif",
                color: "#c47868", background: "rgba(45, 22, 22, 0.45)",
                border: `1px solid ${COLORS.dangerBorder}`, borderRadius: 2,
                cursor: "pointer", transition: "all 0.2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(60, 28, 28, 0.55)";
                e.currentTarget.style.borderColor = COLORS.dangerHoverBorder;
                e.currentTarget.style.color = "#d49080";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "rgba(45, 22, 22, 0.45)";
                e.currentTarget.style.borderColor = COLORS.dangerBorder;
                e.currentTarget.style.color = "#c47868";
              }}
              onMouseDown={(e) => { e.currentTarget.style.transform = "translateY(1px)"; }}
              onMouseUp={(e) => { e.currentTarget.style.transform = ""; }}
            >
              清空存档
            </button>
          </div>
        </div>

        {/* ===== 确认弹窗 ===== */}
        {showResetConfirm && (
          <div
            onClick={() => setShowResetConfirm(false)}
            style={{
              position: "fixed", inset: 0, zIndex: 100,
              background: "rgba(0,0,0,0.75)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                width: 400, padding: "28px 32px", borderRadius: 3,
                border: `1px solid ${COLORS.dangerBorder}`,
                background: "#14100c",
                boxShadow: "0 16px 56px rgba(0,0,0,0.7)",
                display: "flex", flexDirection: "column", gap: 18, alignItems: "center",
              }}
            >
              <div style={{
                width: 40, height: 40, borderRadius: "50%",
                border: `2px solid #b85448`,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <span style={{ fontSize: 22, color: "#c45a46", fontWeight: 700 }}>!</span>
              </div>
              <h3 style={{
                margin: 0, fontSize: 17, fontFamily: "var(--font-display), serif",
                color: "#e8d4c4", letterSpacing: 3, textAlign: "center",
              }}>
                确认清零存档？
              </h3>
              <p style={{
                margin: 0, fontSize: 13, color: "#9a8070", lineHeight: 1.7, textAlign: "center",
              }}>
                此操作将清除所有游戏存档进度<br />
                包括结局图鉴解锁记录和多周目历史<br />
                <span style={{ color: "#b85448" }}>此操作无法撤销</span>
              </p>
              <div style={{ display: "flex", gap: 14 }}>
                <button
                  onClick={() => setShowResetConfirm(false)}
                  style={{
                    padding: "8px 26px", fontSize: 14,
                    border: `1px solid ${COLORS.btnBorder}`, borderRadius: 2,
                    background: COLORS.btnBg, color: COLORS.label, cursor: "pointer",
                  }}
                >
                  取消
                </button>
                <button
                  onClick={() => {
                    clearSave();
                    useEndingGalleryStore.getState().resetAllData();
                    setShowResetConfirm(false);
                  }}
                  style={{
                    padding: "8px 26px", fontSize: 14, fontWeight: 500,
                    border: `1px solid ${COLORS.dangerBorder}`, borderRadius: 2,
                    background: "rgba(80, 30, 30, 0.4)", color: "#d47a68", cursor: "pointer",
                  }}
                >
                  确定
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 底部 */}
        <p style={{
          fontSize: 12, color: "rgba(160,140,115,0.55)",
          marginTop: 28, letterSpacing: 2,
        }}>
          雪落之前 · 设置
        </p>
      </div>
    </GameViewport>
  );
}
