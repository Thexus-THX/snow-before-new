/**
 * EditorPage — 可视化编辑器
 * 阶段 1 占位：仅显示基础布局框架
 */
export default function EditorPage() {
  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        display: "flex",
        overflow: "hidden",
        background: "#1a1410",
        color: "#e8dfcf",
      }}
    >
      {/* 左侧：场景列表 */}
      <aside
        style={{
          width: 260,
          height: "100%",
          borderRight: "1px solid #3a2a18",
          background: "rgba(20, 16, 12, 0.95)",
          padding: 16,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <h2 style={{ fontSize: 18, color: "#d4a843", marginBottom: 16 }}>
          场景列表
        </h2>
        <div
          style={{
            background: "rgba(42, 34, 24, 0.5)",
            padding: 12,
            borderRadius: 4,
            fontSize: 14,
            color: "#b8a88c",
          }}
        >
          第一日·实验前
          <br />
          <span style={{ fontSize: 12, color: "#6a6050" }}>
            standardDialogue
          </span>
        </div>
        <p style={{ marginTop: 24, fontSize: 13, color: "#6a6050" }}>
          阶段 1 占位 — 编辑器功能将在阶段 7 实现
        </p>
      </aside>

      {/* 中间：画布区 */}
      <main
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRight: "1px solid #3a2a18",
        }}
      >
        <p style={{ color: "#6a6050", fontSize: 24 }}>1920 × 1080 画布区</p>
      </main>

      {/* 右侧：属性面板 */}
      <aside
        style={{
          width: 300,
          height: "100%",
          background: "rgba(20, 16, 12, 0.95)",
          padding: 16,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <h2 style={{ fontSize: 18, color: "#d4a843", marginBottom: 16 }}>
          属性面板
        </h2>
        <p style={{ fontSize: 13, color: "#6a6050" }}>选中元素后显示属性</p>

        {/* 顶部工具栏 */}
        <div
          style={{
            marginTop: "auto",
            padding: 12,
            background: "rgba(42, 34, 24, 0.3)",
            borderRadius: 4,
          }}
        >
          <p style={{ fontSize: 13, color: "#b8a88c" }}>
            导入 · 导出 · 预览 · 试玩
          </p>
        </div>
      </aside>
    </div>
  );
}
