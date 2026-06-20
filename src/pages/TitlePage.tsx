import { useEffect, useRef, useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import GameViewport from "@/components/common/GameViewport";
import { useGameStore } from "@/app/stores/gameStore";
import { useSettingsStore } from "@/app/stores/settingsStore";
import { validateGameData } from "@/schemas/gameSchema";
import { hasValidSave } from "@/engine/saveManager";
import type { GameData } from "@/schemas/types";
import gameDataRaw from "@/content/game-data.json";
import { audioManager } from "@/audio/AudioManager";

/** 像素雪花粒子 */
interface Snowflake {
  x: number;
  y: number;
  size: number;      // 2-5px
  speed: number;     // 基础速度
  opacity: number;   // 0.2-0.8
  wobble: number;    // 横向摆动相位
}

/** 烟雾粒子 */
interface SmokeParticle {
  x: number;
  y: number;
  size: number;       // 初始 3-6px
  opacity: number;    // 0.3-0.7
  vx: number;         // 横向漂移速度
  vy: number;         // 上升速度
  life: number;       // 剩余生命 0-1
  decay: number;      // 每帧衰减
}

/** 火车灯光源 */
interface LightSource {
  x: number;
  y: number;
  radius: number;     // 光晕半径
  flickerPhase: number;
  flickerSpeed: number;
}

/** 25° 方向向量（归一化）：右上→左下 */
const ANGLE = 25 * (Math.PI / 180);
const DX = -Math.cos(ANGLE);  // ≈ -0.906
const DY =  Math.sin(ANGLE);  // ≈  0.423

const CANVAS_W = 1920;
const CANVAS_H = 1080;
const SNOW_COUNT = 160;

// 烟雾发射源（火车烟囱在背景图上的逻辑坐标，可调整）
const SMOKE_ORIGIN_X = 1400;    // 烟囱 X
const SMOKE_ORIGIN_Y = 330;    // 烟囱 Y（出气口）
const SMOKE_SPAWN_RATE = 6.5;  // 每帧生成粒子数（dt归一化后）
const SMOKE_MAX = 200;

// 像素风圆形：边缘带随机锯齿，不完美圆
function drawPixelCircle(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number) {
  if (r <= 0) return;
  for (let dy = -r; dy <= r; dy++) {
    const dxMax = Math.round(Math.sqrt(r * r - dy * dy));
    // 像素锯齿：边缘随机缩进 0~2px
    const jitter = r > 4 ? Math.floor(Math.random() * 3) : 0;
    const dxJitter = Math.max(0, dxMax - jitter);
    for (let dx = -dxJitter; dx <= dxJitter; dx++) {
      ctx.fillRect(cx + dx, cy + dy, 1, 1);
    }
  }
}

// 三个复古火车橙黄色灯光源（坐标可调整）
const TRAIN_LIGHTS: LightSource[] = [
  { x: 1425, y: 390, radius: 20, flickerPhase: 0,      flickerSpeed: 0.001 },
  { x: 1385, y: 620, radius: 14, flickerPhase: 1.5,    flickerSpeed: 0.0012 },
  { x: 1487, y: 615, radius: 14, flickerPhase: 3.0,    flickerSpeed: 0.0009 },
];

// 生成新雪花（从画布上边缘或右边缘随机位置出发）
function spawnFlake(): Snowflake {
  // 60% 概率从上边缘，40% 从右边缘
  if (Math.random() < 0.6) {
    return {
      x: Math.random() * CANVAS_W,           // 上边缘随机 x
      y: -10 - Math.random() * 80,            // 从上方 -10~-90 开始
      size: 2 + Math.random() * 4,
      speed: 0.5 + Math.random() * 2.0,
      opacity: 0.25 + Math.random() * 0.55,
      wobble: Math.random() * Math.PI * 2,
    };
  }
  return {
    x: CANVAS_W + Math.random() * 120,        // 右边缘外侧
    y: Math.random() * CANVAS_H,              // 随机高度
    size: 2 + Math.random() * 4,
    speed: 0.5 + Math.random() * 2.0,
    opacity: 0.25 + Math.random() * 0.55,
    wobble: Math.random() * Math.PI * 2,
  };
}

/**
 * TitlePage — 标题页
 *
 * - 背景：bg_day08_winter_station.webp（风雪车站）
 * - BGM：bgm_00_title.ogg（循环播放）
 * - 半透明遮罩 + 标题文字 + 开始按钮
 * - Canvas 像素雪花：右上→左下 25°
 */
export default function TitlePage() {
  const navigate = useNavigate();
  const { setLaunchMode, loadGameData } = useGameStore();
  const musicVolume = useSettingsStore((s) => s.musicVolume);
  const ambienceVolume = useSettingsStore((s) => s.ambienceVolume);
  const sfxVolume = useSettingsStore((s) => s.sfxVolume);
  const isMuted = useSettingsStore((s) => s.isMuted);
  const masterVolume = useSettingsStore((s) => s.masterVolume);
  const snowCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const smokeCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const lightCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const flakesRef = useRef<Snowflake[]>([]);
  const smokeRef = useRef<SmokeParticle[]>([]);
  const animRef = useRef<number>(0);
  const smokeTimerRef = useRef<number>(0);
  const smokeBurstRef = useRef<number>(0);

  // 检测是否有有效存档
  const [saveExists, setSaveExists] = useState(false);
  useEffect(() => {
    try {
      const validation = validateGameData(gameDataRaw);
      if (validation.success) {
        const gd = validation.data as GameData;
        loadGameData(gd);
        setSaveExists(hasValidSave(gd));
      }
    } catch {
      setSaveExists(false);
    }
  }, [loadGameData]);

  // BGM：使用统一 AudioManager
  useEffect(() => {
    audioManager.crossfadeBgm("bgm.title");
  }, []);

  // 音量同步：当设置变化时实时更新 AudioManager
  useEffect(() => {
    audioManager.setMasterVolume(masterVolume);
    audioManager.setBgmVolume(musicVolume);
    audioManager.setAmbienceVolume(ambienceVolume);
    audioManager.setSfxVolume(sfxVolume);
    audioManager.setMuted(isMuted);
  }, [masterVolume, musicVolume, ambienceVolume, sfxVolume, isMuted]);

  // 初始化雪花
  const initFlakes = useCallback(() => {
    const flakes: Snowflake[] = [];
    for (let i = 0; i < SNOW_COUNT; i++) {
      const f = spawnFlake();
      f.y = Math.random() * CANVAS_H;
      flakes.push(f);
    }
    flakesRef.current = flakes;
  }, []);

  // 生成一个烟雾粒子
  const spawnSmoke = useCallback((): SmokeParticle => {
    const spread = 8 + Math.random() * 18; // 烟囱口扩散范围
    return {
      x: SMOKE_ORIGIN_X + (Math.random() - 0.5) * spread,
      y: SMOKE_ORIGIN_Y + (Math.random() - 0.5) * 6,
      size: 4 + Math.random() * 6,
      opacity: 0.55 + Math.random() * 0.35,
      vx: (Math.random() - 0.45) * 0.6,   // 略偏左飘散
      vy: -(0.6 + Math.random() * 0.9),   // 向上（加速）
      life: 1,
      decay: 0.0008 + Math.random() * 0.0015,  // 衰减更慢，存续更久
    };
  }, []);

  // 动画循环（雪花 + 烟雾）
  useEffect(() => {
    initFlakes();
    smokeRef.current = [];

    const snowCanvas = snowCanvasRef.current;
    const smokeCanvas = smokeCanvasRef.current;
    const lightCanvas = lightCanvasRef.current;
    if (!snowCanvas || !smokeCanvas || !lightCanvas) return;
    const snowCtx = snowCanvas.getContext("2d");
    const smokeCtx = smokeCanvas.getContext("2d");
    const lightCtx = lightCanvas.getContext("2d");
    if (!snowCtx || !smokeCtx || !lightCtx) return;

    let lastTime = 0;
    const loop = (time: number) => {
      const dt = lastTime ? Math.min((time - lastTime) / 16.67, 3) : 1;
      lastTime = time;

      // ===== 雪花 =====
      snowCtx.clearRect(0, 0, CANVAS_W, CANVAS_H);

      const flakes = flakesRef.current;
      for (let i = 0; i < flakes.length; i++) {
        const f = flakes[i];
        const wobbleOffset = Math.sin(f.wobble + time * 0.0008) * 0.4 * dt;
        f.x += DX * f.speed * dt + wobbleOffset;
        f.y += DY * f.speed * dt;

        if (f.x < -30 || f.y > CANVAS_H + 20) {
          const fresh = spawnFlake();
          f.x = fresh.x;
          f.y = fresh.y;
          f.size = fresh.size;
          f.speed = fresh.speed;
          f.opacity = fresh.opacity;
          f.wobble = fresh.wobble;
        }

        const alpha = f.opacity * (0.7 + 0.3 * Math.sin(time * 0.002 + i));
        snowCtx.fillStyle = `rgba(220,225,235,${alpha.toFixed(2)})`;
        snowCtx.fillRect(Math.round(f.x), Math.round(f.y), f.size, f.size);

        if (f.size > 3.5) {
          snowCtx.fillStyle = `rgba(220,225,235,${(alpha * 0.35).toFixed(2)})`;
          snowCtx.fillRect(Math.round(f.x - 1), Math.round(f.y - 1), f.size + 2, f.size + 2);
        }
      }

      // ===== 烟雾 =====
      smokeCtx.clearRect(0, 0, CANVAS_W, CANVAS_H);

      const smoke = smokeRef.current;

      // 随机脉冲生成：每 0.1~0.5s 爆发一批
      smokeTimerRef.current -= dt * 16.67; // 转回毫秒
      if (smokeTimerRef.current <= 0) {
        // 随机间隔 100~500ms
        smokeTimerRef.current = 100 + Math.random() * 400;
        // 随机爆发 3~15 个粒子
        smokeBurstRef.current = 3 + Math.floor(Math.random() * 13);
      }

      if (smokeBurstRef.current > 0 && smoke.length < SMOKE_MAX) {
        const burst = Math.min(smokeBurstRef.current, SMOKE_MAX - smoke.length);
        for (let i = 0; i < burst; i++) {
          smoke.push(spawnSmoke());
        }
        smokeBurstRef.current = 0;
      }

      // 更新 & 绘制烟雾
      for (let i = smoke.length - 1; i >= 0; i--) {
        const p = smoke[i];
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.life -= p.decay * dt;

        if (p.life <= 0) {
          smoke.splice(i, 1);
          continue;
        }

        // 粒子越大，扩散越明显
        const growFactor = 1 + (1 - p.life) * 2.5;
        const curSize = p.size * growFactor;
        const alpha = p.opacity * p.life;

        // 像素风烟雾：黑灰混合，黑占85%灰占15%
        const baseX = Math.round(p.x);
        const baseY = Math.round(p.y);

        // 主体：深黑（85%）
        smokeCtx.fillStyle = `rgba(35,32,28,${(alpha * 0.75).toFixed(2)})`;
        smokeCtx.fillRect(baseX - Math.round(curSize), baseY - Math.round(curSize * 0.6), Math.round(curSize * 2), Math.round(curSize * 1.2));

        // 核心：深灰（15%）
        smokeCtx.fillStyle = `rgba(80,75,68,${(alpha * 0.45).toFixed(2)})`;
        smokeCtx.fillRect(baseX - Math.round(curSize * 0.45), baseY - Math.round(curSize * 0.3), Math.round(curSize * 0.9), Math.round(curSize * 0.6));

        // 边缘：黑灰过渡
        smokeCtx.fillStyle = `rgba(50,47,42,${(alpha * 0.25).toFixed(2)})`;
        smokeCtx.fillRect(baseX - Math.round(curSize * 1.3), baseY - Math.round(curSize * 0.8), Math.round(curSize * 2.6), Math.round(curSize * 1.5));
      }

      // ===== 火车灯光（独立 Canvas，像素圆形光源） =====
      lightCtx.clearRect(0, 0, CANVAS_W, CANVAS_H);

      for (const light of TRAIN_LIGHTS) {
        const flicker = 0.85 + 0.15 * Math.sin(time * light.flickerSpeed + light.flickerPhase);
        const lx = Math.round(light.x);
        const ly = Math.round(light.y);
        const r = light.radius;

        // 像素圆形光晕（三层）
        for (let layer = 3; layer >= 1; layer--) {
          const lr = r * layer * 1.6;
          const layerAlpha = flicker * (0.08 / layer);
          lightCtx.fillStyle = `rgba(255,180,80,${layerAlpha.toFixed(3)})`;
          drawPixelCircle(lightCtx, lx, ly, Math.round(lr));
        }

        // 暖色核心
        const coreAlpha = flicker * 0.55;
        lightCtx.fillStyle = `rgba(255,220,150,${coreAlpha.toFixed(3)})`;
        drawPixelCircle(lightCtx, lx, ly, Math.round(r * 0.7));

        // 白热中心
        const hotAlpha = flicker * 0.7;
        lightCtx.fillStyle = `rgba(255,245,220,${hotAlpha.toFixed(3)})`;
        drawPixelCircle(lightCtx, lx, ly, Math.round(r * 0.3));
      }

      animRef.current = requestAnimationFrame(loop);
    };

    animRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animRef.current);
  }, [initFlakes, spawnSmoke]);

  const handleNewGame = () => {
    // 不再覆盖存档 - 直接开始新周目
    setLaunchMode("new");
    navigate("/game");
  };

  const handleContinue = () => {
    setLaunchMode("continue");
    navigate("/game");
  };

  const handleSettings = () => {
    // 不停止 BGM，设置页面可以继续调节音量
    navigate("/settings");
  };

  const handleEndingGallery = () => {
    navigate("/ending-gallery");
  };

  const BG_URL = "/assets/backgrounds/bg_day08_winter_station.webp";

  // 共享按钮样式工厂
  const btnBase: React.CSSProperties = {
    width: 340,
    height: 54,
    fontSize: 18,
    fontWeight: 600,
    letterSpacing: "0.14em",
    fontFamily: "var(--font-display), serif",
    border: "1px solid rgba(174,132,70,0.38)",
    borderRadius: 2,
    cursor: "pointer",
    transition: "all 0.22s ease",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    margin: "0 auto",
  };

  const primaryBtnStyle = (): React.CSSProperties => ({
    ...btnBase,
    color: "#e6d8b8",
    background: "rgba(58,42,24,0.78)",
    border: "1px solid rgba(200,156,80,0.55)",
  });

  const secondaryBtnStyle = (): React.CSSProperties => ({
    ...btnBase,
    color: "#c4b494",
    background: "rgba(45,34,22,0.72)",
  });

  const primaryHover = (el: HTMLElement) => {
    el.style.background = "rgba(80,56,30,0.88)";
    el.style.borderColor = "rgba(220,170,90,0.7)";
    el.style.color = "#f0e2c8";
  };
  const primaryLeave = (el: HTMLElement) => {
    el.style.background = "rgba(58,42,24,0.78)";
    el.style.borderColor = "rgba(200,156,80,0.55)";
    el.style.color = "#e6d8b8";
  };
  const secondaryHover = (el: HTMLElement) => {
    el.style.background = "rgba(72,52,30,0.86)";
    el.style.borderColor = "rgba(200,156,80,0.55)";
    el.style.color = "#e0d0b0";
  };
  const secondaryLeave = (el: HTMLElement) => {
    el.style.background = "rgba(45,34,22,0.72)";
    el.style.borderColor = "rgba(174,132,70,0.38)";
    el.style.color = "#c4b494";
  };
  const pressDown = (el: HTMLElement) => { el.style.transform = "translateY(1px)"; };
  const pressUp = (el: HTMLElement) => { el.style.transform = ""; };
  const focusIn = (el: HTMLElement) => { el.style.outline = "2px solid rgba(200,160,100,0.5)"; el.style.outlineOffset = "2px"; };
  const focusOut = (el: HTMLElement) => { el.style.outline = "none"; };

  return (
    <>
      {/* 全屏电影感延展背景 */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: -1,
          background: `url(${BG_URL}) center/cover no-repeat #0d1520`,
          filter: "blur(16px)",
          transform: "scale(1.08)",
          opacity: 0.45,
        }}
      />
      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: -1,
          background: "rgba(0,0,0,0.55)",
        }}
      />

      <GameViewport>
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            background: `url(${BG_URL}) center/100% 100% no-repeat #0d1520`,
            position: "relative",
          }}
        >
          {/* 主画面暗色遮罩 */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "linear-gradient(180deg, rgba(10,8,6,0.35) 0%, rgba(10,8,6,0.55) 40%, rgba(10,8,6,0.7) 100%)",
              zIndex: 0,
            }}
          />

          {/* 火车灯光 */}
          <canvas ref={lightCanvasRef} width={CANVAS_W} height={CANVAS_H}
            style={{ position: "absolute", inset: 0, zIndex: 0, pointerEvents: "none" }} />

          {/* 烟雾 */}
          <canvas ref={smokeCanvasRef} width={CANVAS_W} height={CANVAS_H}
            style={{ position: "absolute", inset: 0, zIndex: 0, pointerEvents: "none" }} />

          {/* 雪花 */}
          <canvas ref={snowCanvasRef} width={CANVAS_W} height={CANVAS_H}
            style={{ position: "absolute", inset: 0, zIndex: 2, pointerEvents: "none" }} />

          {/* ===== 标题 + 菜单面板 ===== */}
          <div style={{ position: "relative", zIndex: 1, textAlign: "center" }}>

            {/* 标题 */}
            <h1 style={{
              fontSize: 74,
              fontWeight: 500,
              letterSpacing: 20,
              marginBottom: 24,
              fontFamily: "var(--font-display)",
              color: "var(--color-text-primary)",
              textShadow: "0 3px 10px rgba(0,0,0,0.65), 0 1px 4px rgba(20,30,60,0.5)",
            }}>
              雪落之前
            </h1>

            {/* 副标题 */}
            <p style={{
              fontSize: 20,
              color: "var(--color-text-secondary)",
              marginBottom: 64,
              letterSpacing: "0.2em",
              opacity: 0.82,
            }}>
              风雪到来以前，他们仍在选择归途
            </p>

            {/* ===== 档案面板 ===== */}
            <div style={{
              width: 410,
              padding: "28px 32px 24px",
              background: "rgba(20, 16, 12, 0.58)",
              border: "1px solid rgba(174, 132, 70, 0.45)",
              borderRadius: 3,
              boxShadow: "inset 0 0 24px rgba(0,0,0,0.45), 0 18px 50px rgba(0,0,0,0.45)",
              backdropFilter: "none",
            }}>
              {/* 面板内按钮组 */}
              <div style={{
                display: "flex",
                flexDirection: "column",
                gap: 13,
                position: "relative",
                zIndex: 1,
              }}>
                {/* 开始新游戏 — primary */}
                <button onClick={handleNewGame}
                  style={primaryBtnStyle()}
                  onMouseEnter={(e) => primaryHover(e.currentTarget)}
                  onMouseLeave={(e) => primaryLeave(e.currentTarget)}
                  onMouseDown={(e) => pressDown(e.currentTarget)}
                  onMouseUp={(e) => pressUp(e.currentTarget)}
                  onFocus={(e) => focusIn(e.currentTarget)}
                  onBlur={(e) => focusOut(e.currentTarget)}
                >
                  开始新游戏
                </button>

                {/* 继续旅程 — secondary / disabled */}
                <button
                  onClick={saveExists ? handleContinue : undefined}
                  disabled={!saveExists}
                  style={{
                    ...secondaryBtnStyle(),
                    opacity: saveExists ? 1 : 0.38,
                    cursor: saveExists ? "pointer" : "not-allowed",
                  }}
                  onMouseEnter={(e) => { if (saveExists) secondaryHover(e.currentTarget); }}
                  onMouseLeave={(e) => { if (saveExists) secondaryLeave(e.currentTarget); }}
                  onMouseDown={(e) => { if (saveExists) pressDown(e.currentTarget); }}
                  onMouseUp={(e) => { if (saveExists) pressUp(e.currentTarget); }}
                  onFocus={(e) => { if (saveExists) focusIn(e.currentTarget); }}
                  onBlur={(e) => focusOut(e.currentTarget)}
                >
                  继续旅程
                </button>

                {/* 设置 — secondary */}
                <button onClick={handleSettings}
                  style={secondaryBtnStyle()}
                  onMouseEnter={(e) => secondaryHover(e.currentTarget)}
                  onMouseLeave={(e) => secondaryLeave(e.currentTarget)}
                  onMouseDown={(e) => pressDown(e.currentTarget)}
                  onMouseUp={(e) => pressUp(e.currentTarget)}
                  onFocus={(e) => focusIn(e.currentTarget)}
                  onBlur={(e) => focusOut(e.currentTarget)}
                >
                  设置
                </button>

                {/* 结局图鉴 — secondary */}
                <button onClick={handleEndingGallery}
                  style={secondaryBtnStyle()}
                  onMouseEnter={(e) => secondaryHover(e.currentTarget)}
                  onMouseLeave={(e) => secondaryLeave(e.currentTarget)}
                  onMouseDown={(e) => pressDown(e.currentTarget)}
                  onMouseUp={(e) => pressUp(e.currentTarget)}
                  onFocus={(e) => focusIn(e.currentTarget)}
                  onBlur={(e) => focusOut(e.currentTarget)}
                >
                  结局图鉴
                </button>
              </div>
            </div>
            {/* 面板底部分隔线 */}
            <div style={{
              width: 410,
              height: 1,
              margin: "0 auto",
              background: "linear-gradient(90deg, transparent, rgba(174,132,70,0.2), transparent)",
              marginTop: 0,
            }} />
          </div>

          {/* 底部版本号 */}
          <p style={{
            position: "absolute",
            bottom: 32,
            color: "rgba(150,130,105,0.32)",
            fontSize: 12,
            letterSpacing: 2,
            zIndex: 1,
          }}>
            雪落之前 · V1
          </p>
        </div>
      </GameViewport>
    </>
  );
}
