/**
 * ui.ts — UI 尺寸常量
 *
 * 所有 UI 组件的真实尺寸由这里定义，不依赖图片原始尺寸。
 */
export const DESIGN_WIDTH = 1920;
export const DESIGN_HEIGHT = 1080;

/** 底部对话框 */
export const DIALOGUE_PANEL_WIDTH = 1920;
export const DIALOGUE_PANEL_HEIGHT = 216;

/** 选择项按钮 */
export const CHOICE_BUTTON_WIDTH = 1920;
export const CHOICE_BUTTON_HEIGHT = 72;

/** 主按钮（开始新游戏等） */
export const PRIMARY_BUTTON_WIDTH = 300;
export const PRIMARY_BUTTON_HEIGHT = 64;

/** 次按钮（继续旅程、设置等） */
export const SECONDARY_BUTTON_WIDTH = 300;
export const SECONDARY_BUTTON_HEIGHT = 64;

/** 对象形式（方便批量引用） */
export const UI_SIZE = {
  design: { width: DESIGN_WIDTH, height: DESIGN_HEIGHT },
  dialoguePanel: { width: DIALOGUE_PANEL_WIDTH, height: DIALOGUE_PANEL_HEIGHT },
  choiceButton: { width: CHOICE_BUTTON_WIDTH, height: CHOICE_BUTTON_HEIGHT },
  primaryButton: { width: PRIMARY_BUTTON_WIDTH, height: PRIMARY_BUTTON_HEIGHT },
  secondaryButton: { width: SECONDARY_BUTTON_WIDTH, height: SECONDARY_BUTTON_HEIGHT },
} as const;
