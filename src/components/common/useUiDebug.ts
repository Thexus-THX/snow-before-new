/**
 * useUiDebug — UI Debug 模式
 *
 * 通过 URL 参数 ?uiDebug=1 或 localStorage 开启。
 * Debug 模式显示 UI 尺寸边框和标签。
 */
import { useMemo } from "react";

export function useUiDebug(): boolean {
  return useMemo(() => {
    try {
      const urlParam = new URLSearchParams(window.location.search).get("uiDebug");
      if (urlParam === "1") {
        localStorage.setItem("uiDebug", "1");
        return true;
      }
      if (urlParam === "0") {
        localStorage.removeItem("uiDebug");
        return false;
      }
      return localStorage.getItem("uiDebug") === "1";
    } catch {
      return false;
    }
  }, []);
}
