import { useEffect, useRef, useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import GameViewport from "@/components/common/GameViewport";
import { useGameStore } from "@/app/stores/gameStore";
import { validateGameData } from "@/schemas/gameSchema";
import { hasValidSave } from "@/engine/saveManager";
import type { GameData } from "@/schemas/types";
import gameDataRaw from "@/content/game-data.json";

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
  { x: 1433, y: 390, radius: 20, flickerPhase: 0,      flickerSpeed: 0.001 },
  { x: 1385, y: 620, radius: 14, flickerPhase: 1.5,    flickerSpeed: 0.0012 },
  { x: 1507, y: 615, radius: 14, flickerPhase: 3.0,    flickerSpeed: 0.0009 },
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
  const audioRef = useRef<HTMLAudioElement | null>(null);
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
        // 先加载数据（如果尚未加载），以便 hasValidSave 能检查引用
        loadGameData(gd);
        setSaveExists(hasValidSave(gd));
      }
    } catch {
      setSaveExists(false);
    }
  }, [loadGameData]);

  // BGM
  useEffect(() => {
    const audio = new Audio("/assets/audio/bgm/bgm_00_title.ogg");
    audio.loop = true;
    audio.volume = 0.6;
    audioRef.current = audio;

    const playOnInteraction = () => {
      audio.play().catch(() => {});
      document.removeEventListener("click", playOnInteraction);
    };
    document.addEventListener("click", playOnInteraction);

    return () => {
      audio.pause();
      audio.src = "";
      document.removeEventListener("click", playOnInteraction);
    };
  }, []);

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
    if (audioRef.current) {
      audioRef.current.pause();
    }
    if (saveExists && !window.confirm("已有存档记录，开始新游戏将覆盖现有进度。确定继续吗？")) {
      return;
    }
    setLaunchMode("new");
    navigate("/game");
  };

  const handleContinue = () => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    setLaunchMode("continue");
    navigate("/game");
  };

  const handleSettings = () => {
    navigate("/settings");
  };

  return (
    <GameViewport>
      <div
        onClick={() => {
          // 首次点击触发 BGM
          if (audioRef.current && audioRef.current.paused) {
            audioRef.current.play().catch(() => {});
          }
        }}
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "url(/assets/backgrounds/bg_day08_winter_station.webp) center/cover no-repeat #0d1520",
          position: "relative",
        }}
      >
        {/* 背景图缺失时的占位提示 */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            border: "2px dashed rgba(120,100,80,0.3)",
            margin: 24,
            borderRadius: 4,
            pointerEvents: "none",
            zIndex: 0,
          }}
        >
          <p style={{ color: "rgba(180,160,140,0.4)", fontSize: 14, letterSpacing: 2 }}>
            /assets/backgrounds/bg_day08_winter_station.webp
          </p>
        </div>

        {/* 暗色遮罩 */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(180deg, rgba(10,8,6,0.35) 0%, rgba(10,8,6,0.55) 40%, rgba(10,8,6,0.7) 100%)",
            zIndex: 0,
          }}
        />

        {/* 火车灯光 Canvas（在背景之上、遮罩之下） */}
        <canvas
          ref={lightCanvasRef}
          width={CANVAS_W}
          height={CANVAS_H}
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 0,
            pointerEvents: "none",
          }}
        />

        {/* 烟雾 Canvas（在雪花之下，背景之上） */}
        <canvas
          ref={smokeCanvasRef}
          width={CANVAS_W}
          height={CANVAS_H}
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 0,
            pointerEvents: "none",
          }}
        />

        {/* 像素雪花 Canvas */}
        <canvas
          ref={snowCanvasRef}
          width={CANVAS_W}
          height={CANVAS_H}
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 2,
            pointerEvents: "none",
          }}
        />

        {/* 标题内容 */}
        <div style={{ position: "relative", zIndex: 1, textAlign: "center" }}>
          <h1
            style={{
              fontSize: 72,
              fontWeight: 400,
              letterSpacing: 20,
              marginBottom: 32,
              fontFamily: "var(--font-display)",
              color: "var(--color-text-primary)",
              textShadow: "0 2px 12px rgba(0,0,0,0.5)",
            }}
          >
            雪落之前
          </h1>

          <p
            style={{
              fontSize: 20,
              color: "var(--color-text-secondary)",
              marginBottom: 80,
              letterSpacing: 6,
            }}
          >
            一个发生在风雪来临之前的故事
          </p>

        {/* 按钮组 */}
        <div style={{ position: "relative", zIndex: 1, textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>

          {/* 开始新游戏 */}
          <button
            onClick={handleNewGame}
            style={{
              padding: "18px 72px",
              fontSize: 22,
              border: "1px solid #5a5040",
              borderRadius: "var(--border-radius-md)",
              background: "rgba(42, 34, 24, 0.55)",
              color: "var(--color-text-primary)",
              cursor: "pointer",
              letterSpacing: 10,
              fontFamily: "var(--font-body)",
              transition: "background var(--transition-fast), border-color var(--transition-fast)",
              minWidth: 300,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(60, 48, 32, 0.75)";
              e.currentTarget.style.borderColor = "var(--color-text-amber)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(42, 34, 24, 0.55)";
              e.currentTarget.style.borderColor = "#5a5040";
            }}
          >
            开 始 新 游 戏
          </button>

          {/* 继续游戏 */}
          <button
            onClick={saveExists ? handleContinue : undefined}
            disabled={!saveExists}
            style={{
              padding: "18px 72px",
              fontSize: 22,
              border: `1px solid ${saveExists ? "#5a5040" : "#3a3028"}`,
              borderRadius: "var(--border-radius-md)",
              background: saveExists ? "rgba(42, 34, 24, 0.55)" : "rgba(28, 22, 16, 0.35)",
              color: saveExists ? "var(--color-text-primary)" : "var(--color-text-dim)",
              cursor: saveExists ? "pointer" : "not-allowed",
              letterSpacing: 10,
              fontFamily: "var(--font-body)",
              transition: "background var(--transition-fast), border-color var(--transition-fast)",
              minWidth: 300,
              opacity: saveExists ? 1 : 0.5,
            }}
            onMouseEnter={(e) => {
              if (!saveExists) return;
              e.currentTarget.style.background = "rgba(60, 48, 32, 0.75)";
              e.currentTarget.style.borderColor = "var(--color-text-amber)";
            }}
            onMouseLeave={(e) => {
              if (!saveExists) return;
              e.currentTarget.style.background = "rgba(42, 34, 24, 0.55)";
              e.currentTarget.style.borderColor = "#5a5040";
            }}
          >
            继 续 游 戏
          </button>

          {/* 设置 */}
          <button
            onClick={handleSettings}
            style={{
              padding: "14px 60px",
              fontSize: 18,
              border: "1px solid #4a4035",
              borderRadius: "var(--border-radius-md)",
              background: "rgba(32, 28, 20, 0.45)",
              color: "var(--color-text-secondary)",
              cursor: "pointer",
              letterSpacing: 8,
              fontFamily: "var(--font-body)",
              transition: "background var(--transition-fast), border-color var(--transition-fast)",
              minWidth: 240,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(48, 40, 28, 0.6)";
              e.currentTarget.style.borderColor = "var(--color-text-secondary)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(32, 28, 20, 0.45)";
              e.currentTarget.style.borderColor = "#4a4035";
            }}
          >
            设　　置
          </button>
        </div>
        </div>

        {/* 底部版权/版本 */}
        <p
          style={{
            position: "absolute",
            bottom: 32,
            color: "var(--color-text-dim)",
            fontSize: 13,
            letterSpacing: 2,
            zIndex: 1,
          }}
        >
          雪落之前 · V1
        </p>
      </div>
    </GameViewport>
  );
}
