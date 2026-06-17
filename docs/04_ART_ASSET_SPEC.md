# 《雪落之前》V1 美术素材规范与文件名

## 一、参考图用途

请把两张参考图分别保存为：

```text
public/assets/references/future_2d_reference.png
public/assets/references/v1_style_reference.png
```

- `future_2d_reference.png`：未来 2D 横向移动、地图节点和大场景探索版本的理想目标。
- `v1_style_reference.png`：V1 唯一主画风参考。

V1 不提前制作可移动地图资产。

---

## 二、V1 主画风

正式定义：

> 高精度叙事像素插画风，带电影感光影、四季章节色彩、历史氛围和海报式构图。

必须具备：

- 明显像素块面和像素边缘。
- 不是低分辨率粗颗粒 16-bit 复古风。
- 画面细节丰富，但轮廓清楚。
- 人物相对环境偏小，突出“人在时代中的行走”。
- 服装、建筑、工业设备与 1930 年代时代背景相符。
- 春夏秋冬有明显但统一的色彩区分。
- 普通场景仍需为立绘和底部 UI 留出空间。

禁止：

- 写实照片感。
- 现代二次元高光皮肤。
- 3D 渲染塑料质感。
- 不同章节随意更换像素密度。
- 把人物脸画成完全不同的角色。
- 背景中出现现代标志、电子屏、现代车辆或现代字体。

---

## 三、画布与安全区

### 普通场景背景

- 尺寸：`1920 × 864`。
- 顶部 72px 为状态栏低信息安全区。
- 底部场景区不需要绘制对话框，因为底部 216px 是独立 UI。
- 人物脸、重要文字、关键建筑不得放在顶部状态栏正下方。

### 全屏特殊页面

- 尺寸：`1920 × 1080`。
- 适用：标题页、创作说明、时间说明、章节页、家书、历史事件、季节札记、结局和旅程回顾。

### 人物立绘

- 透明背景 WebP 或 PNG。
- 建议源文件：`1024 × 1024` 或更高。
- 游戏中人物高度通常为 `620—820px`。
- 同一角色不同状态的头身比例、脸型、发型、服装结构必须一致。

### UI

- 必须是透明背景 PNG。
- 不能把最终文字烘焙进 UI 图，文字由网页渲染。
- UI 装饰可使用旧报纸、档案条、木纹、金属铭牌、织物和像素边框语言，但不得过度华丽。

---

## 四、季节色彩

| 季节 | 主色倾向 | 情绪 |
|---|---|---|
| 春 | 青绿、浅蓝、暖白 | 新生、希望、理性 |
| 夏 | 金黄、暖橙、工业棕 | 实践、热烈、压力 |
| 秋 | 琥珀、橙褐、暗红 | 收获、思念、分歧 |
| 冬 | 冷蓝、灰白、深靛 | 迟疑、风雪、命运 |

第二年同季节可比第一年更深、更冷或对比更强，表现时代压力上升，但不能换成另一套画风。

---

## 五、背景素材文件名

所有背景放在：

```text
public/assets/backgrounds/
```

| 文件名 | 尺寸 | 用途与画面描述 |
|---|---:|---|
| `bg_title_winter_station.webp` | 1920×1080 | 标题页。冬季车站、远方轨道与微弱灯光，留出游戏标题位置。 |
| `bg_creative_note.webp` | 1920×1080 | 创作说明。暗色纸张、远景车站或抽象电波纹理，克制。 |
| `bg_time_note_four_seasons.webp` | 1920×1080 | 时间说明。两轮春夏秋冬的章节式像素构图。 |
| `bg_prologue_1931_station.webp` | 1920×864 | 序章。1931 年前后苏联车站，沈怀远初到异乡。 |
| `bg_day01_spring_lab.webp` | 1920×864 | 第一日实验室，春日冷暖光线、无线电设备和工作台。 |
| `bg_day02_summer_factory.webp` | 1920×864 | 工厂装配线，暖夏光与工业机械，留出人物站位。 |
| `bg_day03_autumn_postoffice.webp` | 1920×864 | 秋季邮局或邮政窗口，信件、木柜与暖棕色。 |
| `bg_day03_autumn_library.webp` | 1920×864 | 图书馆，资料、书架与秋日斜光。 |
| `bg_day03_autumn_dorm.webp` | 1920×864 | 宿舍夜晚，书桌、台灯、家书和窗外秋色。 |
| `bg_day04_winter_field_station.webp` | 1920×864 | 雪地无线电测试站，风雪、天线、临时木屋。 |
| `bg_day05_spring_exhibition.webp` | 1920×864 | 研究成果展示现场，设备、图纸和观众区。 |
| `bg_day06_summer_lab_radio.webp` | 1920×864 | 实验室无线电接收场景，指示灯、波形与压低的夏日光线。 |
| `bg_day06_summer_student_room.webp` | 1920×864 | 中国同学聚集处或学生宿舍，报纸、地图和紧张气氛。 |
| `bg_day07_autumn_archive.webp` | 1920×864 | 档案与资料整理室，文件柜、图纸、深秋色。 |
| `bg_day07_autumn_dorm.webp` | 1920×864 | 夜间宿舍或走廊，用于陈绍衡分歧与谈话。 |
| `bg_day08_winter_station.webp` | 1920×864 | 风雪中的车站与路线关闭压力。 |
| `bg_day08_winter_dorm.webp` | 1920×864 | 最后一封家书、整理行李与告别。 |
| `bg_ending_electric_wave_return.webp` | 1920×1080 | 《电波归途》。远去列车、雪线与微亮电波意象。 |
| `bg_ending_foreign_lamp.webp` | 1920×1080 | 《异乡长灯》。多年后的研究室灯光、窗外异乡冬夜。 |
| `bg_journey_review.webp` | 1920×1080 | 旅程回顾。桌面、家书、笔记、票证和留白。 |

---

## 六、人物立绘文件名

所有人物放在：

```text
public/assets/characters/
```

### 沈怀远

| 文件名 | 状态 |
|---|---|
| `char_shen_huaiyuan_neutral.webp` | 平静、日常对话 |
| `char_shen_huaiyuan_focused.webp` | 专注、实验和研究 |
| `char_shen_huaiyuan_tired.webp` | 疲惫、压力与低状态 |
| `char_shen_huaiyuan_hesitant.webp` | 犹豫、家庭与去留冲突 |
| `char_shen_huaiyuan_determined.webp` | 坚定、关键选择与结局 |

### 陈绍衡

| 文件名 | 状态 |
|---|---|
| `char_chen_shaoheng_neutral.webp` | 日常与普通讨论 |
| `char_chen_shaoheng_friendly.webp` | 第一年前期亲近 |
| `char_chen_shaoheng_tense.webp` | 1937 年路线分歧 |
| `char_chen_shaoheng_resolved.webp` | 和解、共享路线或最终行动 |

### 娜佳

| 文件名 | 状态 |
|---|---|
| `char_nadya_neutral.webp` | 日常合作 |
| `char_nadya_warm.webp` | 信任提升、含蓄亲近 |
| `char_nadya_concerned.webp` | 得知战事、担忧与挽留 |
| `char_nadya_farewell.webp` | 最终告别 |

### 别洛夫导师

| 文件名 | 状态 |
|---|---|
| `char_belov_neutral.webp` | 正式、理性 |
| `char_belov_approving.webp` | 认可能力与成熟判断 |
| `char_belov_disappointed.webp` | 失信、隐瞒或不负责任 |

### 伊万师傅

| 文件名 | 状态 |
|---|---|
| `char_ivan_neutral.webp` | 初始观察 |
| `char_ivan_skeptical.webp` | 认为主角书生气重 |
| `char_ivan_approving.webp` | 认可实践与责任 |

---

## 七、道具文件名

所有道具放在：

```text
public/assets/props/
```

| 文件名 | 用途 |
|---|---|
| `prop_envelope_family_01.png` | 第一封家书信封 |
| `prop_envelope_family_02.png` | 第二封家书信封 |
| `prop_envelope_family_03.png` | 第三封家书信封 |
| `prop_newspaper_lugouqiao_1937.png` | 卢沟桥事变历史事件页中的报纸或艺术化重构图 |
| `prop_route_note.png` | 陈绍衡提供的路线纸条 |
| `prop_research_notebook.png` | 沈怀远研究笔记 |
| `prop_recommendation_letter.png` | 别洛夫推荐信或证明 |
| `prop_nadya_scarf.png` | 娜佳赠物或告别物 |
| `prop_ticket_documents.png` | 票证与身份文件 |
| `prop_radio_blueprint.png` | 无线电图纸与技术资料 |

所有道具在 V1 中只作为剧情元素和后台标记，不制作独立背包界面。

---

## 八、UI 文件名

所有 UI 放在：

```text
public/assets/ui/
```

| 文件名 | 尺寸建议 | 用途 |
|---|---:|---|
| `ui_game_logo.png` | 透明，宽约900 | 游戏标题《雪落之前》 |
| `ui_top_status_bar.png` | 1920×72 | 顶部紧凑状态栏装饰层 |
| `ui_status_panel_expanded.png` | 760×520 | 展开状态面板背景 |
| `ui_dialogue_panel.png` | 1920×216 | 底部对话框装饰层 |
| `ui_choice_normal.png` | 760×72 | 普通选项背景 |
| `ui_choice_hover.png` | 760×72 | 选项悬停背景 |
| `ui_choice_critical.png` | 760×72 | 关键选择背景，颜色区别但不刺眼 |
| `ui_choice_locked.png` | 760×72 | 锁定选项背景 |
| `ui_history_panel.png` | 720×1080 | 右侧历史面板背景 |
| `ui_letter_paper.png` | 1100×820 | 家书信纸 UI，不烘焙文字 |
| `ui_historical_event_frame.png` | 1500×900 | 历史事件报纸框架 |
| `ui_season_journal_panel.png` | 1500×900 | 季节札记和状态摘要 |
| `ui_journey_review_panel.png` | 1500×900 | 旅程回顾面板 |
| `ui_button_primary.png` | 420×88 | 开始、继续、确认等主按钮 |
| `ui_button_secondary.png` | 360×72 | 返回、取消等次按钮 |
| `ui_icon_history.png` | 64×64 | 历史按钮 |
| `ui_icon_settings.png` | 64×64 | 设置按钮 |
| `ui_icon_expand.png` | 48×48 | 状态栏展开按钮 |

文字由网页渲染，UI 图片中不得预先写入中文。

---

## 九、章节页与自由排版

章节页不需要八张完全独立大图。优先复用对应背景并叠加：

- 半透明像素遮罩。
- 年份与季节标题。
- 地点。
- 2—4 句章节说明。

若单独生成章节页，请使用命名：

```text
chapter_day01_spring.webp
chapter_day02_summer.webp
chapter_day03_autumn.webp
chapter_day04_winter.webp
chapter_day05_spring.webp
chapter_day06_summer.webp
chapter_day07_autumn.webp
chapter_day08_winter.webp
```

放入：

```text
public/assets/backgrounds/chapters/
```

该部分为可选优化，不是 V1 必需素材。

---

## 十、生成与验收规则

每次生成角色前，先使用固定角色设定图作为参考。角色设定图建议另存：

```text
public/assets/references/character_sheet_shen.png
public/assets/references/character_sheet_chen.png
public/assets/references/character_sheet_nadya.png
public/assets/references/character_sheet_belov.png
public/assets/references/character_sheet_ivan.png
```

每张图验收：

- 画风是否与 `v1_style_reference.png` 一致。
- 人物脸型、发型、服装是否保持一致。
- 是否出现现代物品。
- 是否为顶部状态栏预留安全区。
- 是否为人物立绘和底部 UI 留出空间。
- 色彩是否符合对应季节。
- 是否存在无法读取的小字或错误文字。

历史报纸素材必须附来源记录或明确标注“艺术化重构”。
