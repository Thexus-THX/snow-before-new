import type { SceneDefinition } from "@/schemas/types";

/**
 * SceneArea — 场景背景区（固定 864px 高）
 *
 * - 显示真实背景图（background 字段）
 * - 若有 content.portraitAsset，在右侧显示角色立绘
 * - 高度固定为 --scene-height (864px)，由 GamePage 控制
 */
interface SceneAreaProps {
  scene: SceneDefinition;
  onClick?: () => void;
  clickable?: boolean;
}

export default function SceneArea({ scene, onClick, clickable }: SceneAreaProps) {
  const bg = scene.background;
  const portrait = scene.content?.portraitAsset;
  const sceneName = scene.name;

  return (
    <div
      className="scene-area"
      onClick={clickable ? onClick : undefined}
      style={{
        width: "100%",
        height: "var(--scene-height)",
        flexShrink: 0,
        position: "relative",
        overflow: "hidden",
        borderBottom: "2px solid #3a2a18",
        background: bg
          ? `url(${bg}) center/cover no-repeat var(--color-bg-dark)`
          : "var(--color-bg-dark)",
        cursor: clickable ? "pointer" : "default",
      }}
    >
      {/* 背景降级 */}
      {!bg && (
        <p
          style={{
            color: "var(--color-text-dim)",
            fontSize: 20,
            opacity: 0.3,
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            pointerEvents: "none",
            zIndex: 0,
          }}
        >
          {sceneName}
        </p>
      )}

      {/* 角色立绘（右下区域） */}
      {portrait && (
        <div
          style={{
            position: "absolute",
            right: 40,
            bottom: 0,
            width: "42%",
            maxWidth: 680,
            height: "94%",
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "flex-end",
            pointerEvents: "none",
            zIndex: 2,
          }}
        >
          <img
            src={portrait}
            alt=""
            style={{
              maxHeight: "100%",
              maxWidth: "100%",
              objectFit: "contain",
              objectPosition: "right bottom",
            }}
          />
        </div>
      )}

      {/* 底部渐变遮罩 */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(to top, rgba(10,8,6,0.55) 0%, transparent 18%)",
          pointerEvents: "none",
          zIndex: 1,
        }}
      />
    </div>
  );
}
