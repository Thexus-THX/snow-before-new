# UI组件系统（CodeBuddy）

## 1. Button组件

所有按钮必须基于已有UI资产组合，不允许重新设计视觉。

```ts
<Button variant="primary" state="default" />
<Button variant="secondary" />
<Button variant="choice" state="hover" />
```

---

### Button Variants

- primary → ui_button_primary.png
- secondary → ui_button_secondary.png
- choice → ui_choice_*.png

---

## 2. Panel组件

```ts
<Panel type="dialogue" />
<Panel type="history" />
<Panel type="expanded" />
<Panel type="journal" />
```

---

### Panel映射

- dialogue → ui_dialogue_panel.png
- history → ui_history_panel.png
- expanded → ui_status_panel_expanded.png
- journal → ui_season_journal_panel.png
- journey → ui_journey_review_panel.png

---

## 3. Icon组件

```ts
<Icon name="history" />
<Icon name="settings" />
<Icon name="expand" />
```

---

## 4. Letter组件（特殊系统）

信件UI必须使用动态内容注入：

```ts
<LetterPaper content={dynamicText} />
```

⚠ 禁止写死文本在UI中

---

## 5. UI状态系统

所有UI组件必须支持状态：

- normal
- hover
- active
- locked
- critical

---

## 6. 规则

- UI必须来自 assets/ui/
- 不允许生成新视觉风格
- UI必须是“档案系统”，不是现代界面
