import { useRef, useEffect, useCallback } from "react";

/**
 * useAdvanceGuard — 防止双击/重复推进的保护 hook
 *
 * 行为：
 * - 每次推进后锁定 500ms，期间忽略后续调用
 * - 场景切换时（sceneId 变化）自动解锁
 * - 组件卸载时清理
 *
 * 用法：
 * ```tsx
 * const { tryAdvance } = useAdvanceGuard(sceneId, () => advanceScene(nextSceneId));
 * <button onClick={tryAdvance}>继续</button>
 * ```
 */
export function useAdvanceGuard(
  sceneId: string,
  onAdvance: () => void,
) {
  const lockedRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 场景切换时自动解锁
  useEffect(() => {
    lockedRef.current = false;
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [sceneId]);

  const tryAdvance = useCallback(() => {
    if (lockedRef.current) return;
    lockedRef.current = true;
    onAdvance();
    timerRef.current = setTimeout(() => {
      lockedRef.current = false;
      timerRef.current = null;
    }, 500);
  }, [onAdvance]);

  return { tryAdvance, isLocked: lockedRef.current };
}
