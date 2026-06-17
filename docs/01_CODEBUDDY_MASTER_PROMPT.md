# CodeBuddy 总开发提示词：《雪落之前》V1

你是本项目的主程序与技术架构负责人。请先完整读取下列文件，再开始修改代码：

1. `docs/00_README.md`
2. `docs/02_GAME_LOGIC.md`
3. `docs/03_STORY_BLUEPRINT.md`
4. `docs/04_ART_ASSET_SPEC.md`
5. `docs/05_AUDIO_ASSET_SPEC.md`
6. `docs/06_EDITOR_USER_GUIDE.md`
7. `docs/07_DATA_SCHEMA.md`

如果这些文件尚未放入仓库，请先创建 `docs/` 目录并保持原文件名。不得在未读完文档前自行发明剧情、变量、素材文件名或结局规则。

---

## 一、项目目标

开发一个可静态部署、通过桌面端浏览器直接打开的历史叙事选择游戏，并提供团队内部使用的轻量可视化内容编辑器。

项目名称：`《雪落之前》`

V1 核心体验：

- 开场创作说明。
- 标题页与“开始游戏 / 继续游戏 / 设置”。
- 时间说明。
- 1931 年前后的短序章。
- 1936 年春至 1937 年冬的八个季节章节。
- 约 19 次有效选择，其中 7 次标注为【关键选择】。
- 三项显性数值、三项隐藏长期数值、四名核心角色独立信任、行动准备五项清单和关键标记。
- 家书纸张弹窗、卢沟桥事变历史事件页、季节札记、自动存档、历史回看和普通选择回滚。
- V1 优先完整实现两条主结局：《电波归途》《异乡长灯》。
- 结局后显示叙事化旅程回顾。
- `/editor` 可视化编辑器。

不得把剧情写死在 React 组件里。所有场景、对白、选择、效果和跳转必须由 JSON 数据驱动。

---

## 二、固定技术栈

请使用：

- React
- TypeScript
- Vite
- React Router
- Zustand
- React Konva
- Zod
- CSS Modules 或普通 CSS 变量体系
- LocalStorage

V1 不使用后端、数据库、账号系统和实时 AI API。

静态资源必须从 `/public/assets/` 读取。

---

## 三、固定路由

```text
/              标题页与玩家端入口
/game          游戏运行器
/editor        可视化编辑器
/settings      可选：设置页面或弹窗路由
```

浏览器刷新任意路由后不得 404。部署配置需支持 SPA 回退。

---

## 四、固定画布与 UI

逻辑画布：`1920 × 1080`，固定 16:9。

普通场景：

```text
顶部状态栏：72px，叠加在场景区顶部
场景区：1920 × 864
底部对话区：1920 × 216
```

要求：

- 页面按浏览器窗口整体等比例缩放。
- 不拉伸图片。
- 不擅自裁切关键内容。
- 普通场景显示顶部状态栏和底部对话区。
- 创作说明、时间说明、章节页、家书、历史事件、季节札记、结局和旅程回顾可隐藏顶部状态栏，并使用全屏自由排版。

顶部状态栏：

- 左侧：年份、季节、地点、章节名。
- 右侧：学识、身心状态、行动准备。
- 点击后向下展开完整状态面板和行动准备五项清单。
- 数值变化在对应项目内短暂高亮，例如 `学识 4 → 5（+1）`。

底部对话区：

- 普通状态显示角色名和文字。
- 进入选择状态后，选项直接替换对话文字。
- 选项不覆盖场景人物。
- 2—4 个选项必须完整容纳在底部 216px 区域。
- 关键选项在选项框末尾或右侧显示统一标签 `【关键选择】`。

---

## 五、必须使用的文档与素材文件名

### 1. 美术文件

所有美术文件名和路径以 `docs/04_ART_ASSET_SPEC.md` 为唯一标准。

重点文件示例：

```text
/public/assets/backgrounds/bg_title_winter_station.webp
/public/assets/backgrounds/bg_day01_spring_lab.webp
/public/assets/backgrounds/bg_day06_summer_lab_radio.webp
/public/assets/backgrounds/bg_ending_electric_wave_return.webp
/public/assets/backgrounds/bg_ending_foreign_lamp.webp
/public/assets/characters/char_shen_huaiyuan_neutral.webp
/public/assets/characters/char_nadya_farewell.webp
/public/assets/props/prop_newspaper_lugouqiao_1937.png
/public/assets/ui/ui_top_status_bar.png
/public/assets/ui/ui_dialogue_panel.png
/public/assets/ui/ui_letter_paper.png
/public/assets/ui/ui_historical_event_frame.png
```

不得自行改名。若文件尚未提供：

- 使用带虚线边框的灰色占位块。
- 占位块必须显示缺失的完整文件路径。
- 不得生成无关随机图片。
- 素材补齐后应自动替换，无需修改代码。

### 2. 音频文件

所有音频文件名和路径以 `docs/05_AUDIO_ASSET_SPEC.md` 为唯一标准。

重点文件示例：

```text
/public/assets/audio/bgm/bgm_00_title.ogg
/public/assets/audio/bgm/bgm_06_historical_turn.ogg
/public/assets/audio/ambience/amb_radio_static_loop.ogg
/public/assets/audio/sfx/sfx_letter_unfold.ogg
/public/assets/audio/voice/voice_shen_after_lugouqiao.ogg
```

音频缺失时不得报错或阻断剧情，只记录 warning。

---

## 六、项目目录

请建立并保持类似结构：

```text
src/
├─ app/
│  ├─ router.tsx
│  └─ store.ts
├─ components/
│  ├─ game/
│  ├─ editor/
│  └─ common/
├─ engine/
│  ├─ gameEngine.ts
│  ├─ conditionEvaluator.ts
│  ├─ effectApplier.ts
│  ├─ endingResolver.ts
│  ├─ saveManager.ts
│  ├─ historyManager.ts
│  └─ assetResolver.ts
├─ content/
│  └─ game-data.json
├─ schemas/
│  ├─ gameSchema.ts
│  └─ types.ts
├─ pages/
│  ├─ TitlePage.tsx
│  ├─ GamePage.tsx
│  └─ EditorPage.tsx
├─ styles/
│  ├─ tokens.css
│  └─ global.css
└─ main.tsx
```

不得把编辑器状态、玩家运行状态和剧情原始数据混在同一个 store 中。

---

## 七、游戏数据与逻辑

完整规则见：

- `docs/02_GAME_LOGIC.md`
- `docs/07_DATA_SCHEMA.md`

必须实现：

1. 六项长期数值统一使用 0—10 整数。
2. 显性：学识、身心状态、行动准备。
3. 隐藏：担当、故土牵挂、总体人际信任。
4. 角色独立信任：陈绍衡、娜佳、别洛夫、伊万。
5. 行动准备 = 五项准备状态之和：路线、票证、经费、技术资料、联系人；每项 0—2。
6. 普通选择可回滚。
7. 关键选择需要二次确认，确认后立即自动存档并锁定。
8. 第一层“设法归国 / 暂时留下”只用于查看方案，不锁定；第二层具体执行方式才是最终关键选择。
9. 选项支持：
   - 可见且可用。
   - 可见但锁定，并显示叙事化条件。
   - 根据条件替换为另一版本。
10. 路线倾向只影响第七日内容排序、札记和语气，不直接决定结局。
11. 无中途失败；低数值只会减少后续可行方案和加重代价。

---

## 八、自动存档与历史回滚

V1 只做一个自动存档。

自动保存节点：

- 每个季节开始。
- 关键选择确认后。
- 每个季节结束。
- 进入结局前。

LocalStorage 建议键名：

```text
snow-before-v1-save
snow-before-v1-settings
snow-before-v1-tutorial-dismissed
```

历史面板：

- 从右侧滑出。
- 显示已读旁白、对白、家书纯文字、选择记录和显性数值变化。
- 普通选择节点显示“回退至此”。
- 已确认关键选择显示“已锁定”。
- 回退必须恢复到该选择前的完整状态快照，包括数值、角色信任、准备清单、标记和场景位置。
- 不显示隐藏数值、路线倾向和内部标记名。

---

## 九、文字与播放

- 默认打字机效果。
- 速度设置只有：慢、标准、快。
- 点击一次立即显示当前段全文，再点击进入下一句。
- V1 不做自动播放。
- V1 不做快进已读文本。
- 普通对白约 15—50 字。
- 内心独白约 30—80 字。
- 环境旁白约 40—100 字。
- 家书、章节页、历史事件页使用独立模板。

---

## 十、编辑器必须实现的功能

详细操作目标见 `docs/06_EDITOR_USER_GUIDE.md`。

V1 编辑器必须支持：

1. 新建、复制、删除、重命名场景。
2. 场景模板：
   - `standardDialogue`
   - `freeLayout`
   - `letter`
   - `chapterIntro`
   - `historicalEvent`
   - `seasonJournal`
   - `ending`
3. 选择背景素材。
4. 添加图片元素、文字元素和角色立绘。
5. 鼠标拖拽位置。
6. 边角缩放。
7. 图层前移、后移、锁定和删除。
8. 编辑角色名、正文、文字速度和文本类型。
9. 创建选项，配置：
   - 文本。
   - `isCritical`。
   - 显性和隐藏效果。
   - 角色信任变化。
   - 准备清单变化。
   - 标记增删。
   - 条件。
   - 锁定提示。
   - 跳转场景。
10. 预览当前场景。
11. 从当前场景开始试玩。
12. 导入 JSON。
13. 导出 `game-data.json`。
14. LocalStorage 草稿保存。
15. Undo / Redo，至少 20 步。

V1 不做：

- 多人实时协作。
- 云端账号。
- 旋转。
- 时间轴动画编辑。
- 粒子编辑。
- 地图碰撞编辑。
- 完整 ARPG 地图编辑。

---

## 十一、开发阶段

每完成一个阶段后，停止继续生成，先输出：

- 本阶段修改文件清单。
- 可运行测试步骤。
- 已知问题。
- 下一阶段计划。

### 阶段 1：项目骨架

- Vite + React + TypeScript。
- 路由、Zustand、Zod。
- 基础目录和 1920×1080 缩放容器。
- 只使用测试数据。

### 阶段 2：标准剧情播放器

- 标准场景。
- 顶部状态栏。
- 底部对话区。
- 打字机效果。
- 基础选择与跳转。

### 阶段 3：逻辑系统

- 六项长期数值。
- 角色信任。
- 行动准备。
- 标记与条件。
- 锁定选项与替代选项。

### 阶段 4：存档与历史

- 自动存档。
- 历史面板。
- 普通选择回滚。
- 关键选择确认与锁定。

### 阶段 5：特殊模板

- 家书。
- 章节页。
- 历史事件页。
- 季节札记。
- 结局与旅程回顾。

### 阶段 6：完整剧情数据

- 按 `docs/03_STORY_BLUEPRINT.md` 和 `docs/02_GAME_LOGIC.md` 填充序章和八季。
- 首先打通《电波归途》《异乡长灯》。
- 不能用临时 lorem ipsum 替代关键剧情。

### 阶段 7：编辑器

- 先实现标准模板编辑。
- 再实现自由布局。
- 最后实现导入导出与预览。

### 阶段 8：资源和部署

- 接入全部素材。
- 接入音频。
- 图片懒加载和预加载。
- 生产构建。
- 静态部署说明。

---

## 十二、验收测试

必须至少通过：

1. 新游戏可从头进入第一日。
2. 继续游戏可恢复最近自动存档。
3. 普通选择回滚后，数值和标记完全恢复。
4. 关键选择确认后，历史面板显示已锁定。
5. 学识、状态、准备正确高亮变化。
6. 行动准备总值始终等于五项准备之和。
7. 角色专属帮助只检查对应角色信任。
8. 没有路线时，完整归国方式必须锁定。
9. 主方向始终可浏览，但具体方案受条件控制。
10. 家书关闭后，历史面板仍能查看纯文字。
11. 历史事件页关闭后正确返回剧情。
12. 两个 V1 主结局都能从完整流程触发。
13. 缺失图片或音频不会白屏。
14. 编辑器导出的 JSON 能被玩家端读取。
15. `npm run build` 无 TypeScript 错误。

---

## 十三、禁止事项

- 禁止自行更改角色名、年份、八季结构和数值名。
- 禁止把所有选择做成同样的三条加减分按钮。
- 禁止以最后一次选择覆盖前七日积累。
- 禁止把“留苏”写成简单道德失败。
- 禁止把真实历史人物变成可对话的虚构 NPC。
- 禁止把历史说明塞进普通角色对话框。
- 禁止擅自生成新素材文件名。
- 禁止一次性重写整个项目并删除已有稳定功能。
- 禁止引入不必要的后端、数据库或复杂依赖。

现在先完成“阶段 1：项目骨架”，完成后停止并汇报，不要直接进入后续阶段。
