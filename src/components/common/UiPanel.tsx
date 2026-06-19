/**
 * UiPanel — 通用面板基础组件
 *
 * 不依赖图片尺寸，CSS 控制所有视觉。
 */
import type { ReactNode, CSSProperties } from "react";

interface UiPanelProps {
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
  debugName?: string;
}

export default function UiPanel({ className, style, children, debugName }: UiPanelProps) {
  return (
    <div
      className={`uiPanel${className ? ` ${className}` : ""}`}
      style={style}
      data-ui-debug={debugName}
    >
      {children}
    </div>
  );
}
