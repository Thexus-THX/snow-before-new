# STEP 01：CSS UI 可用化修复

> 项目：《雪落之前》  
> 当前分支：develop  
> 目标：先让 UI 尺寸稳定可用，不再依赖 AI 图片本身尺寸。  
> 本步骤不新增、不替换、不生成任何美术素材。

---

## 一、为什么先做这一步

当前问题不是画风问题，而是工程尺寸问题：Panel / Button 素材尺寸与容器不匹配，导致素材不能直接当背景图使用。第一步要把 UI 的真实尺寸交给 CSS / React 控制，AI 素材只作为可选装饰，不再决定按钮和面板的实际大小。

本步骤完成后，即使没有任何 UI 图片素材，游戏也应该可以正常显示对话框、选项按钮、主按钮、返回按钮，并且所有点击区域与视觉区域一致。

---

## 二、发给 CodeBuddy 的完整提示词

```md
请在当前 develop 分支上执行 STEP 01：CSS UI 可用化修复。

## 重要限制

1. 不要新增、替换、生成任何美术素材、背景图、UI 图片、按钮图片、图标、音频文件。
2. 不要擅自修改现有资源命名。
3. 不要改剧情 JSON。
4. 不要改音频系统。
5. 不要改路由结构。
6. 不要做 P2 音频和 P3 编辑器。
7. 不要推送 GitHub，因为当前远程推送网络不稳定。
8. 本次只做 UI 工程适配，让 UI 不再依赖图片原始尺寸。

## 核心目标

把 Panel / Button 从“整张背景图依赖”改为：

CSS 控制真实尺寸 + HTML 渲染文字 + 可选素材装饰 + 无素材时安全降级。

也就是说：

- 容器尺寸必须由 CSS 决定。
- 文本必须由 HTML / React 渲染。
- 图片不能撑开 UI。
- 图片不能决定点击区域。
- 图片不能包含按钮文字。
- 没有合适图片素材时，必须使用 CSS 样式正常显示。

---

## 三、先检查项目结构

开始修改前，请先扫描当前项目结构，找出以下内容的位置：

1. GameViewport 组件
2. DialoguePanel / 对话框相关组件
3. Choice / 选项按钮相关组件
4. TitlePage / SettingsPage / GamePage 等页面
5. 当前 CSS / SCSS / module.css 文件
6. 当前 UI 图片资源引用位置
7. 当前测试文件位置

扫描完成后，先输出“准备修改的文件列表”，再开始修改。

---

## 四、新增或整理 UI 尺寸常量

请新增或整理一个 UI 尺寸常量文件，优先放在类似位置：

- src/constants/ui.ts
- src/config/ui.ts
- src/game/constants/ui.ts

如果项目已有 constants 目录，请复用现有结构。

需要包含以下常量：

```ts
export const DESIGN_WIDTH = 1920;
export const DESIGN_HEIGHT = 1080;

export const DIALOGUE_PANEL_WIDTH = 1920;
export const DIALOGUE_PANEL_HEIGHT = 216;

export const CHOICE_BUTTON_WIDTH = 1920;
export const CHOICE_BUTTON_HEIGHT = 72;

export const PRIMARY_BUTTON_WIDTH = 300;
export const PRIMARY_BUTTON_HEIGHT = 64;

export const SECONDARY_BUTTON_WIDTH = 300;
export const SECONDARY_BUTTON_HEIGHT = 64;
```

如果当前项目更适合用对象形式，也可以写成：

```ts
export const UI_SIZE = {
  design: { width: 1920, height: 1080 },
  dialoguePanel: { width: 1920, height: 216 },
  choiceButton: { width: 1920, height: 72 },
  primaryButton: { width: 300, height: 64 },
  secondaryButton: { width: 300, height: 64 },
} as const;
```

---

## 五、建立通用 UI 组件

请建立或整理以下组件：

1. UiPanel
2. DialoguePanel
3. ChoiceButton
4. PrimaryButton
5. SecondaryButton

如果项目中已经有类似组件，不要重复造一套，而是在现有组件基础上重构。

### 1. UiPanel

用途：通用面板基础组件。

要求：

- 支持 className
- 支持 style
- 支持 children
- 默认 box-sizing: border-box
- 默认 position: relative
- 不依赖图片尺寸
- 预留 data-ui-debug 属性

建议 props：

```ts
type UiPanelProps = {
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
  debugName?: string;
};
```

### 2. DialoguePanel

用途：游戏底部对话框。

要求：

- 固定放在 1920×1080 设计画布底部。
- 宽度 1920px。
- 高度 216px。
- left: 0。
- bottom: 0。
- 不使用 background-size: cover。
- 不允许图片裁剪影响文字区域。
- 角色名、正文、提示文字都用 HTML / CSS 渲染。

建议结构：

```tsx
<div className="dialoguePanel">
  <div className="dialoguePanel__name">角色名</div>
  <div className="dialoguePanel__text">正文</div>
  <div className="dialoguePanel__hint">点击显示全文</div>
</div>
```

### 3. ChoiceButton

用途：选择项按钮。

要求：

- 高度固定 72px。
- 宽度根据当前设计需要，优先为 1920px 或父容器宽度。
- 点击区域必须等于视觉区域。
- hover / active 用 CSS 实现。
- disabled 状态必须明确。
- 文字用 HTML 渲染。

### 4. PrimaryButton / SecondaryButton

用途：主按钮、次按钮。

要求：

- 默认尺寸 300×64。
- 支持 children。
- 支持 onClick。
- 支持 disabled。
- 支持 type="button"，避免表单误提交。
- 视觉风格用 CSS 实现。
- 不依赖图片尺寸。

---

## 六、CSS 实现要求

请建立或整理 CSS，优先使用项目现有 CSS 方案。

必须满足：

```css
* {
  box-sizing: border-box;
}
```

核心 UI 类建议：

```css
.uiPanel {
  position: relative;
  box-sizing: border-box;
  overflow: hidden;
}

.dialoguePanel {
  position: absolute;
  left: 0;
  bottom: 0;
  width: 1920px;
  height: 216px;
  box-sizing: border-box;
  overflow: hidden;

  background:
    linear-gradient(180deg, rgba(42, 38, 30, 0.94), rgba(22, 20, 17, 0.98));
  border-top: 2px solid rgba(188, 151, 82, 0.75);
  box-shadow: 0 -8px 32px rgba(0, 0, 0, 0.45);
}

.dialoguePanel::before {
  content: "";
  position: absolute;
  inset: 0;
  pointer-events: none;
  opacity: 0.18;
  background-image:
    repeating-linear-gradient(
      0deg,
      rgba(255, 255, 255, 0.05) 0,
      rgba(255, 255, 255, 0.05) 1px,
      transparent 1px,
      transparent 4px
    );
}

.dialoguePanel__name {
  position: absolute;
  left: 96px;
  top: 28px;
  min-width: 180px;
  height: 40px;
  padding: 0 24px;
  display: flex;
  align-items: center;
  font-size: 24px;
  line-height: 1;
  color: #e7d3a2;
  border-left: 4px solid rgba(188, 151, 82, 0.9);
}

.dialoguePanel__text {
  position: absolute;
  left: 96px;
  right: 96px;
  top: 82px;
  bottom: 42px;
  font-size: 30px;
  line-height: 1.55;
  color: #f1ead7;
  overflow: hidden;
}

.dialoguePanel__hint {
  position: absolute;
  right: 96px;
  bottom: 20px;
  font-size: 18px;
  color: rgba(241, 234, 215, 0.66);
}

.choiceButton {
  width: 100%;
  min-height: 72px;
  padding: 0 48px;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  box-sizing: border-box;
  border: 1px solid rgba(188, 151, 82, 0.52);
  background: rgba(35, 31, 25, 0.88);
  color: #f1ead7;
  cursor: pointer;
}

.choiceButton:hover:not(:disabled) {
  background: rgba(70, 57, 38, 0.95);
  border-color: rgba(219, 179, 98, 0.9);
}

.choiceButton:active:not(:disabled) {
  transform: translateY(1px);
}

.choiceButton:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.primaryButton,
.secondaryButton {
  width: 300px;
  height: 64px;
  box-sizing: border-box;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid rgba(188, 151, 82, 0.75);
  cursor: pointer;
  user-select: none;
}

.primaryButton {
  background: linear-gradient(180deg, #7d5c2f, #3e2d1d);
  color: #f7efd9;
}

.secondaryButton {
  background: rgba(232, 218, 184, 0.12);
  color: #e9ddbd;
}

.primaryButton:hover:not(:disabled),
.secondaryButton:hover:not(:disabled) {
  filter: brightness(1.08);
}

.primaryButton:disabled,
.secondaryButton:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}
```

可以根据项目现有风格调整颜色，但不能牺牲尺寸稳定性。

---

## 七、预留九宫格接口，但本次不要强依赖素材

请在 CSS 中预留类似结构，但默认不要启用，避免当前素材尺寸继续污染 UI：

```css
.uiPanel--nineSlice {
  /* 未来有合格素材后再启用 */
  /* border-image-source: var(--ui-border-image); */
  /* border-image-slice: 24 fill; */
  /* border-image-width: 24px; */
  /* border-image-repeat: stretch; */
}
```

要求：

- 当前没有合格素材时不能报错。
- 不能因为图片加载失败导致 UI 消失。
- 不能把文字烘焙进图片。

---

## 八、添加 UI Debug 模式

请添加一个轻量 UI 调试开关，方便检查尺寸。

可选实现方式：

1. URL 参数：`?uiDebug=1`
2. localStorage：`localStorage.setItem('uiDebug', '1')`
3. 开发环境变量

建议优先支持 URL 参数和 localStorage。

Debug 模式开启后：

- 所有关键 UI 元素显示红色或绿色边框。
- DialoguePanel 显示实际尺寸：`DialoguePanel 1920×216`。
- ChoiceButton 显示实际高度。
- 显示当前 GameViewport scale。
- Debug 信息不能影响正式布局。

示例：

```tsx
const isUiDebug =
  new URLSearchParams(window.location.search).get('uiDebug') === '1' ||
  localStorage.getItem('uiDebug') === '1';
```

---

## 九、必须检查的页面

修改后请至少检查：

1. TitlePage
2. SettingsPage
3. GamePage / MainGamePage
4. 普通对话场景
5. 选择场景
6. 家书 / 札记 / 历史事件等特殊场景，如果它们使用了 UI 面板

---

## 十、验收标准

完成后必须满足：

1. 游戏可运行。
2. 测试全部通过。
3. 对话框固定为 1920×216，位于 1920×1080 画布底部。
4. 按钮点击区域与视觉区域一致。
5. UI 不再被图片原始尺寸撑开或压缩。
6. 不再因为 `dialogue_panel 1881×836` 这类素材尺寸错误导致布局错乱。
7. 没有新增任何素材文件。
8. 没有修改剧情 JSON。
9. 没有修改音频系统。
10. Debug 模式可以显示 UI 实际尺寸。

---

## 十一、完成后请输出报告

请在完成修改后输出以下内容：

```md
# STEP 01 完成报告

## 修改文件
- xxx
- xxx

## 做了什么
- xxx

## 没有做什么
- 未新增素材
- 未修改剧情 JSON
- 未修改音频系统
- 未推送远程仓库

## 测试结果
- npm test: 通过 / 失败
- npm run build: 通过 / 失败

## UI 检查方式
- 普通运行：xxx
- 开启 UI Debug：xxx

## 下一步建议
- STEP 02：接入可选九宫格边框素材
```
```

---

## 三、你自己使用时的操作顺序

1. 把上面的完整提示词复制给 CodeBuddy。
2. 等它先列“准备修改的文件列表”。
3. 确认它没有新增素材文件。
4. 让它执行修改。
5. 让它跑测试和构建。
6. 打开游戏，加上 `?uiDebug=1` 检查尺寸。
7. 重点看对话框、选择按钮、设置页按钮、开始页按钮。

---

## 四、不要让 CodeBuddy 做的事

这一步绝对不要让它做：

- 不要重新生成 UI 图片。
- 不要新增 `dialogue_panel_new.png`。
- 不要新增临时按钮图。
- 不要把文字写进图片。
- 不要改剧情文件。
- 不要改音频系统。
- 不要直接做编辑器。
- 不要为了适配图片去改画布尺寸。

---

## 五、这一步完成后的判断标准

只要你打开游戏后看到：

- 底部对话框尺寸稳定；
- 文字不会跑出面板；
- 按钮能正常 hover；
- 点击区域和按钮视觉区域一致；
- 缩放窗口后 UI 仍跟着 GameViewport 一起缩放；
- 没有 UI 图片也能正常显示；

就说明第一步成功。
