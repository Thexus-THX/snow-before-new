import { useEffect, useState, useRef } from "react";

/**
 * MobileLandscapeHint — 横屏引导提示层
 *
 * 手机竖屏时显示全屏提示，引导用户旋转手机。
 * 横屏或桌面端自动隐藏。
 */
export default function MobileLandscapeHint() {
  const [showHint, setShowHint] = useState(false);
  const [fullscreenFailed, setFullscreenFailed] = useState(false);

  useEffect(() => {
    const check = () => {
      const isMobile = window.innerWidth <= 768 || matchMedia("(pointer: coarse)").matches;
      const isPortrait = window.innerHeight > window.innerWidth;
      setShowHint(isMobile && isPortrait);
    };
    check();
    const mq = matchMedia("(orientation: portrait)");
    mq.addEventListener("change", check);
    window.addEventListener("resize", check);
    window.addEventListener("orientationchange", check);
    return () => {
      mq.removeEventListener("change", check);
      window.removeEventListener("resize", check);
      window.removeEventListener("orientationchange", check);
    };
  }, []);

  // 全屏横屏请求
  const requestFullscreenLandscape = async () => {
    try {
      if (document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen();
      }
      if ("orientation" in screen && (screen.orientation as any)?.lock) {
        await (screen.orientation as any).lock("landscape").catch(() => {});
      }
    } catch {
      setFullscreenFailed(true);
    }
  };

  if (!showHint) return null;

  const safeArea = {
    paddingTop: "env(safe-area-inset-top, 0px)",
    paddingBottom: "env(safe-area-inset-bottom, 0px)",
    paddingLeft: "env(safe-area-inset-left, 0px)",
    paddingRight: "env(safe-area-inset-right, 0px)",
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background: "linear-gradient(180deg, rgba(10,8,6,0.96), rgba(20,16,12,0.96))",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        ...safeArea,
      }}
    >
      {/* 档案纸暗影 */}
      <div
        style={{
          width: "min(88vw, 360px)",
          padding: "40px 28px 32px",
          background: "rgba(22, 17, 12, 0.72)",
          border: "1px solid rgba(176, 132, 72, 0.35)",
          borderRadius: 3,
          boxShadow: "inset 0 0 24px rgba(0,0,0,0.4), 0 18px 50px rgba(0,0,0,0.5)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 24,
          textAlign: "center",
        }}
      >
        {/* 旋转图标 — CSS 纯绘制 */}
        <div
          style={{
            width: 64,
            height: 80,
            border: "3px solid rgba(176, 132, 72, 0.6)",
            borderRadius: 8,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            position: "relative",
            animation: "landscape-hint-rotate 2s ease-in-out infinite",
          }}
        >
          {/* 手机里面箭头 */}
          <div
            style={{
              width: 0,
              height: 0,
              borderLeft: "14px solid rgba(200, 168, 96, 0.7)",
              borderTop: "8px solid transparent",
              borderBottom: "8px solid transparent",
              transform: "rotate(90deg)",
            }}
          />
          <div
            style={{
              position: "absolute",
              bottom: -24,
              color: "rgba(180, 160, 140, 0.6)",
              fontSize: 12,
              letterSpacing: 1,
            }}
          >
            ↻
          </div>
        </div>

        {/* 文案 */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <p
            style={{
              margin: 0,
              fontSize: 18,
              fontWeight: 600,
              color: "#d8c8a8",
              letterSpacing: "0.1em",
              fontFamily: "var(--font-display), serif",
            }}
          >
            为了获得最佳体验
          </p>
          <p
            style={{
              margin: 0,
              fontSize: 20,
              fontWeight: 600,
              color: "#e8d4c0",
              letterSpacing: "0.08em",
              fontFamily: "var(--font-display), serif",
            }}
          >
            请将手机横过来
          </p>
          <p
            style={{
              margin: 0,
              marginTop: 4,
              fontSize: 14,
              color: "rgba(180, 160, 140, 0.55)",
              letterSpacing: "0.04em",
              lineHeight: 1.6,
            }}
          >
            如无法旋转，请关闭系统
            <br />
            "竖排方向锁定"
          </p>
        </div>

        {/* 全屏按钮 */}
        <button
          onClick={requestFullscreenLandscape}
          style={{
            marginTop: 4,
            padding: "10px 24px",
            fontSize: 15,
            fontWeight: 600,
            letterSpacing: "0.08em",
            fontFamily: "var(--font-display), serif",
            color: "#c4b494",
            background: "rgba(42, 34, 22, 0.55)",
            border: "1px solid rgba(176, 132, 72, 0.38)",
            borderRadius: 2,
            cursor: "pointer",
            minHeight: 44,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "rgba(62, 48, 28, 0.75)";
            e.currentTarget.style.borderColor = "rgba(200, 156, 80, 0.55)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "rgba(42, 34, 22, 0.55)";
            e.currentTarget.style.borderColor = "rgba(176, 132, 72, 0.38)";
          }}
        >
          尝试进入全屏横屏
        </button>

        {fullscreenFailed && (
          <p
            style={{
              margin: 0,
              fontSize: 13,
              color: "rgba(200, 160, 130, 0.6)",
              letterSpacing: "0.04em",
            }}
          >
            当前浏览器不支持自动横屏，请手动旋转手机
          </p>
        )}
      </div>

      {/* 旋转动画 keyframe */}
      <style>{`
        @keyframes landscape-hint-rotate {
          0%, 100% { transform: rotate(0deg); }
          25% { transform: rotate(-90deg); }
          50% { transform: rotate(-90deg); }
          75% { transform: rotate(0deg); }
        }
      `}</style>
    </div>
  );
}
