import { useEffect, useRef, useState, type ReactNode } from "react";

/**
 * GameViewport — 1920×1080 逻辑画布等比缩放容器
 *
 * 核心行为：
 * 1. 监听 window resize 事件
 * 2. 计算 scale = min(windowW/1920, windowH/1080)
 * 3. 通过 CSS transform: scale() 渲染子元素
 * 4. 子元素使用 1920×1080 逻辑坐标编写
 * 5. Debug 模式时通过 data-scale 属性暴露缩放比例
 */
interface GameViewportProps {
  children?: ReactNode;
}

export default function GameViewport({ children }: GameViewportProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const updateScale = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      const s = Math.min(w / 1920, h / 1080);
      setScale(s);
    };

    updateScale();
    window.addEventListener("resize", updateScale);
    return () => window.removeEventListener("resize", updateScale);
  }, []);

  const offsetX = (window.innerWidth - 1920 * scale) / 2;
  const offsetY = (window.innerHeight - 1080 * scale) / 2;

  return (
    <div
      ref={containerRef}
      className="game-viewport"
      data-scale={`${(scale * 100).toFixed(1)}%`}
      style={{
        transform: `translate(${offsetX}px, ${offsetY}px) scale(${scale})`,
      }}
    >
      {children}
    </div>
  );
}
