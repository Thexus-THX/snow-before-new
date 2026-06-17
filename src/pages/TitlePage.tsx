import { useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import GameViewport from "@/components/common/GameViewport";

/** 像素雪花粒子 */
interface Snowflake {
  x: number;
  y: number;
  size: number;      // 2-5px
  speed: number;     // 基础速度
  opacity: number;   // 0.2-0.8
  wobble: number;    // 横向摆动相位
}

/** 25° 方向向量（归一化）：右上→左下 */
const ANGLE = 25 * (Math.PI / 180);
const DX = -Math.cos(ANGLE);  // ≈ -0.906
const DY =  Math.sin(ANGLE);  // ≈  0.423

const CANVAS_W = 1920;
const CANVAS_H = 1080;
const SNOW_COUNT = 160;

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
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const flakesRef = useRef<Snowflake[]>([]);
  const animRef = useRef<number>(0);

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

  // 初始化雪花（全部从上边缘随机位置开始）
  const initFlakes = useCallback(() => {
    const flakes: Snowflake[] = [];
    for (let i = 0; i < SNOW_COUNT; i++) {
      const f = spawnFlake();
      // 初次显示时在屏幕内分散开，避免全部从顶部一起下
      f.y = Math.random() * CANVAS_H;
      flakes.push(f);
    }
    flakesRef.current = flakes;
  }, []);

  // 动画循环
  useEffect(() => {
    initFlakes();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let lastTime = 0;
    const loop = (time: number) => {
      const dt = lastTime ? Math.min((time - lastTime) / 16.67, 3) : 1; // 归一化，上限 3x
      lastTime = time;

      ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);

      const flakes = flakesRef.current;
      for (let i = 0; i < flakes.length; i++) {
        const f = flakes[i];

        // 横向轻微摆动（模拟风）
        const wobbleOffset = Math.sin(f.wobble + time * 0.0008) * 0.4 * dt;

        // 主方向移动
        f.x += DX * f.speed * dt + wobbleOffset;
        f.y += DY * f.speed * dt;

        // 超出左/下边界 → 从上边缘随机位置重新出发
        if (f.x < -30 || f.y > CANVAS_H + 20) {
          const fresh = spawnFlake();
          f.x = fresh.x;
          f.y = fresh.y;
          f.size = fresh.size;
          f.speed = fresh.speed;
          f.opacity = fresh.opacity;
          f.wobble = fresh.wobble;
        }

        // 绘制像素雪花（小矩形）
        const alpha = f.opacity * (0.7 + 0.3 * Math.sin(time * 0.002 + i));
        ctx.fillStyle = `rgba(220,225,235,${alpha.toFixed(2)})`;
        ctx.fillRect(Math.round(f.x), Math.round(f.y), f.size, f.size);

        // 稍大的雪花加微光晕
        if (f.size > 3.5) {
          ctx.fillStyle = `rgba(220,225,235,${(alpha * 0.35).toFixed(2)})`;
          ctx.fillRect(Math.round(f.x - 1), Math.round(f.y - 1), f.size + 2, f.size + 2);
        }
      }

      animRef.current = requestAnimationFrame(loop);
    };

    animRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animRef.current);
  }, [initFlakes]);

  const handleStart = () => {
    // 停止 BGM 后跳转
    if (audioRef.current) {
      audioRef.current.pause();
    }
    navigate("/game");
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
        {/* 暗色遮罩 */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(180deg, rgba(10,8,6,0.35) 0%, rgba(10,8,6,0.55) 40%, rgba(10,8,6,0.7) 100%)",
          }}
        />

        {/* 像素雪花 Canvas */}
        <canvas
          ref={canvasRef}
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

          <button
            onClick={handleStart}
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
            开 始 游 戏
          </button>
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
