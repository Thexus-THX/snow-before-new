/**
 * ui.ts — UI Design Tokens & 尺寸常量
 *
 * 所有 UI 组件的真实尺寸、视觉变量由这里统一定义。
 * 不依赖图片原始尺寸，CSS 变量优先。
 */

// ============================================================
// 设计画布
// ============================================================

export const DESIGN_WIDTH = 1920;
export const DESIGN_HEIGHT = 1080;

// ============================================================
// 组件尺寸
// ============================================================

/** 底部对话框 */
export const DIALOGUE_PANEL_WIDTH = 1920;
export const DIALOGUE_PANEL_HEIGHT = 216;

/** 选择面板（同对话框尺寸） */
export const CHOICE_PANEL_WIDTH = 1920;
export const CHOICE_PANEL_HEIGHT = 216;

/** 选择项按钮 */
export const CHOICE_BUTTON_WIDTH = 1920;
export const CHOICE_BUTTON_HEIGHT = 72;

/** 主按钮（开始新游戏等） */
export const PRIMARY_BUTTON_WIDTH = 300;
export const PRIMARY_BUTTON_HEIGHT = 64;

/** 次按钮（继续旅程、设置等） */
export const SECONDARY_BUTTON_WIDTH = 300;
export const SECONDARY_BUTTON_HEIGHT = 64;

// ============================================================
// 层级 (z-index)
// ============================================================

export const UI_Z_INDEX = {
  /** 背景 / 画布 */
  background: 0,
  /** 场景内容 */
  scene: 10,
  /** UI 面板（对话框、选择面板） */
  panel: 100,
  /** 浮层按钮 */
  overlay: 200,
  /** 模态弹窗（确认框、历史面板） */
  modal: 300,
  /** Debug 标签 */
  debug: 999,
} as const;

// ============================================================
// 间距
// ============================================================

export const UI_SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  /** 面板水平内边距 */
  panelH: 48,
  /** 面板垂直内边距 */
  panelV: 24,
  /** 按钮之间间距 */
  buttonGap: 10,
} as const;

// ============================================================
// 圆角
// ============================================================

export const UI_BORDER_RADIUS = {
  none: 0,
  sm: 2,
  md: 4,
  lg: 8,
} as const;

// ============================================================
// 字号
// ============================================================

export const UI_FONT_SIZE = {
  tiny: 12,
  small: 14,
  status: 16,
  hint: 18,
  choice: 22,
  dialogue: 24,
  button: 22,
  title: 36,
} as const;

// ============================================================
// 面板透明度
// ============================================================

export const UI_PANEL_OPACITY = {
  /** 对话框背景 */
  dialogue: 0.94,
  /** 选择面板背景 */
  choice: 0.92,
  /** 按钮常态 */
  button: 0.88,
  /** 按钮 hover */
  buttonHover: 0.95,
  /** 锁定/禁用 */
  locked: 0.45,
} as const;

// ============================================================
// 按钮状态色
// ============================================================

export const UI_BUTTON_STATE = {
  /** 普通按钮背景 */
  normalBg: "rgba(35, 31, 25, 0.88)",
  /** hover 背景 */
  hoverBg: "rgba(70, 57, 38, 0.95)",
  /** 关键选择背景 */
  criticalBg: "rgba(90, 48, 32, 0.72)",
  /** 禁用背景 */
  disabledBg: "rgba(30, 25, 18, 0.5)",
  /** 边框色 */
  border: "rgba(188, 151, 82, 0.52)",
  /** hover 边框色 */
  hoverBorder: "rgba(219, 179, 98, 0.9)",
  /** 关键选择边框色 */
  criticalBorder: "rgba(200, 100, 50, 0.6)",
  /** 禁用边框色 */
  disabledBorder: "rgba(60, 50, 38, 0.3)",
} as const;

// ============================================================
// 安全区域
// ============================================================

export const UI_SAFE_AREA = {
  /** 顶部状态栏高 */
  top: 72,
  /** 底部面板高 */
  bottom: 216,
  /** 水平边距 */
  h: 48,
} as const;

// ============================================================
// 九宫格预留 CSS 变量名
// ============================================================

export const NINE_SLICE_VARS = {
  borderImage: "--ui-border-image",
  borderSlice: "--ui-border-slice",
  borderWidth: "--ui-border-width",
  panelTexture: "--ui-panel-texture",
} as const;

// ============================================================
// 对象形式
// ============================================================

export const UI_SIZE = {
  design: { width: DESIGN_WIDTH, height: DESIGN_HEIGHT },
  dialoguePanel: { width: DIALOGUE_PANEL_WIDTH, height: DIALOGUE_PANEL_HEIGHT },
  choicePanel: { width: CHOICE_PANEL_WIDTH, height: CHOICE_PANEL_HEIGHT },
  choiceButton: { width: CHOICE_BUTTON_WIDTH, height: CHOICE_BUTTON_HEIGHT },
  primaryButton: { width: PRIMARY_BUTTON_WIDTH, height: PRIMARY_BUTTON_HEIGHT },
  secondaryButton: { width: SECONDARY_BUTTON_WIDTH, height: SECONDARY_BUTTON_HEIGHT },
} as const;
