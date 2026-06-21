import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import GameViewport from "@/components/common/GameViewport";
import MobileLandscapeHint from "@/components/common/MobileLandscapeHint";
import { useGameStore } from "@/app/stores/gameStore";
import { useEndingGalleryStore } from "@/app/stores/endingGalleryStore";

/** 结局图鉴页面 - 档案册风格 */
export default function EndingGalleryPage() {
  const navigate = useNavigate();
  const { gameData } = useGameStore();
  const { isEndingUnlocked, getLatestUnlockRecord } = useEndingGalleryStore();
  const [selectedEndingId, setSelectedEndingId] = useState<string | null>(null);

  // 从 gameData 中提取结局场景列表
  const endings = useMemo(() => {
    if (!gameData) return [];
    return Object.values(gameData.scenes)
      .filter((scene) => scene.template === "ending")
      .map((scene) => ({
        id: scene.id,
        name: scene.name,
        background: scene.background,
        title: scene.content?.ending?.title ?? scene.name,
        paragraphs: scene.content?.ending?.paragraphs ?? [],
      }));
  }, [gameData]);

  // 获取选中的结局详情
  const selectedEnding = selectedEndingId
    ? endings.find((e) => e.id === selectedEndingId)
    : null;
  const unlockRecord = selectedEndingId
    ? getLatestUnlockRecord(selectedEndingId)
    : null;

  return (
    <>
      <MobileLandscapeHint />
      <GameViewport>
      <div
        className="gallery-page"
        style={{
          width: 1920,
          height: 1080,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "flex-start",
          paddingTop: 40,
          background:
            "linear-gradient(180deg, #1a1610 0%, #2a2218 50%, #1a1610 100%)",
          color: "#e8dfcf",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* 纸质纹理背景 */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            opacity: 0.06,
            backgroundImage:
              'repeating-linear-gradient(0deg, transparent, transparent 28px, rgba(60,50,35,0.3) 28px, rgba(60,50,35,0.3) 29px)',
            pointerEvents: "none",
          }}
        />

        {/* 标题 */}
        <h1
          style={{
            fontSize: 36,
            fontWeight: 400,
            letterSpacing: 12,
            marginBottom: 16,
            fontFamily: "serif",
            color: "#c4a85c",
            textShadow: "0 2px 4px rgba(0,0,0,0.5)",
            position: "relative",
            zIndex: 1,
          }}
        >
          结 局 图 鉴
        </h1>

        <p
          style={{
            fontSize: 14,
            color: "#8a7a5e",
            letterSpacing: 4,
            marginBottom: 32,
            position: "relative",
            zIndex: 1,
          }}
        >
          记录每一段旅程的终点
        </p>

        {/* 结局网格 - 档案册卡片风格 */}
        <div
          className="gallery-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 24,
            padding: "20px 80px",
            maxWidth: 1400,
            maxHeight: 680,
            overflowY: "auto",
            position: "relative",
            zIndex: 1,
          }}
        >
          {endings.map((ending) => {
            const unlocked = isEndingUnlocked(ending.id);
            const isSelected = selectedEndingId === ending.id;

            return (
              <div
                key={ending.id}
                className="gallery-card"
                onClick={() =>
                  unlocked
                    ? setSelectedEndingId(isSelected ? null : ending.id)
                    : undefined
                }
                style={{
                  width: 360,
                  height: 260,
                  borderRadius: 3,
                  border: isSelected
                    ? "3px solid #c4a85c"
                    : unlocked
                      ? "2px solid #6a5840"
                      : "2px solid #3a3028",
                  cursor: unlocked ? "pointer" : "default",
                  position: "relative",
                  overflow: "hidden",
                  background: "#1e1812",
                  boxShadow: isSelected
                    ? "0 0 20px rgba(196,168,92,0.25)"
                    : "0 4px 12px rgba(0,0,0,0.4)",
                  transition: "border-color 0.2s, box-shadow 0.2s",
                }}
              >
                {/* 结局背景图 / 锁定遮罩 */}
                <div
                  style={{
                    width: "100%",
                    height: "100%",
                    position: "relative",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {unlocked ? (
                    <>
                      {/* 已解锁：显示背景图 */}
                      {ending.background ? (
                        <img
                          src={ending.background}
                          alt={ending.title}
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                            filter: "grayscale(30%) sepia(20%) brightness(0.7)",
                          }}
                        />
                      ) : (
                        <div
                          style={{
                            width: "100%",
                            height: "100%",
                            background:
                              "linear-gradient(135deg, #3a2818, #1a1208)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <span
                            style={{ fontSize: 48, color: "#6a5840" }}>
                            ?
                          </span>
                        </div>
                      )}
                      {/* 半透明暗色叠加层 */}
                      <div
                        style={{
                          position: "absolute",
                          inset: 0,
                          background:
                            "linear-gradient(180deg, transparent 50%, rgba(10,8,6,0.75) 100%)",
                        }}
                      />
                      {/* 结局名称 */}
                      <div
                        style={{
                          position: "absolute",
                          bottom: 12,
                          left: 0,
                          right: 0,
                          textAlign: "center",
                        }}
                      >
                        <span
                          style={{
                            fontSize: 18,
                            color: "#e8dfcf",
                            letterSpacing: 4,
                            textShadow:
                              "0 1px 3px rgba(0,0,0,0.8)",
                          }}
                        >
                          {ending.title}
                        </span>
                      </div>
                    </>
                  ) : (
                    /* 未解锁：锁状态 */
                    <div
                      style={{
                        width: "100%",
                        height: "100%",
                        background:
                          "linear-gradient(135deg, #2a1a12, #1a0e08)",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 16,
                      }}
                    >
                      {/* 锁图标 - SVG */}
                      <svg
                        width="64"
                        height="72"
                        viewBox="0 0 24 27"
                        fill="none"
                        style={{ opacity: 0.45 }}
                      >
                        <rect
                          x="4"
                          y="11"
                          width="16"
                          height="14"
                          rx="2"
                          stroke="#9a8870"
                          strokeWidth="1.5"
                          fill="none"
                        />
                        <path
                          d="M8 11V7a4 4 0 018 0v4"
                          stroke="#9a8870"
                          strokeWidth="1.5"
                          fill="none"
                          strokeLinecap="round"
                        />
                        <circle cx="12" cy="17.5" r="1.5" fill="#9a8870" />
                      </svg>
                      <span
                        style={{
                          fontSize: 22,
                          color: "#6a5540",
                          letterSpacing: 6,
                        }}
                      >
                        ????
                      </span>
                    </div>
                  )}
                </div>

                {/* 右上角胶带装饰 */}
                <div
                  style={{
                    position: "absolute",
                    top: -1,
                    right: 24,
                    width: 56,
                    height: 18,
                    background: "rgba(220,210,190,0.15)",
                    transform: "rotate(2deg)",
                    borderRadius: 1,
                    border: "1px solid rgba(200,185,160,0.1)",
                  }}
                />
              </div>
            );
          })}
        </div>

        {/* ===== 全屏详情弹窗：点击背景后放大展示 ===== */}
        {selectedEnding && unlockRecord && (
          <div
            className="gallery-detail-overlay"
            onClick={() => setSelectedEndingId(null)}
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 100,
              background: "rgba(6,4,2,0.88)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              backdropFilter: "blur(4px)",
            }}
          >
            <div
              className="gallery-detail-panel"
              onClick={(e) => e.stopPropagation()}
              style={{
                width: 1400,
                maxHeight: 900,
                borderRadius: 4,
                border: "2px solid #5a4a34",
                background: "#14100c",
                boxShadow: "0 16px 64px rgba(0,0,0,0.7)",
                padding: 32,
                display: "flex",
                flexDirection: "column",
                gap: 20,
                overflowY: "auto",
                position: "relative",
              }}
            >
              {/* 关闭按钮 */}
              <button
                onClick={() => setSelectedEndingId(null)}
                style={{
                  position: "absolute",
                  top: 12,
                  right: 16,
                  background: "rgba(90,74,52,0.3)",
                  border: "1px solid #5a4a34",
                  color: "#b8a88c",
                  fontSize: 22,
                  cursor: "pointer",
                  lineHeight: 1,
                  width: 36,
                  height: 36,
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  zIndex: 10,
                }}
              >
                &times;
              </button>

              {/* 上半部分：放大背景 + 标题 + 描述 */}
              <div
                className="gallery-detail-body"
                style={{
                  display: "flex",
                  gap: 32,
                  alignItems: "stretch",
                }}
              >
                {/* 放大后的结局背景图 */}
                <div
                  className="gallery-detail-image"
                  style={{
                    flex: "0 0 600",
                    borderRadius: 3,
                    overflow: "hidden",
                    border: "2px solid #3a2a18",
                    position: "relative",
                  }}
                >
                  {selectedEnding.background ? (
                    <img
                      src={selectedEnding.background}
                      alt={selectedEnding.title}
                      style={{ width: "100%", height: "100%", objectFit: "cover", minHeight: 360 }}
                    />
                  ) : (
                    <div
                      style={{
                        width: "100%",
                        minHeight: 360,
                        background:
                          "linear-gradient(135deg, #3a2818, #1a1208)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <span style={{ fontSize: 72, color: "#6a5840" }}>?</span>
                    </div>
                  )}
                  {/* 背景底部标题叠加 */}
                  <div
                    style={{
                      position: "absolute",
                      bottom: 0,
                      left: 0,
                      right: 0,
                      padding: "16px 20px",
                      background:
                        "linear-gradient(transparent, rgba(6,4,2,0.92))",
                    }}
                  >
                    <span
                      style={{
                        fontSize: 26,
                        fontFamily: "serif",
                        color: "#d4c4a0",
                        letterSpacing: 8,
                        textShadow: "0 2px 8px rgba(0,0,0,0.9)",
                      }}
                    >
                      {selectedEnding.title}
                    </span>
                  </div>
                </div>

                {/* 右侧：结局描述 */}
                <div
                  className="gallery-detail-text"
                  style={{
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    gap: 12,
                    minWidth: 320,
                  }}
                >
                  {/* 结局段落描述 */}
                  {selectedEnding.paragraphs.map((p, i) => (
                    <p
                      key={i}
                      style={{
                        fontSize: 15,
                        lineHeight: 2,
                        color: "#c4b89c",
                        textIndent: "2em",
                        margin: 0,
                      }}
                    >
                      {p}
                    </p>
                  ))}

                  {/* 解锁时间 */}
                  <p
                    style={{
                      fontSize: 11,
                      color: "#5a4a38",
                      marginTop: "auto",
                      textAlign: "right",
                    }}
                  >
                    解锁于{" "}
                    {new Date(unlockRecord.unlockedAt).toLocaleDateString(
                      "zh-CN",
                      {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      }
                    )}
                  </p>
                </div>
              </div>

              {/* 分隔线 */}
              <hr
                style={{
                  border: "none",
                  borderTop: "1px solid #3a2a18",
                  margin: "4px 0",
                }}
              />

              {/* 下半部分：横向故事线 —— 关键转折点 */}
              <div className="gallery-timeline">
                <h3
                  style={{
                    fontSize: 16,
                    color: "#c4a85c",
                    letterSpacing: 4,
                    marginBottom: 16,
                    fontFamily: "serif",
                  }}
                >
                  &middot; 旅程中的关键转折 &middot;
                </h3>

                {unlockRecord.keyTurningPoints.length > 0 ? (
                  /* 横向滚动故事线容器 */
                  <div
                    style={{
                      display: "flex",
                      gap: 0,
                      overflowX: "auto",
                      paddingBottom: 12,
                      paddingTop: 8,
                      position: "relative",
                    }}
                  >
                    {/* 横向连接线 */}
                    <div
                      style={{
                        position: "absolute",
                        top: "42px",
                        left: 20,
                        right: 20,
                        height: 2,
                        background:
                          "linear-gradient(90deg, #5a4a34, #8a7048, #5a4a34)",
                        zIndex: 0,
                      }}
                    />

                    {unlockRecord.keyTurningPoints.map((point, idx) => (
                      /* 每个转折点卡片 */
                      <div
                        key={idx}
                        style={{
                          flex: "0 0 auto",
                          width: 200,
                          marginRight: idx < unlockRecord.keyTurningPoints.length - 1 ? 8 : 0,
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          position: "relative",
                          zIndex: 1,
                        }}
                      >
                        {/* 时间轴圆点 */}
                        <div
                          style={{
                            width: 16,
                            height: 16,
                            borderRadius: "50%",
                            border: `2px solid ${
                              point.isCritical ? "#c45a46" : "#d4a843"
                            }`,
                            background: point.isCritical
                              ? "rgba(196,90,70,0.25)"
                              : "rgba(212,168,67,0.15)",
                            marginTop: 34,
                            marginBottom: 10,
                            boxShadow: point.isCritical
                              ? "0 0 8px rgba(196,90,70,0.35)"
                              : "0 0 8px rgba(212,168,67,0.25)",
                          }}
                        />

                        {/* 卡片内容 */}
                        <div
                          style={{
                            width: "100%",
                            padding: "12px 14px",
                            borderRadius: 3,
                            background: point.isCritical
                              ? "rgba(196,90,70,0.08)"
                              : "rgba(212,168,67,0.05)",
                            border: `1px solid ${
                              point.isCritical
                                ? "rgba(196,90,70,0.25)"
                                : "rgba(212,168,67,0.18)"
                            }`,
                            borderLeft: `3px solid ${
                              point.isCritical ? "#c45a46" : "#d4a843"
                            }`,
                          }}
                        >
                          {/* 类型标签 */}
                          <div
                            style={{
                              fontSize: 11,
                              color: point.isCritical
                                ? "#d47a68"
                                : "#d4a843",
                              fontWeight: 500,
                              marginBottom: 6,
                              textAlign: "center",
                              letterSpacing: 1,
                            }}
                          >
                            {point.isCritical
                              ? "◆ 关键抉择"
                              : "◇ 重要选择"}
                          </div>

                          {/* 选择内容 */}
                          <div
                            style={{
                              fontSize: 13,
                              color: "#d4c4a8",
                              lineHeight: 1.5,
                              marginBottom: 8,
                              minHeight: 38,
                              display: "-webkit-box",
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: "vertical",
                              overflow: "hidden",
                              textAlign: "center",
                            }}
                          >
                            「{point.choiceText}」
                          </div>

                          {/* 效果标签 */}
                          {point.visibleEffects.length > 0 && (
                            <div
                              style={{
                                fontSize: 11,
                                color: "#8a7a5e",
                                textAlign: "center",
                                borderTop: "1px solid rgba(255,255,255,0.06)",
                                paddingTop: 6,
                              }}
                            >
                              {point.visibleEffects.join(" · ")}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p
                    style={{
                      fontSize: 13,
                      color: "#6a5a44",
                      fontStyle: "italic",
                    }}
                  >
                    尚无转折点记录，完成一次结局后将在此展示你的旅程轨迹……
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 返回按钮 */}
        <button
          onClick={() => navigate("/")}
          style={{
            marginTop: 24,
            padding: "12px 48px",
            border: "1px solid #5a5040",
            borderRadius: 4,
            background: "rgba(42, 34, 24, 0.4)",
            color: "#b8a88c",
            cursor: "pointer",
            fontSize: 16,
            position: "relative",
            zIndex: 1,
          }}
        >
          返回标题
        </button>

        <p
          style={{
            fontSize: 14,
            color: "#6a6050",
            marginTop: 24,
            position: "relative",
            zIndex: 1,
          }}
        >
          雪落之前 · 结局图鉴
        </p>
      </div>
      </GameViewport>
    </>
  );
}
