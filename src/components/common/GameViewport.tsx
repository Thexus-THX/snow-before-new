import { useEffect, useRef, useState, type ReactNode } from "react";

/**
 * GameViewport — 1920×1080 逻辑画布等比缩放容器
 *
 * 桌面端：translate + scale 等比缩放，1920×1080 逻辑坐标
 * 移动端：弹性布局 + 横竖屏自适应，CSS class 驱动
 */
interface GameViewportProps {
  children?: ReactNode;
}

export default function GameViewport({ children }: GameViewportProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [isMobile, setIsMobile] = useState(false);
  const [isLandscape, setIsLandscape] = useState(true);

  // 移动端检测（SSR 安全）
  useEffect(() => {
    const check = () => {
      const w = window.innerWidth;
      const mobile = w <= 768 || matchMedia("(pointer: coarse)").matches;
      setIsMobile(mobile);
      if (mobile) setIsLandscape(w > window.innerHeight);
    };
    check();
    window.addEventListener("resize", check);
    window.addEventListener("orientationchange", check);
    return () => {
      window.removeEventListener("resize", check);
      window.removeEventListener("orientationchange", check);
    };
  }, []);

  // 桌面端缩放任听 resize
  useEffect(() => {
    if (isMobile) { setScale(1); return; }
    const update = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      setScale(Math.min(w / 1920, h / 1080));
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [isMobile]);

  // 桌面端 transform
  const transformStyle: React.CSSProperties = isMobile
    ? {}
    : {
        transform: `translate(${(window.innerWidth - 1920 * scale) / 2}px, ${(window.innerHeight - 1080 * scale) / 2}px) scale(${scale})`,
        transformOrigin: "top left",
      };

  return (
    <div
      ref={containerRef}
      className={[
        "game-viewport",
        isMobile && isLandscape ? "game-viewport--landscape" : "",
        isMobile && !isLandscape ? "game-viewport--portrait" : "",
      ].filter(Boolean).join(" ")}
      data-mobile={isMobile ? "1" : "0"}
      data-scale={`${(scale * 100).toFixed(1)}%`}
      style={transformStyle}
    >
      {children}
    </div>
  );
}
